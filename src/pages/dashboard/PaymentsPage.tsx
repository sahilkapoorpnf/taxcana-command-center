import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Payment, PaymentStatus } from '@/lib/supabase-types';
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
import { format } from 'date-fns';
import { Plus, Search, Pencil, Trash2, Loader2, CreditCard, DollarSign, Eye } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [viewingPayment, setViewingPayment] = useState<any | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    payment_type: 'Service Fee',
    payment_method: '',
    status: 'pending' as PaymentStatus,
    transaction_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, clientsRes] = await Promise.all([
        supabase
          .from('payments')
          .select(`*, clients(full_name)`)
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('id, full_name').order('full_name'),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      setPayments(paymentsRes.data);
      setClients(clientsRes.data || []);
    } catch (error: any) {
      toast.error('Error loading payments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (payment?: any) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        client_id: payment.client_id,
        amount: payment.amount.toString(),
        payment_type: payment.payment_type,
        payment_method: payment.payment_method || '',
        status: payment.status,
        transaction_id: payment.transaction_id || '',
        notes: payment.notes || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        client_id: '',
        amount: '',
        payment_type: 'Service Fee',
        payment_method: '',
        status: 'pending',
        transaction_id: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.client_id || !formData.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        ...formData,
        amount: parseFloat(formData.amount),
        processed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      };

      if (editingPayment) {
        const { error } = await supabase
          .from('payments')
          .update(saveData)
          .eq('id', editingPayment.id);

        if (error) throw error;
        toast.success('Payment updated');
      } else {
        const { error } = await supabase
          .from('payments')
          .insert([saveData]);

        if (error) throw error;
        toast.success('Payment recorded');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPayment) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', deletingPayment.id);

      if (error) throw error;
      toast.success('Payment deleted');
      setDeleteDialogOpen(false);
      setDeletingPayment(null);
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    processing: 'bg-info/10 text-info border-info/20',
    completed: 'bg-success/10 text-success border-success/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
    refunded: 'bg-muted text-muted-foreground border-border',
  };

  const formatCurrency = (value: number) => {
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
          <h1 className="text-2xl font-display font-bold">Payments</h1>
          <p className="text-muted-foreground">Track payments and transactions</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search payments..."
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
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
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
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No payments found' : 'No payments yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.clients?.full_name}</p>
                        {payment.transaction_id && (
                          <p className="text-xs text-muted-foreground">
                            #{payment.transaction_id}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-semibold">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(payment.amount)}
                    </div>
                  </TableCell>
                  <TableCell>{payment.payment_type}</TableCell>
                  <TableCell>{payment.payment_method || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(payment.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[payment.status] || ''}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setViewingPayment(payment);
                          setViewDialogOpen(true);
                        }}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(payment)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingPayment(payment);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? 'Edit Payment' : 'Record Payment'}
            </DialogTitle>
            <DialogDescription>
              {editingPayment ? 'Update payment details' : 'Record a new payment'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Client *</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Service Fee">Service Fee</SelectItem>
                    <SelectItem value="Tax Payment">Tax Payment</SelectItem>
                    <SelectItem value="Refund Advance">Refund Advance</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as PaymentStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input
                value={formData.transaction_id}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_id: e.target.value })
                }
                placeholder="TXN12345"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingPayment ? 'Update' : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment record?
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
        title="Payment Details"
        fields={viewingPayment ? [
          { label: 'Client', value: viewingPayment.clients?.full_name },
          { label: 'Amount', value: viewingPayment.amount, type: 'currency' },
          { label: 'Payment Type', value: viewingPayment.payment_type },
          { label: 'Payment Method', value: viewingPayment.payment_method },
          { label: 'Status', value: viewingPayment.status, type: 'badge' },
          { label: 'Transaction ID', value: viewingPayment.transaction_id },
          { label: 'Notes', value: viewingPayment.notes },
          { label: 'Created', value: viewingPayment.created_at, type: 'date' },
          { label: 'Processed At', value: viewingPayment.processed_at, type: 'date' },
        ] : []}
      />
    </div>
  );
}
