import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  muted: 'badge-muted',
  purple: 'badge bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30',
};

export default function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <span className={clsx('badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
}

/** Map TransactionStatus to Badge variant */
export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    VERIFIED: 'success',
    UNUSED: 'info',
    MANUAL_REVIEW: 'warning',
    DUPLICATE: 'danger',
  };
  return (
    <Badge variant={variantMap[status] ?? 'muted'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
