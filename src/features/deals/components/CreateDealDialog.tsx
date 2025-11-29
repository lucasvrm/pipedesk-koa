import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDeal } from "@/services/dealService";
import { toast } from "sonner";
import { PlayerSelect } from "@/components/PlayerSelect";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OPERATION_LABELS, OperationType, STAGE_LABELS, PlayerStage } from "@/lib/types"; // Importando Labels Corretos

// Schema de validação
const formSchema = z.object({
  title: z.string().min(1, "O nome do deal é obrigatório"),
  description: z.string().optional(),
  operationType: z.string().min(1, "O tipo de operação é obrigatório"),
  amount: z.string().transform((val) => {
    if (!val) return 0;
    const number = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", "."));
    return isNaN(number) ? 0 : number;
  }),
  stage: z.string().min(1, "A fase é obrigatória"),
  player_id: z.string().optional(),
});

interface CreateDealDialogProps {
  children?: React.ReactNode;
  defaultStage?: PlayerStage; // Tipagem correta
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateDealDialog({ 
  children, 
  defaultStage = "nda", // Default válido
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: CreateDealDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      operationType: "ccb",
      amount: "0",
      stage: defaultStage,
      player_id: "", 
    },
  });

  const createDealMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["player-tracks"] });
      toast.success("Negócio criado com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao criar negócio:", error);
      toast.error("Erro ao criar negócio. Verifique os dados e tente novamente.");
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.id) {
      toast.error("Erro de autenticação. Recarregue a página.");
      return;
    }

    createDealMutation.mutate({
      clientName: values.title,
      observations: values.description,
      volume: values.amount,
      createdBy: user.id,
      operationType: values.operationType as OperationType,
      initialStage: values.stage,
      playerId: values.player_id && values.player_id.length > 0 ? values.player_id : undefined,
      status: 'active'
    });
  }

  const handleCreateNewPlayer = () => {
    setOpen(false);
    navigate("/players"); 
    toast.info("Crie o player na aba de Players e retorne para vincular.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Negócio (Master Deal)</DialogTitle>
          <DialogDescription>
            Cadastre um novo ativo ou projeto estruturado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* 1. Nome do Deal (Alterado) */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Deal <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda Hospital Santa Clara" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grid: Tipo de Operação e Valor */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operação <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {Object.entries(OPERATION_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0,00" 
                        {...field} 
                        onChange={(e) => field.onChange(e)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. Player (Alterado) */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <FormField
                control={form.control}
                name="player_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1">
                      <FormLabel className="font-semibold text-primary">Player (Opcional)</FormLabel>
                      <span className="text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded border">
                        Cria Track Automático
                      </span>
                    </div>
                    <FormControl>
                      <PlayerSelect 
                        value={field.value || ""} 
                        onChange={field.onChange}
                        onCheckNew={handleCreateNewPlayer}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. Fase Inicial (Corrigido para usar STAGE_LABELS) */}
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fase Inicial <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fase" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Agora mapeia as fases reais do sistema */}
                      {Object.entries(STAGE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição e Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes importantes, teses de investimento ou notas iniciais..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createDealMutation.isPending}>
                {createDealMutation.isPending ? "Criando..." : "Criar Master Deal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}