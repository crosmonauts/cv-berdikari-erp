import { cn } from '@/lib/utils';

type StatusVariant = 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'default';

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted text-muted-foreground',
  pending: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  default: 'bg-secondary text-secondary-foreground',
};

const dotColors: Record<StatusVariant, string> = {
  active: 'bg-success',
  inactive: 'bg-muted-foreground',
  pending: 'bg-warning',
  success: 'bg-success',
  warning: 'bg-warning',
  default: 'bg-primary',
};

export function StatusBadge({ variant, label, dot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-5',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            dotColors[variant],
          )}
        />
      )}
      {label}
    </span>
  );
}
