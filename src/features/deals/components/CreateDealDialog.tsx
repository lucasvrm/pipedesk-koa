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
import { useStages } from "@/services/pipelineService";
import { usePlayers } from "@/services/playerService";
import { useCompanies, createCompany } from "@/services/companyService";
import { toast } from "sonner";
import PlayerSelect from "@/components/PlayerSelect";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OPERATION_LABELS } from "@/lib/types";
import { useSystemMetadata } from "@/hooks/useSystemMetadata";
import { Check, ChevronsUpDown, Plus, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemMetadata } from "@/hooks/useSystemMetadata";

// Schema de validação
const formSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional(),
  amount: z.string().transform((val) => {
    if (!val) return 0;
    // Remove R$, espaços e converte vírgula para ponto
    const number = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", "."));
    return isNaN(number) ? 0 : number;
  }),
  stage: z.string().min(1, "A fase é obrigatória"),
  player_id: z.string().optional(),

  // New Fields
  operation_type: z.string().min(1, "O tipo de operação é obrigatório"),
  company_id: z.string().optional(),

  // New Company Fields (Conditional validation manually handled or via refine if needed,
  // but for simplicity we'll check logic in onSubmit)
  new_company_name: z.string().optional(),
  new_company_type: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateDealDialogProps {
  children?: React.ReactNode;
  defaultStage?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateDealDialog({ 
  children, 
  defaultStage,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: CreateDealDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { companyTypes, relationshipLevels } = useSystemMetadata();
  
  const { data: stages = [], isLoading: isLoadingStages } = useStages();
  const { data: players = [], isLoading: isLoadingPlayers } = usePlayers();
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const defaultStageId = stages.find(s => s.isDefault)?.id || stages[0]?.id || '';

  // Mode state: 'existing' or 'new'
  const [companyMode, setCompanyMode] = useState<'existing' | 'new'>('existing');
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Use Form com tipo explícito
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "0",
      stage: defaultStageId,
      player_id: "", 
      operation_type: "ccb", // Default valid value
      company_id: "",
      new_company_name: "",
      new_company_type: "incorporadora", // Default valid type
    },
  });

  useEffect(() => {
    if (open) {
       // Reset logic if needed when opening
       if (defaultStageId && form.getValues('stage') !== defaultStageId) {
          form.setValue('stage', defaultStageId);
       }
    }
  }, [open, defaultStageId, form]);

  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => createCompany(data, user?.id || ''),
  });

  const createDealMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["player-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Negócio criado com sucesso!");
      setOpen(false);
      form.reset({
        stage: defaultStageId,
        title: "",
        description: "",
        amount: "0",
        player_id: "",
        operation_type: "ccb",
        company_id: "",
        new_company_name: "",
        new_company_type: "incorporadora"
      });
      setCompanyMode('existing');
    },
    onError: (error) => {
      console.error("Erro ao criar negócio:", error);
      toast.error("Erro ao criar negócio. Tente novamente.");
    },
  });

  async function onSubmit(values: any) {
    if (!user?.id) {
      toast.error("Erro de autenticação. Recarregue a página.");
      return;
    }

    let finalCompanyId = values.company_id;

    // Handle New Company Creation
    if (companyMode === 'new') {
        if (!values.new_company_name) {
            form.setError('new_company_name', { message: "Nome da empresa é obrigatório" });
            return;
        }
        if (!values.new_company_type) {
            form.setError('new_company_type', { message: "Tipo da empresa é obrigatório" });
            return;
        }

        try {
            const newCompany = await createCompanyMutation.mutateAsync({
                name: values.new_company_name,
                type: values.new_company_type,
                relationshipLevel: 'none', // Default
            });
            finalCompanyId = newCompany.id;

            // Auto-fill Client Name if empty or same as company name
            if (!values.title) {
               values.title = newCompany.name;
            }
        } catch (err) {
            toast.error("Falha ao criar empresa. O negócio não foi criado.");
            return;
        }
    }

    createDealMutation.mutate({
      clientName: values.title,
      observations: values.description,
      volume: values.amount,
      createdBy: user.id,
      
      initialStage: values.stage,
      playerId: values.player_id && values.player_id.length > 0 ? values.player_id : undefined,
      
      operationType: values.operation_type, // Now dynamic!
      status: 'active',
      companyId: finalCompanyId && finalCompanyId.length > 0 ? finalCompanyId : undefined
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Negócio (Master Deal)</DialogTitle>
          <DialogDescription>
            Cadastre um novo ativo ou projeto. Vincule a uma empresa existente ou crie uma nova.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* --- COMPANY SECTION --- */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">Empresa / Cliente</h3>
                </div>

                <Tabs value={companyMode} onValueChange={(v) => setCompanyMode(v as 'existing' | 'new')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="existing">Vincular Existente</TabsTrigger>
                        <TabsTrigger value="new">Cadastrar Nova</TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="mt-0">
                         <FormField
                            control={form.control}
                            name="company_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? companies.find((c) => c.id === field.value)?.name
                                                        : "Selecione uma empresa..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar empresa..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                                                    <CommandGroup>
                                                        {companies.map((company) => (
                                                            <CommandItem
                                                                value={company.name} // Search by name
                                                                key={company.id}
                                                                onSelect={() => {
                                                                    form.setValue("company_id", company.id);
                                                                    setComboboxOpen(false);
                                                                    // Optional: Auto-fill Title if empty
                                                                    if (!form.getValues('title')) {
                                                                        form.setValue('title', company.name);
                                                                    }
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        company.id === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {company.name}
                                                                {company.cnpj && <span className="ml-2 text-xs text-muted-foreground">({company.cnpj})</span>}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    <TabsContent value="new" className="mt-0 space-y-3">
                        <FormField
                            control={form.control}
                            name="new_company_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Empresa <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Razão Social ou Nome Fantasia"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                // Auto-fill Title if currently empty or matching previous input
                                                // A simple logic: if title is empty, sync it.
                                                if (!form.getValues('title')) {
                                                    form.setValue('title', e.target.value);
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="new_company_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Empresa <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {companyTypes.filter(t => t.isActive).map(type => (
                                                <SelectItem key={type.code} value={type.code}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* --- DEAL DETAILS --- */}
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

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="operation_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operação <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

            {/* --- PLAYER / INVESTOR --- */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <FormField
                control={form.control}
                name="player_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1">
                      <FormLabel className="font-semibold text-primary flex items-center gap-1">
                        <User className="w-4 h-4"/> Lead Investor (Opcional)
                      </FormLabel>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded border">
                        Cria Track
                      </span>
                    </div>
                    <FormControl>
                      <PlayerSelect
                        players={players}
                        selectedPlayerId={field.value}
                        onSelect={(player) => field.onChange(player.id)}
                        onDeselect={() => field.onChange("")}
                        disabled={isLoadingPlayers}
                        onCheckNew={handleCreateNewPlayer}
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Selecione apenas se já houver um investidor engajado.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              <Button type="submit" disabled={createDealMutation.isPending || isLoadingStages || createCompanyMutation.isPending}>
                {(createDealMutation.isPending || createCompanyMutation.isPending) ? "Processando..." : "Criar Master Deal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
