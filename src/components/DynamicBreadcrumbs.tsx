import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChevronRight } from 'lucide-react';
import { ROUTE_LABELS } from '@/config/routeLabels';

interface BreadcrumbSegment {
  label: string;
  href?: string;
  isActive?: boolean;
}

export function DynamicBreadcrumbs() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const breadcrumbs = useMemo(() => {
    const segments: BreadcrumbSegment[] = [];
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    // Build path segments
    let currentPath = '';
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += `/${part}`;
      
      const label = ROUTE_LABELS[part] || part;
      const isLast = i === pathParts.length - 1;
      
      segments.push({
        label,
        href: isLast ? undefined : currentPath,
        isActive: isLast && !searchParams.get('category') && !searchParams.get('tab'),
      });
    }
    
    // Add query param segments
    const category = searchParams.get('category');
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');
    
    if (category) {
      const categoryLabel = ROUTE_LABELS[category] || category;
      const isLast = !section && !tab;
      
      segments.push({
        label: categoryLabel,
        href: isLast ? undefined : `${currentPath}?category=${category}`,
        isActive: isLast,
      });
    }
    
    if (section) {
      const sectionLabel = ROUTE_LABELS[section] || section;
      
      segments.push({
        label: sectionLabel,
        isActive: true,
      });
    }
    
    if (tab && !category && !section) {
      const tabLabel = ROUTE_LABELS[tab] || tab;
      
      segments.push({
        label: tabLabel,
        isActive: true,
      });
    }
    
    return segments;
  }, [location.pathname, searchParams]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((segment, index) => (
          <div key={index} className="contents">
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {segment.isActive ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={segment.href}>{segment.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
