// supabase/functions/synthetic-data-admin/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Essas duas já vêm injetadas pelo Supabase automaticamente
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Essa você configura em Settings -> Functions -> Configuration
// Name: SERVICE_ROLE_KEY
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

type Mode = "generate" | "clear" | "reset";

interface SyntheticConfig {
  createNewUsers: boolean;
  syntheticUsersCount: number;
  masterDealsCount: number;
  maxTracksPerDeal: number;
  maxTasksPerTrack: number;
}

interface SyntheticRequestBody {
  mode: Mode;
  config: SyntheticConfig;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "POST") {
      return json<ApiResponse>(
        { success: false, error: "Method not allowed" },
        405,
      );
    }

    const body = (await req.json()) as SyntheticRequestBody;

    if (!body || !body.mode || !["generate", "clear", "reset"].includes(body.mode)) {
      return json<ApiResponse>(
        { success: false, error: "Invalid or missing 'mode'" },
        400,
      );
    }

    if (!body.config) {
      return json<ApiResponse>(
        { success: false, error: "Missing 'config'" },
        400,
      );
    }

    // --- Auth via JWT (Supabase) ---
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json<ApiResponse>(
        { success: false, error: "Missing or invalid Authorization header" },
        401,
      );
    }

    const jwt = authHeader.replace("Bearer ", "").trim();
    if (!jwt) {
      return json<ApiResponse>(
        { success: false, error: "Empty JWT" },
        401,
      );
    }

    // Client "user" com anon key + Authorization para validar JWT
    const supabaseUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: "Bearer " + jwt,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();

    if (userError) {
      console.error("Error validating JWT:", userError);
      return json<ApiResponse>(
        { success: false, error: "Invalid JWT" },
        401,
      );
    }

    if (!user) {
      return json<ApiResponse>(
        { success: false, error: "User not found for JWT" },
        401,
      );
    }

    // Checa se é admin via profiles.role
    const { data: profile, error: profileError } = await supabaseUserClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error loading profile:", profileError);
      return json<ApiResponse>(
        { success: false, error: "Error loading user profile" },
        500,
      );
    }

    if (!profile || profile.role !== "admin") {
      return json<ApiResponse>(
        { success: false, error: "Forbidden: admin only" },
        403,
      );
    }

    console.log(
      "Admin authenticated via JWT:",
      user.id,
      user.email ?? "no-email",
    );

    // Client admin com service role (bypass RLS)
    const supabaseAdminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    });

    const result = await runSyntheticOps(
      supabaseAdminClient,
      body.mode,
      body.config,
      user.id,
      user.email ?? null,
    );

    return json<ApiResponse>({ success: true, data: result }, 200);
  } catch (err) {
    console.error("Unexpected error in synthetic-data-admin:", err);
    return json<ApiResponse>(
      { success: false, error: "Internal server error", details: String(err) },
      500,
    );
  }
});

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// =====================================================================
// Core provisório: limpeza de dados sintéticos + stub de geração
// =====================================================================

async function runSyntheticOps(
  supabaseAdminClient: ReturnType<typeof createClient>,
  mode: Mode,
  config: SyntheticConfig,
  actingUserId: string,
  actingUserEmail: string | null,
) {
  console.log("runSyntheticOps called with:", {
    mode,
    config,
    actingUserId,
    actingUserEmail,
  });

  const timestamp = new Date().toISOString();
  const summary: Record<string, unknown> = {
    mode,
    config,
    executedBy: actingUserId,
    executedByEmail: actingUserEmail,
    timestamp,
    cleared: false,
    generated: false,
  };

  // 1) CLEAR: apaga apenas registros com is_synthetic = true
  if (mode === "clear" || mode === "reset") {
    const tables = [
      "custom_field_values",
      "entity_locations",
      "stage_history",
      "notifications",
      "comments",
      "tasks",
      "player_tracks",
      "custom_field_definitions",
      "folders",
      "master_deals",
    ];

    for (const table of tables) {
      console.log("Clearing synthetic data from table:", table);
      const { error } = await supabaseAdminClient
        .from(table)
        .delete()
        .eq("is_synthetic", true);

      if (error) {
        console.error("Error clearing synthetic data from " + table, error);
        throw error;
      }
    }

    // Limpa perfis sintéticos de teste (username prefixo "Teste")
    const { data: syntheticProfiles, error: profilesError } =
      await supabaseAdminClient
        .from("profiles")
        .select("id, username")
        .eq("is_synthetic", true)
        .like("username", "Teste%");

    if (profilesError) {
      console.error("Error loading synthetic profiles:", profilesError);
      throw profilesError;
    }

    if (syntheticProfiles && syntheticProfiles.length > 0) {
      const userIds = syntheticProfiles.map((p) => p.id as string);
      console.log(
        "Deleting synthetic auth users, count:",
        userIds.length,
      );

      for (const uid of userIds) {
        const { error: delError } = await supabaseAdminClient.auth.admin
          .deleteUser(uid);
        if (delError) {
          console.error("Error deleting auth.user " + uid, delError);
        }
      }
    }

    summary.cleared = true;
    console.log(
      "Synthetic data cleanup finished by:",
      actingUserId,
      actingUserEmail ?? "no-email",
    );
  }

  // 2) GENERATE: aqui você pluga o gerador TS depois
  if (mode === "generate" || mode === "reset") {
    // TODO:
    // - criar usuários de teste (auth.admin.createUser com metadata.synthetic = true, username prefixo "Teste")
    // - popular master_deals, player_tracks, tasks, comments, notifications, etc
    //   sempre setando is_synthetic = true
    console.log(
      "Generate/reset mode called, but synthetic data generation is not implemented yet in this function.",
    );
    summary.generated = false;
  }

  return summary;
}
