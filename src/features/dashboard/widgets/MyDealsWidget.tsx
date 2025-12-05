import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDeals } from '@/services/dealService'
import { formatCurrency } from '@/lib/helpers'
import { Briefcase } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'

export function MyDealsWidget() {
    const { data: deals, isLoading } = useDeals()
    const navigate = useNavigate()

    if (isLoading) {
        return <Skeleton className="h-[300px] w-full" />
    }

    const activeDeals = (deals || [])
        .filter(d => d.status === 'active')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5); // Limit to top 5 recent

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Meus Negócios Ativos (Recentes)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                {activeDeals.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                        Nenhum negócio ativo.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeDeals.map(deal => (
                            <div
                                key={deal.id}
                                className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer border"
                                onClick={() => navigate(`/deals/${deal.id}`)}
                            >
                                <div>
                                    <div className="font-medium text-sm">{deal.clientName}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(deal.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold">{formatCurrency(deal.volume)}</div>
                                    <Badge variant="outline" className="text-[10px] h-5">{deal.operationType}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
