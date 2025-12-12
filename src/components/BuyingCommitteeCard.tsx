import { Contact, BuyingRole, ContactSentiment } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Crown,
  Megaphone,
  ShieldWarning,
  Trophy,
  User,
  LockKey,
  Envelope,
  LinkedinLogo,
  DotsThreeVertical,
  Question
} from '@phosphor-icons/react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn, safeString, safeStringOptional } from '@/lib/utils'

interface BuyingCommitteeCardProps {
  contact: Contact
  onEdit?: (contact: Contact) => void
}

const ROLE_ICONS: Record<BuyingRole, React.ReactNode> = {
  decision_maker: <Crown weight="fill" className="text-yellow-500" />,
  influencer: <Megaphone weight="fill" className="text-blue-500" />,
  blocker: <ShieldWarning weight="fill" className="text-red-500" />,
  champion: <Trophy weight="fill" className="text-emerald-500" />,
  user: <User weight="fill" className="text-slate-500" />,
  gatekeeper: <LockKey weight="fill" className="text-purple-500" />
}

const ROLE_LABELS: Record<BuyingRole, string> = {
  decision_maker: 'Decisor',
  influencer: 'Influenciador',
  blocker: 'Bloqueador',
  champion: 'Campeão',
  user: 'Usuário',
  gatekeeper: 'Gatekeeper'
}

const SENTIMENT_COLORS: Record<ContactSentiment, string> = {
  positive: 'border-emerald-500',
  neutral: 'border-slate-400',
  negative: 'border-red-500',
  unknown: 'border-slate-200 border-dashed'
}

export function BuyingCommitteeCard({ contact, onEdit }: BuyingCommitteeCardProps) {
  const roleIcon = contact.buyingRole ? ROLE_ICONS[contact.buyingRole] : <Question className="text-muted-foreground" />
  const sentimentColor = contact.sentiment ? SENTIMENT_COLORS[contact.sentiment] : SENTIMENT_COLORS.unknown
  const safeName = safeString(contact.name, 'Contato')
  const safeRole = safeStringOptional(contact.role, 'Sem cargo') ?? 'Sem cargo'
  const initials = safeName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group relative">
      {/* Avatar with Sentiment Border */}
      <div className={cn("relative p-0.5 rounded-full border-2", sentimentColor)}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={undefined} />
          <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
        </Avatar>
        {/* Role Badge */}
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-4 w-4 flex items-center justify-center">
                  {roleIcon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{contact.buyingRole ? ROLE_LABELS[contact.buyingRole] : 'Papel não definido'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-none mb-1">{safeName}</p>
        <p className="text-xs text-muted-foreground truncate">{safeRole}</p>
      </div>

      {/* Actions (Hover only) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {contact.email && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`mailto:${contact.email}`)}>
            <Envelope className="h-3.5 w-3.5" />
          </Button>
        )}
        {contact.linkedin && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => window.open(contact.linkedin, '_blank')}>
            <LinkedinLogo className="h-3.5 w-3.5" />
          </Button>
        )}
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(contact)}>
            <DotsThreeVertical className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
