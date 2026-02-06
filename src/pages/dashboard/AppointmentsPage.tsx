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
import { Textarea } from '@/components/ui/textarea';
import { ViewDialog } from '@/components/management/ViewDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Search, Pencil, Trash2, Loader2, Calendar, Eye } from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
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
    client_id: '',
    agent_id: '',
    title: '',
    description: '',
    appointment_type: 'consultation',
    scheduled_at: '',
    duration_minutes: '60',
    status: 'scheduled',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, clientsRes, agentsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select(`*, clients(full_name), agents(full_name)`)
          .order('scheduled_at', { ascending: true }),
        supabase.from('clients').select('id, full_name').order('full_name'),
        supabase.from('agents').select('id, full_name').eq('status', 'active').order('full_name'),
      ]);

      if (appointmentsRes.error) throw appointmentsRes.error;
      setAppointments(appointmentsRes.data || []);
      setClients(clientsRes.data || []);
      setAgents(agentsRes.data || []);
    } catch (error: any) {
      toast.error('Error loading appointments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        client_id: item.client_id || '',
        agent_id: item.agent_id || '',
        title: item.title,
        description: item.description || '',
        appointment_type: item.appointment_type,
        scheduled_at: item.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : '',
        duration_minutes: item.duration_minutes?.toString() || '60',
        status: item.status,
        location: item.location || '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        client_id: '',
        agent_id: '',
        title: '',
        description: '',
        appointment_type: 'consultation',
        scheduled_at: '',
        duration_minutes: '60',
        status: 'scheduled',
        location: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.scheduled_at) {
      toast.error('Title and scheduled time are required');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        ...formData,
        client_id: formData.client_id || null,
        agent_id: formData.agent_id || null,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('appointments')
          .update(saveData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Appointment updated');
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert([saveData]);
        if (error) throw error;
        toast.success('Appointment created');
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
        .from('appointments')
        .delete()
        .eq('id', deletingItem.id);
      if (error) throw error;
      toast.success('Appointment deleted');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = appointments.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    scheduled: 'bg-info/10 text-info border-info/20',
    confirmed: 'bg-primary/10 text-primary border-primary/20',
    completed: 'bg-success/10 text-success border-success/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    no_show: 'bg-warning/10 text-warning border-warning/20',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Appointments</h1>
          <p className="text-muted-foreground">Schedule and manage client appointments</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>Appointment</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
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
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No appointments found' : 'No appointments yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">{item.appointment_type}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.clients?.full_name || '-'}</TableCell>
                  <TableCell>{item.agents?.full_name || '-'}</TableCell>
                  <TableCell>
                    <p className="text-sm">{format(new Date(item.scheduled_at), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(item.scheduled_at), 'h:mm a')}</p>
                  </TableCell>
                  <TableCell>{item.duration_minutes} min</TableCell>
                  <TableCell>
                    <Badge className={statusColors[item.status] || ''}>
                      {item.status.replace('_', ' ')}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
            <DialogDescription>{editingItem ? 'Update appointment details' : 'Schedule a new appointment'}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Appointment title" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={formData.agent_id} onValueChange={(value) => setFormData({ ...formData, agent_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (<SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select value={formData.duration_minutes} onValueChange={(value) => setFormData({ ...formData, duration_minutes: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.appointment_type} onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="review">Document Review</SelectItem>
                    <SelectItem value="signing">Signing</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Office, Zoom, etc." />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
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
            <DialogTitle>Delete Appointment</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deletingItem?.title}"?</DialogDescription>
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
        title="Appointment Details"
        fields={viewingItem ? [
          { label: 'Title', value: viewingItem.title },
          { label: 'Client', value: viewingItem.clients?.full_name },
          { label: 'Agent', value: viewingItem.agents?.full_name },
          { label: 'Type', value: viewingItem.appointment_type },
          { label: 'Scheduled', value: viewingItem.scheduled_at, type: 'date' },
          { label: 'Duration', value: `${viewingItem.duration_minutes} minutes` },
          { label: 'Location', value: viewingItem.location },
          { label: 'Status', value: viewingItem.status, type: 'badge' },
          { label: 'Notes', value: viewingItem.notes },
        ] : []}
      />
    </div>
  );
}
