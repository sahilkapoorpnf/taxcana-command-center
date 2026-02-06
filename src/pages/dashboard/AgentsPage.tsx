import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/lib/supabase-types';
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
import { Plus, Search, Pencil, Trash2, Loader2, UserCheck, Eye } from 'lucide-react';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    specialization: '',
    commission_rate: '15.00',
    status: 'active',
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data as Agent[]);
    } catch (error: any) {
      toast.error('Error loading agents: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        full_name: agent.full_name,
        email: agent.email,
        phone: agent.phone || '',
        license_number: agent.license_number || '',
        specialization: agent.specialization || '',
        commission_rate: agent.commission_rate?.toString() || '15.00',
        status: agent.status,
      });
    } else {
      setEditingAgent(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        license_number: '',
        specialization: '',
        commission_rate: '15.00',
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
      const saveData = {
        ...formData,
        commission_rate: parseFloat(formData.commission_rate) || 15.00,
      };

      if (editingAgent) {
        const { error } = await supabase
          .from('agents')
          .update(saveData)
          .eq('id', editingAgent.id);

        if (error) throw error;
        toast.success('Agent updated successfully');
      } else {
        const { error } = await supabase
          .from('agents')
          .insert([saveData]);

        if (error) throw error;
        toast.success('Agent added successfully');
      }

      setDialogOpen(false);
      fetchAgents();
    } catch (error: any) {
      toast.error('Error saving agent: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAgent) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', deletingAgent.id);

      if (error) throw error;
      toast.success('Agent deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingAgent(null);
      fetchAgents();
    } catch (error: any) {
      toast.error('Error deleting agent: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/20',
    inactive: 'bg-muted text-muted-foreground border-border',
    suspended: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Agents</h1>
          <p className="text-muted-foreground">Manage tax professionals and agents</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
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
              <TableHead>Agent</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Commission</TableHead>
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
            ) : filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No agents found matching your search' : 'No agents yet. Add your first agent!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{agent.full_name}</p>
                        {agent.license_number && (
                          <p className="text-sm text-muted-foreground">
                            License: {agent.license_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{agent.email}</p>
                    {agent.phone && (
                      <p className="text-sm text-muted-foreground">{agent.phone}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {agent.specialization || 'General'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {agent.commission_rate}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[agent.status] || ''}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setViewingAgent(agent);
                          setViewDialogOpen(true);
                        }}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(agent)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingAgent(agent);
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAgent ? 'Edit Agent' : 'Add New Agent'}
            </DialogTitle>
            <DialogDescription>
              {editingAgent
                ? 'Update agent information'
                : 'Enter the agent details below'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="jane@taxcana.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={formData.license_number}
                  onChange={(e) =>
                    setFormData({ ...formData, license_number: e.target.value })
                  }
                  placeholder="EA12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) =>
                    setFormData({ ...formData, specialization: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Tax</SelectItem>
                    <SelectItem value="business">Business Tax</SelectItem>
                    <SelectItem value="corporate">Corporate Tax</SelectItem>
                    <SelectItem value="estate">Estate & Trust</SelectItem>
                    <SelectItem value="international">International Tax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_rate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingAgent ? 'Update' : 'Add'} Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingAgent?.full_name}? This
              action cannot be undone.
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
        title="Agent Details"
        fields={viewingAgent ? [
          { label: 'Full Name', value: viewingAgent.full_name },
          { label: 'Email', value: viewingAgent.email },
          { label: 'Phone', value: viewingAgent.phone },
          { label: 'License Number', value: viewingAgent.license_number },
          { label: 'Specialization', value: viewingAgent.specialization || 'General' },
          { label: 'Commission Rate', value: `${viewingAgent.commission_rate}%` },
          { label: 'Total Clients', value: viewingAgent.total_clients },
          { label: 'Total Returns', value: viewingAgent.total_returns },
          { label: 'Status', value: viewingAgent.status, type: 'badge' },
          { label: 'Created', value: viewingAgent.created_at, type: 'date' },
        ] : []}
      />
    </div>
  );
}
