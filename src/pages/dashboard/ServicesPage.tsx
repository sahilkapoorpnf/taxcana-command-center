import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Search, Pencil, Trash2, Loader2, Package, Eye, DollarSign } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
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
    name: '',
    description: '',
    category: 'individual',
    price: '',
    duration_estimate: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast.error('Error loading services: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        category: item.category,
        price: item.price.toString(),
        duration_estimate: item.duration_estimate || '',
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        category: 'individual',
        price: '',
        duration_estimate: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('services')
          .update(saveData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Service updated');
      } else {
        const { error } = await supabase
          .from('services')
          .insert([saveData]);
        if (error) throw error;
        toast.success('Service created');
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
        .from('services')
        .delete()
        .eq('id', deletingItem.id);
      if (error) throw error;
      toast.success('Service deleted');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = services.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryColors: Record<string, string> = {
    individual: 'bg-info/10 text-info border-info/20',
    business: 'bg-primary/10 text-primary border-primary/20',
    corporate: 'bg-warning/10 text-warning border-warning/20',
    consultation: 'bg-success/10 text-success border-success/20',
    specialty: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Services & Pricing</h1>
          <p className="text-muted-foreground">Manage your service offerings and pricing</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>Service</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
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
                  {searchTerm ? 'No services found' : 'No services yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryColors[item.category] || ''}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-semibold">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(item.price)}
                    </div>
                  </TableCell>
                  <TableCell>{item.duration_estimate || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                      {item.is_active ? 'Active' : 'Inactive'}
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
            <DialogTitle>{editingItem ? 'Edit Service' : 'Add Service'}</DialogTitle>
            <DialogDescription>{editingItem ? 'Update service details' : 'Create a new service offering'}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Individual Tax Return" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Brief description of the service" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="specialty">Specialty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration Estimate</Label>
                <Input value={formData.duration_estimate} onChange={(e) => setFormData({ ...formData, duration_estimate: e.target.value })} placeholder="e.g., 2-3 days" />
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center h-10">
                  <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                  <span className="ml-2 text-sm">{formData.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deletingItem?.name}"?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <ViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        title="Service Details"
        fields={viewingItem ? [
          { label: 'Name', value: viewingItem.name },
          { label: 'Description', value: viewingItem.description },
          { label: 'Category', value: viewingItem.category, type: 'badge' },
          { label: 'Price', value: viewingItem.price, type: 'currency' },
          { label: 'Duration Estimate', value: viewingItem.duration_estimate },
          { label: 'Status', value: viewingItem.is_active ? 'Active' : 'Inactive', type: 'badge' },
          { label: 'Created', value: viewingItem.created_at, type: 'date' },
        ] : []}
      />
    </div>
  );
}
