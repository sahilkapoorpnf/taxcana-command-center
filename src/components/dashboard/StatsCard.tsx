import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex items-center text-sm font-medium',
                  isPositive && 'text-success',
                  isNegative && 'text-destructive'
                )}
              >
                {isPositive && <TrendingUp className="w-3.5 h-3.5 mr-0.5" />}
                {isNegative && <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-muted-foreground">
                {changeLabel || 'vs last month'}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
