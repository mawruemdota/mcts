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
import { Printer, Plus, Check, FileText } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';

const NewRecordForm = ({ onSubmitted, clients }) => {
    const [formData, setFormData] = useState({
        employee_name: '',
        position: '',
        client_id: '',
        client_name: '',
        print_date: format(new Date(), 'yyyy-MM-dd'),
        unit_price: 50
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
            await IDPrintRecord.create(formData);
            toast({ title: 'Success', description: 'ID record created.' });
            onSubmitted();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create record.' });
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
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
            </div>
            <div className="flex justify-end">
                <Button type="submit">Create Record</Button>
            </div>
        </form>
    );
};

export default function IDPrintingPage() {
    const [records, setRecords] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
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
                    <Dialog open={showForm} onOpenChange={setShowForm}>
                        <DialogTrigger asChild>
                            <Button><Plus className="w-4 h-4 mr-2" /> New Record</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New ID Print Record</DialogTitle>
                            </DialogHeader>
                            <NewRecordForm clients={clients} onSubmitted={() => { setShowForm(false); loadData(); }} />
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
                                            {record.status === 'for_print' ? (
                                                <Button size="sm" onClick={() => handleStatusUpdate(record.id)}>
                                                    <Check className="w-4 h-4 mr-2" /> Mark as Printed
                                                </Button>
                                            ) : record.status === 'invoiced' ? (
                                                <span className="text-xs text-muted-foreground">Billed in {record.invoice_id}</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Ready for invoice</span>
                                            )}
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