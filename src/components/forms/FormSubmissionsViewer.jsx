import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Eye, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function FormSubmissionsViewer() {
  const [submissions, setSubmissions] = useState([]);
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [filterForm, setFilterForm] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [submissionsData, formsData] = await Promise.all([
        base44.entities.FormSubmission.list('-created_date'),
        base44.entities.FormDefinition.list()
      ]);
      setSubmissions(submissionsData);
      setForms(formsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({ variant: 'destructive', title: 'Failed to load submissions' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleView = (submission) => {
    setSelectedSubmission(submission);
    setShowDialog(true);
  };

  const handleDelete = async (submissionId) => {
    if (!window.confirm('Delete this submission?')) return;

    try {
      await base44.entities.FormSubmission.delete(submissionId);
      toast({ title: 'Submission deleted' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete submission' });
    }
  };

  const handleStatusChange = async (submissionId, newStatus) => {
    try {
      await base44.entities.FormSubmission.update(submissionId, { status: newStatus });
      toast({ title: 'Status updated' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update status' });
    }
  };

  const handleNotesUpdate = async (submissionId, notes) => {
    try {
      await base44.entities.FormSubmission.update(submissionId, { notes });
      toast({ title: 'Notes saved' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save notes' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesForm = filterForm === 'all' || sub.form_definition_id === filterForm;
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesSearch = !searchQuery ||
      sub.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.client_phone?.includes(searchQuery) ||
      sub.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.form_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesForm && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Form Submissions</h2>
        <p className="text-sm text-muted-foreground">View and manage submitted forms</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterForm} onValueChange={setFilterForm}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map(form => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.form_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No submissions found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.form_name}</TableCell>
                      <TableCell>{submission.client_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{submission.client_phone}</div>
                          {submission.client_email && (
                            <div className="text-muted-foreground">{submission.client_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.created_date 
                          ? format(new Date(submission.created_date), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={submission.status}
                          onValueChange={(value) => handleStatusChange(submission.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(submission)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(submission.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Form</Label>
                  <p className="text-sm">{selectedSubmission.form_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge className={getStatusColor(selectedSubmission.status)}>
                    {selectedSubmission.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Client Name</Label>
                  <p className="text-sm">{selectedSubmission.client_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Contact Number</Label>
                  <p className="text-sm">{selectedSubmission.client_phone}</p>
                </div>
                {selectedSubmission.client_email && (
                  <div className="col-span-2">
                    <Label className="text-sm font-semibold">Email</Label>
                    <p className="text-sm">{selectedSubmission.client_email}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <Label className="text-sm font-semibold">Submitted</Label>
                  <p className="text-sm">
                    {selectedSubmission.created_date 
                      ? format(new Date(selectedSubmission.created_date), 'PPpp')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedSubmission.form_data && Object.keys(selectedSubmission.form_data).length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-3 block">Form Data</Label>
                  <div className="space-y-3">
                    {Object.entries(selectedSubmission.form_data).map(([key, value]) => (
                      <div key={key} className="bg-muted/50 p-3 rounded">
                        <Label className="text-xs text-muted-foreground">{key}</Label>
                        <p className="text-sm mt-1">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || 'N/A')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  defaultValue={selectedSubmission.notes || ''}
                  onBlur={(e) => handleNotesUpdate(selectedSubmission.id, e.target.value)}
                  placeholder="Add notes about this submission..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}