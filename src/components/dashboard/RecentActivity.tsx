import { formatDistanceToNow } from 'date-fns';
import { FileText, UserPlus, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'return_filed' | 'client_added' | 'payment_received' | 'return_approved' | 'document_uploaded';
  description: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  return_filed: FileText,
  client_added: UserPlus,
  payment_received: CreditCard,
  return_approved: CheckCircle,
  document_uploaded: AlertCircle,
};

const activityColors = {
  return_filed: 'bg-info/10 text-info',
  client_added: 'bg-success/10 text-success',
  payment_received: 'bg-primary/10 text-primary',
  return_approved: 'bg-success/10 text-success',
  document_uploaded: 'bg-warning/10 text-warning',
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-display font-semibold">Recent Activity</h3>
      </div>
      <div className="divide-y divide-border">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            return (
              <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div
                  className={cn(
                    'p-2.5 rounded-lg',
                    activityColors[activity.type]
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
