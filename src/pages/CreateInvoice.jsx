
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Invoice, Job, Client } from '@/entities/all'; // Added Client entity
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select components
import { Checkbox } from '@/components/ui/checkbox'; // Added Checkbox

export default function CreateInvoice() { // Renamed component from CreateInvoicePage
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Replaced 'job' state with client and jobs selection
    const [clients, setClients] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedJobIds, setSelectedJobIds] = useState([]);
    const [selectedClientName, setSelectedClientName] = useState('');
    const [selectedClientEmail, setSelectedClientEmail] = useState('');

    const [formData, setFormData] = useState({
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        amount: 0, // This will be calculated dynamically
        notes: ''
    });

    // Function to load all clients
    const loadClients = useCallback(async () => {
        try {
            const allClients = await Client.filter({});
            setClients(allClients);
        } catch (error) {
            console.error('Error loading clients:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load client list.' });
        }
    }, [toast]);

    // Function to fetch completed and unbilled jobs for a selected client
    const fetchJobsForClient = useCallback(async (clientId) => {
        if (clientId) {
            try {
                // Filter by status 'completed' and ensure job_id is not already linked to an invoice
                const clientJobs = await Job.filter({ client_id: clientId, status: 'completed' });

                const unbilledJobs = await Promise.all(clientJobs.map(async (job) => {
                    const existingInvoices = await Invoice.filter({ job_ids: [job.id] });
                    return existingInvoices.length === 0 ? job : null;
                }));
                setJobs(unbilledJobs.filter(Boolean)); // Filter out nulls
                setSelectedJobIds([]); // Reset selected jobs when client changes
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
    }, [toast]);

    // Effect to load clients on component mount
    useEffect(() => {
        loadClients();
    }, [loadClients]);

    // Effect to fetch jobs when the selected client changes
    useEffect(() => {
        fetchJobsForClient(selectedClientId);
        // Update selected client details for display and invoice creation
        const client = clients.find(c => c.id === selectedClientId);
        if (client) {
            setSelectedClientName(client.name || 'Unknown Client');
            setSelectedClientEmail(client.email || '');
        } else {
            setSelectedClientName('');
            setSelectedClientEmail('');
        }
    }, [selectedClientId, fetchJobsForClient, clients]);

    // Effect to calculate total amount whenever selected jobs change
    useEffect(() => {
        let totalAmount = 0;
        selectedJobIds.forEach(jobId => {
            const job = jobs.find(j => j.id === jobId);
            if (job) {
                totalAmount += (job.actual_price || job.estimated_price || 0);
            }
        });
        setFormData(prev => ({ ...prev, amount: totalAmount }));
    }, [selectedJobIds, jobs]);

    const handleClientSelect = (clientId) => {
        setSelectedClientId(clientId);
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

        if (selectedJobIds.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one task for the invoice.' });
            return;
        }

        const invoiceItems = selectedJobIds.map(jobId => {
            const job = jobs.find(j => j.id === jobId);
            if (!job) return null; // Should not happen if `jobs` state is consistent

            const jobAmount = job.actual_price || job.estimated_price || 0;
            const jobQuantity = job.quantity || 1;
            // Prioritize job.title, fallback to job_type
            const description = job.title || (job.job_type || 'Service').replace(/_/g, ' ');
            const unitPrice = jobQuantity > 0 ? jobAmount / jobQuantity : jobAmount; // Handle division by zero

            return {
                description: description,
                quantity: jobQuantity,
                price: unitPrice,
                job_id: job.id // Include job_id for reference
            };
        }).filter(Boolean); // Remove any null items

        try {
            await Invoice.create({
                invoice_number: formData.invoice_number,
                issue_date: formData.issue_date,
                due_date: formData.due_date,
                amount: formData.amount,
                notes: formData.notes,
                job_ids: selectedJobIds, // Array of selected job IDs
                client_name: selectedClientName,
                client_email: selectedClientEmail,
                status: 'unpaid',
                items: invoiceItems, // Items derived from selected jobs
                subtotal: formData.amount, // For simplicity, subtotal is the same as total amount for now
                discount: 0
            });

            toast({ title: "Success", description: "Invoice created successfully." });
            navigate(createPageUrl('Sales'));
        } catch (err) {
            console.error('Invoice creation error:', err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create invoice.' });
        }
    };

    // Loading state for clients
    if (clients.length === 0 && !selectedClientId) {
        return (
            <div className="p-8 bg-background text-foreground min-h-screen">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center">Loading clients...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-background text-foreground min-h-screen">
            <div className="max-w-2xl mx-auto">
                {/* Prioritize Task Titles - Updated H1 */}
                <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>

                {/* Client Selection */}
                <div className="mb-6 space-y-2">
                    <Label htmlFor="client-select">Select Client</Label>
                    <Select
                        value={selectedClientId}
                        onValueChange={handleClientSelect}
                    >
                        <SelectTrigger id="client-select">
                            <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Hide Job Type/ID - Replaced old "Task Details" with a list of selectable tasks */}
                {selectedClientId && (
                    <div className="mb-6 p-4 bg-card border border-border rounded-lg">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Completed Tasks ({jobs.length} available)</h3>
                            <div className="space-y-2">
                                {jobs.length > 0 ? (
                                    jobs.map((job) => (
                                        <div key={job.id} className="flex items-center space-x-2 bg-secondary p-3 rounded-lg">
                                            <Checkbox
                                                id={`job-${job.id}`}
                                                checked={selectedJobIds.includes(job.id)}
                                                onCheckedChange={() => handleJobSelection(job.id)}
                                            />
                                            <label htmlFor={`job-${job.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                                {/* Prioritize job.title */}
                                                {job.title} (Qty: {job.quantity}) - ₱{job.actual_price?.toFixed(2) || job.estimated_price?.toFixed(2) || '0.00'}
                                                {job.completion_date && ` (Completed: ${format(new Date(job.completion_date), "MMM d, yyyy")})`}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">No new completed tasks for this client that are not yet billed.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Invoice Number</Label>
                            <Input
                                value={formData.invoice_number}
                                onChange={e => handleChange('invoice_number', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Client Name</Label>
                            <Input value={selectedClientName} disabled /> {/* Displays selected client's name */}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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
                        <Label>Total Amount (₱)</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.amount.toFixed(2)}
                            onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                            required
                            disabled={selectedJobIds.length > 0} // Disable if jobs are selected, as amount is calculated
                        />
                        {selectedJobIds.length > 0 && (
                            <p className="text-xs text-muted-foreground">Amount automatically calculated from selected tasks.</p>
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

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(createPageUrl('Sales'))}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!selectedClientId || selectedJobIds.length === 0}>Create Invoice</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
