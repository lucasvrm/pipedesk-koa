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
import { buildBreadcrumbs } from '@/utils/breadcrumbs';

export function DynamicBreadcrumbs() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const breadcrumbs = useMemo(() => {
    return buildBreadcrumbs(location.pathname, searchParams);
  }, [location.pathname, searchParams]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((segment, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
          <div key={index} className="contents">
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={segment.path}>{segment.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
