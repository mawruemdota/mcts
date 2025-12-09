import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function CreateInvoiceModal({ isOpen, onClose, jobId: initialJobId }) {
    const { toast } = useToast();

    const [clients, setClients] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedJobIds, setSelectedJobIds] = useState([]);
    const [selectedClientName, setSelectedClientName] = useState('');
    const [selectedClientEmail, setSelectedClientEmail] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [formData, setFormData] = useState({
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        amount: 0,
        notes: '',
        items: [],
    });

    const loadClientsAndJobs = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const allClients = await base44.entities.Client.list();
            setClients(allClients);

            if (initialJobId) {
                const jobData = await base44.entities.Job.filter({ id: initialJobId });
                const job = jobData && Array.isArray(jobData) && jobData.length > 0 ? jobData[0] : null;
                if (job) {
                    const client = allClients.find(c => c.id === job.client_id);
                    if (client) {
                        setSelectedClientId(client.id);
                        setSelectedClientName(client.client_name);
                        setSelectedClientEmail(client.email || '');
                    }

                    setFormData(prev => ({
                        ...prev,
                        client_name: job.client_name || '',
                        client_email: job.client_email || '',
                        notes: job.title ? `Task: ${job.title}` : '',
                        items: job.items?.map(item => ({
                            description: item.item_name,
                            quantity: item.quantity,
                            price: item.price,
                            job_id: job.id
                        })) || [{
                            description: job.title || '',
                            quantity: job.quantity || 1,
                            price: job.actual_price || job.estimated_price || 0,
                            job_id: job.id
                        }]
                    }));
                    setSelectedJobIds([job.id]);
                    setJobs([job]);
                }
            }
        } catch (error) {
            console.error('Error loading clients or initial job:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load initial data.' });
        } finally {
            setIsLoadingData(false);
        }
    }, [initialJobId, toast]);

    const fetchJobsForClient = useCallback(async (clientId) => {
        if (clientId) {
            try {
                const clientJobs = await base44.entities.Job.filter({ client_id: clientId, status: 'completed' });

                const allInvoices = await base44.entities.Invoice.list() || [];
                const jobsArray = Array.isArray(clientJobs) ? clientJobs : [];
                const unbilledJobs = jobsArray.filter(job => {
                    const isInvoiced = Array.isArray(allInvoices) && allInvoices.some(inv => 
                        inv.job_ids && inv.job_ids.includes(job.id) && inv.status !== 'archived'
                    );
                    return !isInvoiced || (initialJobId && job.id === initialJobId);
                });
                setJobs(unbilledJobs);
                
                if (!initialJobId) {
                    setSelectedJobIds([]);
                }
            } catch (error) {
                console.error('Error fetching jobs for client:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load client tasks.' });
                setJobs([]);
                setSelectedJobIds([]);
            }
        } else {
            setJobs([]);
            setSelectedJobIds([]);
        }
    }, [toast, initialJobId]);
        } else {
            setJobs([]);
            setSelectedJobIds([]);
        }
    }, [toast, initialJobId]);

    useEffect(() => {
        if (isOpen) {
            loadClientsAndJobs();
        }
    }, [isOpen, loadClientsAndJobs]);

    useEffect(() => {
        if (selectedClientId && !initialJobId) {
            fetchJobsForClient(selectedClientId);
        }
    }, [selectedClientId, fetchJobsForClient, initialJobId]);

    useEffect(() => {
        const client = clients.find(c => c.id === selectedClientId);
        if (client) {
            setSelectedClientName(client.client_name || 'Unknown Client');
            setSelectedClientEmail(client.email || '');
        } else {
            setSelectedClientName('');
            setSelectedClientEmail('');
        }
    }, [selectedClientId, clients]);

    useEffect(() => {
        if (!Array.isArray(jobs)) return;
        
        let totalAmount = 0;
        let invoiceItems = [];

        selectedJobIds.forEach(jobId => {
            const job = jobs.find(j => j.id === jobId);
            if (job) {
                const jobAmount = (job.actual_price || job.estimated_price || 0);
                totalAmount += jobAmount;
                invoiceItems.push({
                    description: job.title || (job.job_type || 'Service').replace(/_/g, ' '),
                    quantity: job.quantity || 1,
                    price: jobAmount,
                    job_id: job.id
                });
            }
        });
        setFormData(prev => ({ ...prev, amount: totalAmount, items: invoiceItems }));
    }, [selectedJobIds, jobs]);

    const handleClientSelect = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        setSelectedClientId(clientId);
        setSelectedClientName(client?.client_name || '');
        setSelectedClientEmail(client?.email || '');
    };

    const handleJobSelection = (jobId) => {
        setSelectedJobIds(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedClientId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a client.' });
            return;
        }

        if (formData.items.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one task or add items.' });
            return;
        }

        const invoiceItems = formData.items;

        try {
            const newInvoice = await base44.entities.Invoice.create({
                invoice_number: formData.invoice_number,
                issue_date: formData.issue_date,
                due_date: formData.due_date,
                amount: formData.amount,
                notes: formData.notes,
                job_ids: selectedJobIds,
                client_name: selectedClientName,
                client_email: selectedClientEmail,
                status: 'unpaid',
                items: invoiceItems,
                subtotal: formData.amount,
                discount: 0
            });

            if (initialJobId) {
                await base44.entities.Job.update(initialJobId, { status: 'completed' });
            }
            
            toast({ title: "Success", description: "Invoice created successfully." });
            window.open(createPageUrl('InvoicePrintView') + `?id=${newInvoice.id}`, '_blank');
            onClose();
        } catch (err) {
            console.error('Invoice creation error:', err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create invoice.' });
        }
    };

    if (isLoadingData) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="dialog-content">
                    <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="dialog-content max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-card-foreground">Create New Invoice</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 text-card-foreground">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Invoice Number</Label>
                            <Input
                                value={formData.invoice_number}
                                onChange={e => handleChange('invoice_number', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Select Client</Label>
                            <Select
                                value={selectedClientId}
                                onValueChange={handleClientSelect}
                                disabled={!!initialJobId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.client_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedClientId && !initialJobId && Array.isArray(jobs) && jobs.length > 0 && (
                        <div className="space-y-3">
                            <Label>Completed Tasks</Label>
                            <div className="border border-border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                                {jobs.map(job => (
                                    <div key={job.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`job-${job.id}`}
                                            checked={selectedJobIds.includes(job.id)}
                                            onCheckedChange={() => handleJobSelection(job.id)}
                                        />
                                        <Label htmlFor={`job-${job.id}`} className="flex-1 cursor-pointer text-foreground">
                                            {job.title} (Qty: {job.quantity}) - ₱{(job.actual_price || job.estimated_price || 0).toFixed(2)}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Issue Date</Label>
                            <Input
                                type="date"
                                value={formData.issue_date}
                                onChange={e => handleChange('issue_date', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={e => handleChange('due_date', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Items to be Invoiced</Label>
                        {formData.items.length > 0 ? (
                            <ul className="border rounded-md p-3 space-y-2 bg-secondary/30">
                                {formData.items.map((item, index) => (
                                    <li key={index} className="flex justify-between text-sm">
                                        <span>{item.description} (x{item.quantity})</span>
                                        <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                                <li className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                                    <span>Total:</span>
                                    <span>₱{formData.amount.toFixed(2)}</span>
                                </li>
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm border rounded-md p-3">No items added yet. Select tasks above.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={e => handleChange('notes', e.target.value)}
                            placeholder="Additional notes for this invoice..."
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!selectedClientId || formData.items.length === 0}>
                            Create Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}