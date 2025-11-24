import { useQuery } from '@tanstack/react-query';
import { getDeals } from '@/services/dealService';

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: getDeals,
  });
}