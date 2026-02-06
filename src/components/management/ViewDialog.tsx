import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ViewField {
  label: string;
  value: string | number | null | undefined;
  type?: 'text' | 'currency' | 'date' | 'badge';
  badgeVariant?: string;
}

interface ViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: ViewField[];
}

export function ViewDialog({ open, onOpenChange, title, fields }: ViewDialogProps) {
  const formatValue = (field: ViewField) => {
    if (field.value === null || field.value === undefined || field.value === '') {
      return <span className="text-muted-foreground">-</span>;
    }

    switch (field.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(field.value));
      case 'date':
        return format(new Date(field.value as string), 'MMM d, yyyy');
      case 'badge':
        return (
          <Badge variant="outline" className={field.badgeVariant}>
            {String(field.value).replace('_', ' ')}
          </Badge>
        );
      default:
        return String(field.value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fields.map((field, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 items-start">
              <span className="text-sm font-medium text-muted-foreground">
                {field.label}
              </span>
              <span className="col-span-2 text-sm">{formatValue(field)}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
