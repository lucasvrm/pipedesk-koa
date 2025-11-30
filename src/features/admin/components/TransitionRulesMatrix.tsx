import { useState } from 'react';
import { useTransitionRules, useToggleTransitionRule } from '@/services/transitionService';
import { PipelineStage } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface TransitionRulesMatrixProps {
  stages: PipelineStage[];
}

export default function TransitionRulesMatrix({ stages }: TransitionRulesMatrixProps) {
  const { data: rules = [] } = useTransitionRules();
  const toggleMutation = useToggleTransitionRule();

  const isTransitionAllowed = (fromId: string, toId: string) => {
    // If from == to, usually allowed (re-update)
    if (fromId === toId) return true;

    const rule = rules.find(r => r.fromStage === fromId && r.toStage === toId);
    // Default is allowed if no rule exists, unless we want strict mode.
    // The prompt implied configuring what is "allowed/forbidden".
    // If we assume a blank slate means everything allowed, then toggling off creates a "false" record.
    // If rule exists, return its enabled status.
    // If NO rule exists, default to true.
    return rule ? rule.enabled : true;
  };

  const handleToggle = async (fromId: string, toId: string, currentVal: boolean) => {
    try {
      await toggleMutation.mutateAsync({
        fromStage: fromId,
        toStage: toId,
        enabled: !currentVal
      });
      // toast.success("Regra atualizada"); // Too noisy for quick toggles
    } catch (error) {
      toast.error("Erro ao salvar regra");
    }
  };

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
           Matriz de Transição
           <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">De (Linha) → Para (Coluna)</span>
        </CardTitle>
        <CardDescription>
          Defina quais mudanças de fase são permitidas. Desative transições para bloquear o fluxo incorreto.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] bg-muted/50">Origem \ Destino</TableHead>
              {sortedStages.map(stage => (
                <TableHead key={stage.id} className="text-center min-w-[80px]">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-medium" style={{ color: stage.color }}>{stage.name}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStages.map(fromStage => (
              <TableRow key={fromStage.id}>
                <TableCell className="font-medium bg-muted/20">
                    <span style={{ color: fromStage.color }}>{fromStage.name}</span>
                </TableCell>
                {sortedStages.map(toStage => {
                  const allowed = isTransitionAllowed(fromStage.id, toStage.id);
                  const isSame = fromStage.id === toStage.id;

                  return (
                    <TableCell key={toStage.id} className="text-center p-2">
                      {isSame ? (
                        <div className="flex justify-center opacity-20"><Info size={16} /></div>
                      ) : (
                        <div className="flex justify-center">
                            <Switch
                                checked={allowed}
                                onCheckedChange={() => handleToggle(fromStage.id, toStage.id, allowed)}
                                className="scale-75 data-[state=checked]:bg-green-500"
                            />
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
