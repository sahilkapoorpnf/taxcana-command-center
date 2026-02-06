import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaxReturn, Client, Agent, TaxReturnStatus } from '@/lib/supabase-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ViewDialog } from '@/components/management/ViewDialog';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Loader2, FileText, DollarSign, Eye } from 'lucide-react';

export default function TaxReturnsPage() {
  const [returns, setReturns] = useState<TaxReturn[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<TaxReturn | null>(null);
  const [viewingReturn, setViewingReturn] = useState<any | null>(null);
  const [deletingReturn, setDeletingReturn] = useState<TaxReturn | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    agent_id: '',
    tax_year: new Date().getFullYear().toString(),
    return_type: 'Individual',
    status: 'pending' as TaxReturnStatus,
    federal_refund: '',
    state_refund: '',
    federal_owed: '',
    state_owed: '',
    gross_income: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [returnsRes, clientsRes, agentsRes] = await Promise.all([
        supabase
          .from('tax_returns')
          .select(`*, clients(full_name, email), agents(full_name)`)
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('id, full_name').order('full_name'),
        supabase.from('agents').select('id, full_name').eq('status', 'active').order('full_name'),
      ]);

      if (returnsRes.error) throw returnsRes.error;
      setReturns(returnsRes.data as any[]);
      setClients(clientsRes.data as Client[]);
      setAgents(agentsRes.data as Agent[]);
    } catch (error: any) {
      toast.error('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (taxReturn?: TaxReturn) => {
    if (taxReturn) {
      setEditingReturn(taxReturn);
      setFormData({
        client_id: taxReturn.client_id,
        agent_id: taxReturn.agent_id || '',
        tax_year: taxReturn.tax_year.toString(),
        return_type: taxReturn.return_type,
        status: taxReturn.status,
        federal_refund: taxReturn.federal_refund?.toString() || '',
        state_refund: taxReturn.state_refund?.toString() || '',
        federal_owed: taxReturn.federal_owed?.toString() || '',
        state_owed: taxReturn.state_owed?.toString() || '',
        gross_income: taxReturn.gross_income?.toString() || '',
        notes: taxReturn.notes || '',
      });
    } else {
      setEditingReturn(null);
      setFormData({
        client_id: '',
        agent_id: '',
        tax_year: new Date().getFullYear().toString(),
        return_type: 'Individual',
        status: 'pending',
        federal_refund: '',
        state_refund: '',
        federal_owed: '',
        state_owed: '',
        gross_income: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.client_id) {
      toast.error('Client is required');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        client_id: formData.client_id,
        agent_id: formData.agent_id || null,
        tax_year: parseInt(formData.tax_year),
        return_type: formData.return_type,
        status: formData.status,
        federal_refund: formData.federal_refund ? parseFloat(formData.federal_refund) : null,
        state_refund: formData.state_refund ? parseFloat(formData.state_refund) : null,
        federal_owed: formData.federal_owed ? parseFloat(formData.federal_owed) : null,
        state_owed: formData.state_owed ? parseFloat(formData.state_owed) : null,
        gross_income: formData.gross_income ? parseFloat(formData.gross_income) : null,
        notes: formData.notes || null,
      };

      if (editingReturn) {
        const { error } = await supabase
          .from('tax_returns')
          .update(saveData)
          .eq('id', editingReturn.id);

        if (error) throw error;
        toast.success('Tax return updated successfully');
      } else {
        const { error } = await supabase
          .from('tax_returns')
          .insert([saveData]);

        if (error) throw error;
        toast.success('Tax return created successfully');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Error saving tax return: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingReturn) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tax_returns')
        .delete()
        .eq('id', deletingReturn.id);

      if (error) throw error;
      toast.success('Tax return deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingReturn(null);
      fetchData();
    } catch (error: any) {
      toast.error('Error deleting tax return: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredReturns = returns.filter((r: any) =>
    r.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.return_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    in_progress: 'bg-info/10 text-info border-info/20',
    review: 'bg-primary/10 text-primary border-primary/20',
    approved: 'bg-success/10 text-success border-success/20',
    submitted: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Tax Returns</h1>
          <p className="text-muted-foreground">Manage and track tax return filings</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          New Tax Return
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by client or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>Client</TableHead>
              <TableHead>Tax Year</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Refund/Owed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No returns found' : 'No tax returns yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredReturns.map((ret: any) => (
                <TableRow key={ret.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{ret.clients?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{ret.clients?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{ret.tax_year}</span>
                  </TableCell>
                  <TableCell>{ret.return_type}</TableCell>
                  <TableCell>
                    {ret.agents?.full_name || <span className="text-muted-foreground">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    {ret.federal_refund || ret.state_refund ? (
                      <div className="flex items-center gap-1 text-success">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency((ret.federal_refund || 0) + (ret.state_refund || 0))}
                      </div>
                    ) : ret.federal_owed || ret.state_owed ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency((ret.federal_owed || 0) + (ret.state_owed || 0))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[ret.status] || ''}>
                      {ret.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setViewingReturn(ret);
                          setViewDialogOpen(true);
                        }}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(ret)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingReturn(ret);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReturn ? 'Edit Tax Return' : 'New Tax Return'}
            </DialogTitle>
            <DialogDescription>
              {editingReturn ? 'Update tax return details' : 'Create a new tax return'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent">Assigned Agent</Label>
                <Select
                  value={formData.agent_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, agent_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_year">Tax Year</Label>
                <Input
                  id="tax_year"
                  type="number"
                  value={formData.tax_year}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_year: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return_type">Return Type</Label>
                <Select
                  value={formData.return_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, return_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual (1040)</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Corporate">Corporate (1120)</SelectItem>
                    <SelectItem value="Partnership">Partnership (1065)</SelectItem>
                    <SelectItem value="S-Corp">S-Corp (1120S)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as TaxReturnStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gross Income</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.gross_income}
                onChange={(e) =>
                  setFormData({ ...formData, gross_income: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Federal Refund</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.federal_refund}
                  onChange={(e) =>
                    setFormData({ ...formData, federal_refund: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>State Refund</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.state_refund}
                  onChange={(e) =>
                    setFormData({ ...formData, state_refund: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Federal Owed</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.federal_owed}
                  onChange={(e) =>
                    setFormData({ ...formData, federal_owed: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>State Owed</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.state_owed}
                  onChange={(e) =>
                    setFormData({ ...formData, state_owed: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingReturn ? 'Update' : 'Create'} Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tax Return</DialogTitle>
            <DialogDescription>
              Are you sure? This will permanently delete this tax return and all associated documents.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <ViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        title="Tax Return Details"
        fields={viewingReturn ? [
          { label: 'Client', value: viewingReturn.clients?.full_name },
          { label: 'Agent', value: viewingReturn.agents?.full_name || 'Unassigned' },
          { label: 'Tax Year', value: viewingReturn.tax_year },
          { label: 'Return Type', value: viewingReturn.return_type },
          { label: 'Status', value: viewingReturn.status, type: 'badge' },
          { label: 'Gross Income', value: viewingReturn.gross_income, type: 'currency' },
          { label: 'Federal Refund', value: viewingReturn.federal_refund, type: 'currency' },
          { label: 'State Refund', value: viewingReturn.state_refund, type: 'currency' },
          { label: 'Federal Owed', value: viewingReturn.federal_owed, type: 'currency' },
          { label: 'State Owed', value: viewingReturn.state_owed, type: 'currency' },
          { label: 'Notes', value: viewingReturn.notes },
          { label: 'Created', value: viewingReturn.created_at, type: 'date' },
        ] : []}
      />
    </div>
  );
}
