import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ViewDialog } from '@/components/management/ViewDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Search, Loader2, Activity, Eye, RefreshCw } from 'lucide-react';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error('Error loading activity logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = logs.filter(
    (item) =>
      item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const actionColors: Record<string, string> = {
    create: 'bg-success/10 text-success border-success/20',
    update: 'bg-info/10 text-info border-info/20',
    delete: 'bg-destructive/10 text-destructive border-destructive/20',
    login: 'bg-primary/10 text-primary border-primary/20',
    logout: 'bg-muted text-muted-foreground border-border',
    view: 'bg-warning/10 text-warning border-warning/20',
  };

  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    for (const key of Object.keys(actionColors)) {
      if (lowerAction.includes(key)) {
        return actionColors[key];
      }
    }
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Activity Log</h1>
          <p className="text-muted-foreground">Track all system actions and changes</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search activity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No activity found' : 'No activity logs yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <Badge className={getActionColor(item.action)}>
                          {item.action}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.entity_type ? (
                      <div>
                        <p className="text-sm font-medium capitalize">{item.entity_type}</p>
                        {item.entity_id && (
                          <p className="text-xs text-muted-foreground font-mono">{item.entity_id.slice(0, 8)}...</p>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{format(new Date(item.created_at), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(item.created_at), 'h:mm:ss a')}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{item.ip_address || '-'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewingItem(item); setViewDialogOpen(true); }} title="View Details">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <ViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        title="Activity Details"
        fields={viewingItem ? [
          { label: 'Action', value: viewingItem.action, type: 'badge' },
          { label: 'Entity Type', value: viewingItem.entity_type },
          { label: 'Entity ID', value: viewingItem.entity_id },
          { label: 'User ID', value: viewingItem.user_id },
          { label: 'IP Address', value: viewingItem.ip_address },
          { label: 'Details', value: viewingItem.details ? JSON.stringify(viewingItem.details, null, 2) : null },
          { label: 'Timestamp', value: viewingItem.created_at, type: 'date' },
        ] : []}
      />
    </div>
  );
}
