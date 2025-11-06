
import React, { useState, useEffect, useCallback } from 'react';
import { Invoice, Job } from '@/entities/all';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Receipt, ClipboardList, ArchiveRestore, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import ArchivedInvoicePreview from '../components/archive/ArchivedInvoicePreview';
import ArchivedJobPreview from '../components/archive/ArchivedJobPreview';

export default function DumpPage() {
    const [archivedInvoices, setArchivedInvoices] = useState([]);
    const [archivedJobs, setArchivedJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewItem, setPreviewItem] = useState(null);
    const { toast } = useToast();

    const loadArchivedData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [invoices, jobs] = await Promise.all([
                Invoice.filter({ status: 'archived' }, "-created_date"),
                Job.filter({ status: 'archived' }, "-created_date")
            ]);
            setArchivedInvoices(invoices);
            setArchivedJobs(jobs);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load archived data.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadArchivedData();
    }, [loadArchivedData]);

    const restoreInvoice = async (invoiceId) => {
        try {
            await Invoice.update(invoiceId, { status: 'paid' });
            toast({ title: 'Success', description: 'Invoice has been restored.' });
            loadArchivedData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to restore invoice.' });
        }
    };

    const restoreJob = async (jobId) => {
        try {
            await Job.update(jobId, { status: 'completed' });
            toast({ title: 'Success', description: 'Task has been restored.' });
            loadArchivedData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to restore task.' });
        }
    };

    return (
        <div className="p-4 md:p-8 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                            <Archive className="w-8 h-8" />
                            Archive
                        </h1>
                        <p className="text-muted-foreground mt-1">View and restore archived invoices and tasks.</p>
                    </div>
                </div>

                <Tabs defaultValue="invoices" className="w-full">
                    <TabsList className="tabs-list">
                        <TabsTrigger value="invoices" className="tabs-trigger">
                            <Receipt className="w-4 h-4 mr-2" />
                            Archived Invoices
                        </TabsTrigger>
                        <TabsTrigger value="jobs" className="tabs-trigger">
                            <ClipboardList className="w-4 h-4 mr-2" />
                            Archived Tasks
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="invoices" className="mt-6">
                        <Card>
                            <CardContent className="p-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow> : 
                                        archivedInvoices.map(invoice => (
                                            <TableRow key={invoice.id}>
                                                <TableCell>{invoice.invoice_number}</TableCell>
                                                <TableCell>{invoice.client_name}</TableCell>
                                                <TableCell>{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                                                <TableCell>₱{invoice.amount.toFixed(2)}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => setPreviewItem({type: 'invoice', data: invoice})}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => restoreInvoice(invoice.id)}>
                                                        <ArchiveRestore className="w-4 h-4 mr-2" />
                                                        Restore
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {archivedInvoices.length === 0 && !isLoading && <p className="text-center p-8 text-muted-foreground">No archived invoices found.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="jobs" className="mt-6">
                         <Card>
                            <CardContent className="p-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Task Title</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Completed</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow> : 
                                        archivedJobs.map(job => (
                                            <TableRow key={job.id}>
                                                <TableCell>{job.title || 'N/A'}</TableCell>
                                                <TableCell>{job.client_name}</TableCell>
                                                <TableCell>{job.completion_date ? format(new Date(job.completion_date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                     <Button variant="outline" size="sm" onClick={() => setPreviewItem({type: 'job', data: job})}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => restoreJob(job.id)}>
                                                        <ArchiveRestore className="w-4 h-4 mr-2" />
                                                        Restore
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {archivedJobs.length === 0 && !isLoading && <p className="text-center p-8 text-muted-foreground">No archived tasks found.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            {previewItem && previewItem.type === 'invoice' && (
                <ArchivedInvoicePreview
                    invoice={previewItem.data}
                    onClose={() => setPreviewItem(null)}
                />
            )}
            {previewItem && previewItem.type === 'job' && (
                <ArchivedJobPreview
                    job={previewItem.data}
                    onClose={() => setPreviewItem(null)}
                />
            )}
        </div>
    );
}
