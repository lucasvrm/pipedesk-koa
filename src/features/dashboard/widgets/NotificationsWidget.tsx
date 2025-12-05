import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from '@phosphor-icons/react'

export function NotificationsWidget() {
    // TODO: Connect to real notification count from Context or Service
    // For now, static mock as per original DashboardPage
    const unreadCount = 3;
    const totalCount = 12;

    return (
        <Card className="bg-primary/5 border-primary/10 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">{unreadCount} não lidas</p>
          </CardContent>
        </Card>
    )
}
