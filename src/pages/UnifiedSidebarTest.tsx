import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function UnifiedSidebarTest() {
  return (
    <TooltipProvider>
      <div className="h-screen">
        <UnifiedSidebar />
      </div>
    </TooltipProvider>
  );
}
