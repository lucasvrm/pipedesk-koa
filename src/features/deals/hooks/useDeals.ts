import { useQuery } from '@tanstack/react-query';
import { getDeals } from '@/services/dealService';

export function useDeals(tagIds?: string[]) {
  return useQuery({
    queryKey: ['deals', tagIds], // Adicionado tagIds na chave para cache correto
    queryFn: () => getDeals(tagIds), // CORREÇÃO: Passar argumento explicitamente
  });
}