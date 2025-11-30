import { useState, useEffect } from "react";
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
import { useStages } from "@/services/pipelineService"; // NOVO: Importa o hook dinâmico
import { toast } from "sonner";
import PlayerSelect from "@/components/PlayerSelect";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Schema de validação
const formSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"), // Mapeia para clientName
  description: z.string().optional(), // Mapeia para observations
  amount: z.string().transform((val) => {
    if (!val) return 0;
    // Remove R$, espaços e converte vírgula para ponto
    const number = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", "."));
    return isNaN(number) ? 0 : number;
  }), // Mapeia para volume
  stage: z.string().min(1, "A fase é obrigatória"),
  player_id: z.string().optional(), // Opcional: só cria track se preenchido
});

interface CreateDealDialogProps {
  children?: React.ReactNode;
  defaultStage?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateDealDialog({ 
  children, 
  defaultStage, // Não usado diretamente, será sobrescrito pelo estágio default dinâmico
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: CreateDealDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // NOVO: Busca estágios dinâmicos
  const { data: stages = [], isLoading: isLoadingStages } = useStages();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  // Determina o estágio default para o formulário
  const defaultStageId = stages.find(s => s.isDefault)?.id || stages[0]?.id || '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "0",
      stage: defaultStageId, // Usa o estágio dinâmico
      player_id: "", 
    },
  });

  // Garante que o valor default é setado corretamente após o carregamento dos estágios
  useEffect(() => {
    if (open && defaultStageId && form.getValues('stage') !== defaultStageId) {
        form.setValue('stage', defaultStageId, { shouldValidate: true });
    }
  }, [open, defaultStageId, form]);


  const createDealMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["player-tracks"] });
      toast.success("Negócio criado com sucesso!");
      setOpen(false);
      form.reset({ stage: defaultStageId, title: "", description: "", amount: "0", player_id: "" });
    },
    onError: (error) => {
      console.error("Erro ao criar negócio:", error);
      toast.error("Erro ao criar negócio. Tente novamente.");
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
      
      initialStage: values.stage,
      playerId: values.player_id && values.player_id.length > 0 ? values.player_id : undefined,
      
      operationType: 'acquisition',
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
            Cadastre um novo ativo ou projeto. Se já houver um investidor líder, selecione-o abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Título do Negócio */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Projeto / Ativo <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda Hospital Santa Clara" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seletor de Player (Opcional) */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <FormField
                control={form.control}
                name="player_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1">
                      <FormLabel className="font-semibold text-primary">Lead Investor (Opcional)</FormLabel>
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
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Deixe vazio se estiver apenas cadastrando o ativo para prospecção futura.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Grid de Valor e Fase */}
            <div className="grid grid-cols-2 gap-4">
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

              {/* CAMPO DE ESTÁGIO DINÂMICO */}
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fase Inicial <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingStages}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingStages ? (
                           <div className="p-2 text-center text-muted-foreground text-xs">Carregando estágios...</div>
                        ) : (
                            stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                    {stage.name} ({stage.probability}%)
                                </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      className="resize-none min-h-[100px]"
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
              <Button type="submit" disabled={createDealMutation.isPending || isLoadingStages}>
                {createDealMutation.isPending ? "Processando..." : "Criar Master Deal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}