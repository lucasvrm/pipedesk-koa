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
import { useCompanies } from "@/services/companyService";
import { toast } from "sonner";
import { PlayerSelect } from "@/components/PlayerSelect";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OPERATION_LABELS, OperationType, STAGE_LABELS, PlayerStage } from "@/lib/types";
import { Briefcase, Buildings, Coins } from "@phosphor-icons/react";

const formSchema = z.object({
  title: z.string().min(1, "O nome do deal é obrigatório"),
  description: z.string().optional(),
  operationType: z.string().min(1, "O tipo de operação é obrigatório"),
  companyId: z.string().min(1, "O cliente é obrigatório"),
  amount: z.string().transform((val) => {
    if (!val) return 0;
    const cleanValue = val.replace(/\./g, "").replace(",", ".");
    const number = parseFloat(cleanValue);
    return isNaN(number) ? 0 : number;
  }),
  stage: z.string().min(1, "A fase é obrigatória"),
  player_id: z.string().optional(),
});

interface CreateDealDialogProps {
  children?: React.ReactNode;
  defaultStage?: PlayerStage;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateDealDialog({ 
  children, 
  defaultStage = "nda",
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: CreateDealDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: companies } = useCompanies();
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      operationType: "ccb",
      companyId: "",
      amount: "0,00",
      stage: defaultStage,
      player_id: "", 
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    
    if (value === "") {
      form.setValue("amount", "");
      return;
    }

    const floatValue = parseFloat(value) / 100;
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(floatValue);

    form.setValue("amount", formatted);
  };

  const createDealMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["player-tracks"] });
      toast.success("Deal criado com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao criar deal:", error);
      toast.error("Erro ao criar deal. Verifique os dados e tente novamente.");
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
      companyId: values.companyId,
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl">Novo Deal</DialogTitle>
          <DialogDescription>
            Cadastre um novo ativo ou projeto estruturado no pipeline.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary/80">
                <Briefcase size={18} />
                <span>Dados da Operação</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nome do Deal <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CRI Corporativo - Grupo Alpha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        <SelectContent className="max-h-[250px]">
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
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 border-t pt-4">
                <Buildings size={18} />
                <span>Participantes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente (Empresa) <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/20">
                            <SelectValue placeholder="Selecione o cliente..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px]">
                          {companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
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
                  name="player_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player (Opcional)</FormLabel>
                      <FormControl>
                        <PlayerSelect 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          onCheckNew={handleCreateNewPlayer}
                        />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground pt-1">
                        *Cria um track automático se selecionado.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 border-t pt-4">
                <Coins size={18} />
                <span>Detalhes Financeiros</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume Estimado (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0,00" 
                          {...field} 
                          onChange={handleAmountChange}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
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
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createDealMutation.isPending} className="px-8">
                {createDealMutation.isPending ? "Criando..." : "Criar Deal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}