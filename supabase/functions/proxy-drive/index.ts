
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TARGET_BASE_URL = Deno.env.get('PD_GOOGLE_BASE_URL') || 'https://google-api-xwhd.onrender.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id, x-user-role',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    // Extract the path after /proxy-drive/
    // Example: https://.../functions/v1/proxy-drive/drive/deal/123 -> /drive/deal/123
    const path = url.pathname.replace(/^\/proxy-drive/, '')
    const targetUrl = `${TARGET_BASE_URL}${path}${url.search}`

    console.log(`[Proxy] Forwarding ${req.method} request to: ${targetUrl}`)

    // Forward the request headers (filtering out host-specific ones)
    const headers = new Headers(req.headers)
    headers.delete('host')
    headers.delete('origin')
    headers.delete('referer')

    // Explicitly ensure our custom auth headers are passed if present
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')

    if (userId) headers.set('x-user-id', userId)
    if (userRole) headers.set('x-user-role', userRole)

    const init: RequestInit = {
      method: req.method,
      headers,
    }

    // Forward body for non-GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.blob()
      init.body = body
    }

    const response = await fetch(targetUrl, init)

    // Create a new response with CORS headers
    const responseHeaders = new Headers(response.headers)
    // Remove conflicting CORS headers from the target response if any
    responseHeaders.delete('Access-Control-Allow-Origin')

    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value)
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('[Proxy] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
