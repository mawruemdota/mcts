import React, { useState, useEffect, useCallback } from 'react';
import { IDPrintRecord, Client } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Plus, Check, FileText, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';

const RecordForm = ({ onSubmitted, clients, editingRecord = null }) => {
    const [formData, setFormData] = useState(editingRecord ? {
        employee_name: editingRecord.employee_name || '',
        position: editingRecord.position || '',
        client_id: editingRecord.client_id || '',
        client_name: editingRecord.client_name || '',
        print_date: editingRecord.print_date || format(new Date(), 'yyyy-MM-dd'),
        unit_price: editingRecord.unit_price || 50,
        id_number: editingRecord.id_number || ''
    } : {
        employee_name: '',
        position: '',
        client_id: '',
        client_name: '',
        print_date: format(new Date(), 'yyyy-MM-dd'),
        unit_price: 50,
        id_number: ''
    });
    const { toast } = useToast();

    const handleClientChange = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        setFormData(prev => ({
            ...prev,
            client_id: clientId,
            client_name: client?.client_name || ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.client_id || !formData.employee_name) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a client and enter an employee name.' });
            return;
        }
        try {
            if (editingRecord) {
                await IDPrintRecord.update(editingRecord.id, formData);
                toast({ title: 'Success', description: 'ID record updated.' });
            } else {
                await IDPrintRecord.create(formData);
                toast({ title: 'Success', description: 'ID record created.' });
            }
            onSubmitted();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to ${editingRecord ? 'update' : 'create'} record.` });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select id="client" value={formData.client_id} onValueChange={handleClientChange}>
                    <SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger>
                    <SelectContent>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.client_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="employee_name">Employee Name</Label>
                <Input id="employee_name" value={formData.employee_name} onChange={e => setFormData({...formData, employee_name: e.target.value})} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="id_number">ID Number</Label>
                <Input id="id_number" value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
            </div>
            <div className="flex justify-end">
                <Button type="submit">{editingRecord ? 'Update' : 'Create'} Record</Button>
            </div>
        </form>
    );
};

export default function IDPrintingPage() {
    const [records, setRecords] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [recordData, clientData] = await Promise.all([
                IDPrintRecord.list('-print_date'),
                Client.list()
            ]);
            setRecords(recordData);
            setClients(clientData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStatusUpdate = async (recordId) => {
        try {
            await IDPrintRecord.update(recordId, { status: 'printed' });
            toast({ title: 'Status Updated', description: 'Record marked as "Printed".' });
            loadData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
        }
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setShowForm(true);
    };

    const handleDelete = async (recordId) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            await IDPrintRecord.delete(recordId);
            toast({ title: 'Deleted', description: 'Record deleted successfully.' });
            loadData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete record.' });
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingRecord(null);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'for_print': return <Badge variant="destructive">For Print</Badge>;
            case 'printed': return <Badge className="bg-blue-500 text-white">Printed</Badge>;
            case 'invoiced': return <Badge variant="success">Invoiced</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-4 md:p-8 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                            <Printer className="w-8 h-8" />
                            ID Card Printing
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage bulk and single ID printing jobs.</p>
                    </div>
                    <Dialog open={showForm} onOpenChange={handleFormClose}>
                        <DialogTrigger asChild>
                            <Button><Plus className="w-4 h-4 mr-2" /> New Record</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingRecord ? 'Edit' : 'Create New'} ID Print Record</DialogTitle>
                            </DialogHeader>
                            <RecordForm clients={clients} editingRecord={editingRecord} onSubmitted={() => { handleFormClose(); loadData(); }} />
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Employee Name</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Print Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center">Loading records...</TableCell></TableRow>
                                ) : records.map(record => (
                                    <TableRow key={record.id}>
                                        <TableCell>{record.client_name}</TableCell>
                                        <TableCell>{record.employee_name}</TableCell>
                                        <TableCell>{record.position}</TableCell>
                                        <TableCell>{format(new Date(record.print_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {record.status === 'for_print' && (
                                                    <Button size="sm" onClick={() => handleStatusUpdate(record.id)}>
                                                        <Check className="w-4 h-4 mr-2" /> Mark as Printed
                                                    </Button>
                                                )}
                                                {record.status === 'invoiced' ? (
                                                    <span className="text-xs text-muted-foreground">Billed in {record.invoice_id}</span>
                                                ) : record.status === 'printed' && (
                                                    <span className="text-xs text-muted-foreground">Ready for invoice</span>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {record.status !== 'invoiced' && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)}>
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {records.length === 0 && !isLoading && (
                            <div className="text-center p-8 text-muted-foreground">
                                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                No ID records found.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}