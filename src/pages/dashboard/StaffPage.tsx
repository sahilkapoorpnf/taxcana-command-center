import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { ViewDialog } from '@/components/management/ViewDialog';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Loader2, Users, Eye } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'staff',
    department: '',
    status: 'active',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      toast.error('Error loading staff: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        full_name: item.full_name,
        email: item.email,
        phone: item.phone || '',
        role: item.role,
        department: item.department || '',
        status: item.status,
      });
    } else {
      setEditingItem(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'staff',
        department: '',
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('staff')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Staff member updated');
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([formData]);
        if (error) throw error;
        toast.success('Staff member added');
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
    if (!deletingItem) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', deletingItem.id);
      if (error) throw error;
      toast.success('Staff member removed');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = staff.filter(
    (item) =>
      item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    superadmin: 'bg-destructive/10 text-destructive border-destructive/20',
    admin: 'bg-warning/10 text-warning border-warning/20',
    staff: 'bg-info/10 text-info border-info/20',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/20',
    inactive: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Staff & Users</h1>
          <p className="text-muted-foreground">Manage dashboard users and their roles</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>Staff Member</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No staff found' : 'No staff members yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-medium">{item.full_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{item.email}</p>
                    {item.phone && <p className="text-sm text-muted-foreground">{item.phone}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[item.role] || ''}>
                      {item.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.department || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[item.status] || ''}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setViewingItem(item); setViewDialogOpen(true); }} title="View">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }} title="Delete">
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
            <DialogTitle>{editingItem ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            <DialogDescription>{editingItem ? 'Update staff details' : 'Add a new team member'}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@taxcana.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g., Accounting" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Member</DialogTitle>
            <DialogDescription>Are you sure you want to remove {deletingItem?.full_name}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <ViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        title="Staff Details"
        fields={viewingItem ? [
          { label: 'Full Name', value: viewingItem.full_name },
          { label: 'Email', value: viewingItem.email },
          { label: 'Phone', value: viewingItem.phone },
          { label: 'Role', value: viewingItem.role, type: 'badge' },
          { label: 'Department', value: viewingItem.department },
          { label: 'Status', value: viewingItem.status, type: 'badge' },
          { label: 'Created', value: viewingItem.created_at, type: 'date' },
        ] : []}
      />
    </div>
  );
}
