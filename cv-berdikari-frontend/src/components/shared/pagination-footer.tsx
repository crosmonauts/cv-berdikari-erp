import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationFooterProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function PaginationFooter({
  currentPage, totalPages, totalItems, onPageChange, label = 'ITEM',
}: PaginationFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-muted/30 border-t border-border gap-4">
      <span className="text-xs font-medium text-muted-foreground tracking-wide">
        Halaman <span className="font-semibold text-foreground">{currentPage}</span> dari{' '}
        <span className="font-semibold text-foreground">{totalPages}</span>
        <span className="mx-1.5 text-border">|</span>
        Total <span className="font-semibold text-foreground">{totalItems}</span> {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            'h-8 px-3 text-xs font-semibold text-muted-foreground rounded-lg',
            'ring-1 ring-border hover:bg-white hover:text-foreground',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
            'transition-colors flex items-center gap-1.5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            'h-8 px-3 text-xs font-semibold text-muted-foreground rounded-lg',
            'ring-1 ring-border hover:bg-white hover:text-foreground',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
            'transition-colors flex items-center gap-1.5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          )}
        >
          Berikutnya <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
