import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Document, DocumentStatus } from '@/lib/supabase-types';
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
import { Plus, Search, Pencil, Trash2, Loader2, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    document_type: '',
    status: 'uploaded' as DocumentStatus,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, clientsRes] = await Promise.all([
        supabase
          .from('documents')
          .select(`*, clients(full_name)`)
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('id, full_name').order('full_name'),
      ]);

      if (docsRes.error) throw docsRes.error;
      setDocuments(docsRes.data);
      setClients(clientsRes.data || []);
    } catch (error: any) {
      toast.error('Error loading documents: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (doc?: any) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        client_id: doc.client_id,
        name: doc.name,
        document_type: doc.document_type,
        status: doc.status,
        notes: doc.notes || '',
      });
    } else {
      setEditingDoc(null);
      setFormData({
        client_id: '',
        name: '',
        document_type: '',
        status: 'uploaded',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.client_id || !formData.name || !formData.document_type) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingDoc) {
        const { error } = await supabase
          .from('documents')
          .update(formData)
          .eq('id', editingDoc.id);

        if (error) throw error;
        toast.success('Document updated successfully');
      } else {
        const { error } = await supabase
          .from('documents')
          .insert([formData]);

        if (error) throw error;
        toast.success('Document added successfully');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Error saving document: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', deletingDoc.id);

      if (error) throw error;
      toast.success('Document deleted');
      setDeleteDialogOpen(false);
      setDeletingDoc(null);
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (doc: any, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: verified ? 'verified' : 'rejected',
          verified_at: new Date().toISOString(),
        })
        .eq('id', doc.id);

      if (error) throw error;
      toast.success(`Document ${verified ? 'verified' : 'rejected'}`);
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const filteredDocs = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    uploaded: 'bg-info/10 text-info border-info/20',
    verified: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    missing: 'bg-warning/10 text-warning border-warning/20',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Documents</h1>
          <p className="text-muted-foreground">Track and manage client documents</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
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
              <TableHead>Document</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded</TableHead>
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
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No documents found' : 'No documents yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.clients?.full_name}</TableCell>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(doc.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[doc.status] || ''}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {doc.status === 'uploaded' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerify(doc, true)}
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4 text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerify(doc, false)}
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setViewingDoc(doc);
                          setViewDialogOpen(true);
                        }}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(doc)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingDoc(doc);
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
              {editingDoc ? 'Edit Document' : 'Add Document'}
            </DialogTitle>
            <DialogDescription>
              {editingDoc ? 'Update document details' : 'Add a new document record'}
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

            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., W-2 Form 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, document_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="W-2">W-2</SelectItem>
                    <SelectItem value="1099">1099</SelectItem>
                    <SelectItem value="1098">1098</SelectItem>
                    <SelectItem value="ID">ID/Passport</SelectItem>
                    <SelectItem value="SSN">SSN Card</SelectItem>
                    <SelectItem value="Bank Statement">Bank Statement</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as DocumentStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {editingDoc ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingDoc?.name}"?
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
        title="Document Details"
        fields={viewingDoc ? [
          { label: 'Document Name', value: viewingDoc.name },
          { label: 'Client', value: viewingDoc.clients?.full_name },
          { label: 'Document Type', value: viewingDoc.document_type },
          { label: 'Status', value: viewingDoc.status, type: 'badge' },
          { label: 'Notes', value: viewingDoc.notes },
          { label: 'Uploaded', value: viewingDoc.created_at, type: 'date' },
          { label: 'Verified At', value: viewingDoc.verified_at, type: 'date' },
        ] : []}
      />
    </div>
  );
}
