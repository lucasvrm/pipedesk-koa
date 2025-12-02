import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SharedListLayoutProps } from "@/components/types/listLayout"

export function SharedListLayout({
  title,
  primaryActions,
  filtersBar,
  children,
  pagination,
  className,
  contentClassName,
}: SharedListLayoutProps) {
  const showPageSizeControl =
    pagination?.viewMode !== "grid" &&
    pagination?.pageSizeOptions?.length &&
    typeof pagination.onPageSizeChange === "function"

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {typeof title === "string" ? (
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          ) : (
            title
          )}
        </div>

        {primaryActions && (
          <div className="flex flex-wrap items-center gap-2">{primaryActions}</div>
        )}
      </div>

      {filtersBar && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          {filtersBar}
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-background shadow-sm",
          contentClassName
        )}
      >
        <div className="overflow-x-auto">{children}</div>

        {pagination && (
          <div className="flex flex-wrap items-center gap-3 border-t px-4 py-3">
            {showPageSizeControl ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {pagination.itemsLabel ?? "Itens por página"}
                </span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) =>
                    pagination.onPageSizeChange?.(Number(value))
                  }
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pagination.pageSizeOptions?.map((option) => (
                      <SelectItem
                        key={option}
                        value={String(option)}
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                onClick={pagination.onPrevious}
                disabled={pagination.disablePrevious}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={pagination.onNext}
                disabled={pagination.disableNext}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
