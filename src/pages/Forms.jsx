import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Quotation, Invoice, Client, Job, PriceListItem, Notification, User, IDPrintRecord, ReimbursementRequest, Order, Supplier, PurchaseOrder } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileQuestion, Receipt, Check, X, Eye, Plus, Trash2, Printer, Mail, Send, CreditCard, Download, Search, Edit, FileText, MoreVertical, Upload, Merge, ShoppingCart, Link2, Copy, ExternalLink, MoreHorizontal, CheckCircle, RefreshCw } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from '@/api/base44Client';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Trash2 as TrashIcon } from "lucide-react";
import ReimbursementForm from '@/components/forms/ReimbursementForm';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import IDBatchUpload from '@/components/forms/IDBatchUpload';
import FormDefinitionManager from '@/components/forms/FormDefinitionManager';
import FormSubmissionsViewer from '@/components/forms/FormSubmissionsViewer';
import DeliveryFormManager from '@/components/forms/DeliveryFormManager';
import { notifyPurchaseOrderApproval } from '@/components/utils/notificationService';
import KeychainOrdersManager from '@/components/forms/KeychainOrdersManager';


const EmailModal = ({ isOpen, onClose, recipient, subject, defaultBody, onSend }) => {
  const [emailData, setEmailData] = useState({
    to: recipient || '',
    subject: subject || '',
    body: defaultBody || ''
  });

  useEffect(() => {
    setEmailData({
      to: recipient || '',
      subject: subject || '',
      body: defaultBody || ''
    });
  }, [recipient, subject, defaultBody]);

  const handleSend = () => {
    onSend(emailData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-content max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Send Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-card-foreground">
          <div className="space-y-2">
            <Label>To</Label>
            <Input value={emailData.to} onChange={e => setEmailData({...emailData, to: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea rows={8} value={emailData.body} onChange={e => setEmailData({...emailData, body: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend}><Send className="w-4 h-4 mr-2" />Send Email</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const QuotationForm = ({ onSubmitted, clients, pricelistItems }) => {
    const [formData, setFormData] = useState({
        quotation_id: `Q-${Date.now()}`,
        client_info: { name: '', phone: '', email: '' },
        items: [], // This will be compiled later
        subtotal: 0,
        discount_amount: 0,
        promo_code: '',
        total_price: 0,
        notes: ''
    });
    const [selectedClient, setSelectedClient] = useState(null);
    const [customItems, setCustomItems] = useState([{ item_name: '', quantity: 1, price: 0 }]);
    const [pricelistItemSelections, setPricelistItemSelections] = useState([]);
    const { toast } = useToast();

    useEffect(() => {
        calculateTotals();
    }, [customItems, pricelistItemSelections, formData.discount_amount]);

    const calculateTotals = useCallback(() => {
        // Calculate from custom items
        const customTotal = customItems.reduce((sum, item) => {
            return sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0));
        }, 0);

        // Calculate from pricelist items
        const pricelistTotal = pricelistItemSelections.reduce((sum, selection) => {
            const item = pricelistItems.find(p => p.id === selection.itemId);
            if (item) {
                // Assuming price_conservative is a property, fallback to price if not
                return sum + ((item.price_conservative !== undefined ? item.price_conservative : item.price) * selection.quantity);
            }
            return sum;
        }, 0);

        const subtotal = customTotal + pricelistTotal;
        const total = subtotal - (parseFloat(formData.discount_amount) || 0);

        setFormData(prev => ({
            ...prev,
            subtotal: subtotal,
            total_price: Math.max(0, total)
        }));
    }, [customItems, pricelistItemSelections, pricelistItems, formData.discount_amount]);

    const handleClientSelect = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setSelectedClient(client);
            setFormData(prev => ({
                ...prev,
                client_info: {
                    name: client.client_name,
                    phone: client.phone_number || '',
                    email: client.email || ''
                }
            }));
        }
    };

    const addCustomItem = () => {
        setCustomItems([...customItems, { item_name: '', quantity: 1, price: 0 }]);
    };

    const removeCustomItem = (index) => {
        setCustomItems(customItems.filter((_, i) => i !== index));
    };

    const updateCustomItem = (index, field, value) => {
        const updated = [...customItems];
        updated[index] = { ...updated[index], [field]: value };
        setCustomItems(updated);
    };

    const addPricelistItem = () => {
        setPricelistItemSelections([...pricelistItemSelections, { itemId: '', quantity: 1 }]);
    };

    const removePricelistItem = (index) => {
        setPricelistItemSelections(pricelistItemSelections.filter((_, i) => i !== index));
    };

    const updatePricelistItemSelection = (index, field, value) => {
        const updated = [...pricelistItemSelections];
        updated[index] = { ...updated[index], [field]: value };
        setPricelistItemSelections(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Combine all items
        const allItems = [];

        // Add custom items
        customItems.forEach(item => {
            if (item.item_name.trim()) {
                allItems.push({
                    item_id: null,
                    item_name: item.item_name,
                    quantity: parseInt(item.quantity) || 1,
                    price: parseFloat(item.price) || 0
                });
            }
        });

        // Add pricelist items
        pricelistItemSelections.forEach(selection => {
            const item = pricelistItems.find(p => p.id === selection.itemId);
            if (item) {
                allItems.push({
                    item_id: item.id,
                    item_name: item.item_name,
                    quantity: selection.quantity,
                    price: item.price_conservative !== undefined ? item.price_conservative : item.price // Fallback to 'price'
                });
            }
        });

        if (allItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item.' });
            return;
        }
        
        if (!formData.client_info.name) {
            toast({ variant: 'destructive', title: 'Error', description: 'Client name is required.' });
            return;
        }

        const quotationData = {
            ...formData,
            items: allItems,
            status: 'pending_review' // Default status for new quotations
        };

        try {
            await Quotation.create(quotationData);
            toast({ title: 'Success', description: 'Quotation created successfully.' });
            onSubmitted();
        } catch (error) {
            console.error("Error creating quotation:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create quotation.' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-card-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Select Existing Client</Label>
                    <Select onValueChange={handleClientSelect} value={selectedClient?.id || ''}>
                        <SelectTrigger><SelectValue placeholder="Choose a client" /></SelectTrigger>
                        <SelectContent>
                            {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>{client.client_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="quotation_id">Quotation ID</Label>
                    <Input 
                        id="quotation_id" 
                        value={formData.quotation_id} 
                        onChange={e => setFormData({...formData, quotation_id: e.target.value})} 
                        required 
                    />
                </div>
            </div>

            <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-semibold text-foreground">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="client_name">Client Name *</Label>
                        <Input 
                            id="client_name" 
                            value={formData.client_info.name} 
                            onChange={e => setFormData({...formData, client_info: {...formData.client_info, name: e.target.value}})} 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client_phone">Phone</Label>
                        <Input 
                            id="client_phone" 
                            value={formData.client_info.phone} 
                            onChange={e => setFormData({...formData, client_info: {...formData.client_info, phone: e.target.value}})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client_email">Email</Label>
                        <Input 
                            id="client_email" 
                            type="email" 
                            value={formData.client_info.email} 
                            onChange={e => setFormData({...formData, client_info: {...formData.client_info, email: e.target.value}})} 
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Items from Price List</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addPricelistItem}>
                        <Plus className="w-4 h-4 mr-2" /> Add Price List Item
                    </Button>
                </div>
                {pricelistItemSelections.map((selection, index) => {
                    const selectedItem = pricelistItems.find(p => p.id === selection.itemId);
                    const itemPrice = selectedItem ? (selectedItem.price_conservative !== undefined ? selectedItem.price_conservative : selectedItem.price) : 0;
                    return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 bg-background border border-border rounded-lg">
                            <div className="col-span-6 space-y-2">
                                <Label>Item</Label>
                                <Select 
                                    value={selection.itemId} 
                                    onValueChange={value => updatePricelistItemSelection(index, 'itemId', value)}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                                    <SelectContent>
                                        {pricelistItems.map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.item_name} - ₱{(item.price_conservative !== undefined ? item.price_conservative : item.price)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Qty</Label>
                                <Input 
                                    type="number" 
                                    min="1" 
                                    value={selection.quantity} 
                                    onChange={e => updatePricelistItemSelection(index, 'quantity', parseInt(e.target.value) || 1)} 
                                />
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label>Total</Label>
                                <Input 
                                    value={`₱${(itemPrice * selection.quantity).toFixed(2)}`} 
                                    disabled 
                                />
                            </div>
                            <div className="col-span-1 flex items-end">
                                <Button type="button" variant="ghost" size="icon" onClick={() => removePricelistItem(index)}>
                                    <TrashIcon className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Custom Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addCustomItem}>
                        <Plus className="w-4 h-4 mr-2" /> Add Custom Item
                    </Button>
                </div>
                {customItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 bg-background border border-border rounded-lg">
                        <div className="col-span-5 space-y-2">
                            <Label>Description</Label>
                            <Input 
                                value={item.item_name} 
                                onChange={e => updateCustomItem(index, 'item_name', e.target.value)} 
                                placeholder="Item description" 
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Qty</Label>
                            <Input 
                                type="number" 
                                min="1" 
                                value={item.quantity} 
                                onChange={e => updateCustomItem(index, 'quantity', e.target.value)} 
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Price</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                value={item.price} 
                                onChange={e => updateCustomItem(index, 'price', e.target.value)} 
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Total</Label>
                            <Input 
                                value={`₱${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}`} 
                                disabled 
                            />
                        </div>
                        <div className="col-span-1 flex items-end">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomItem(index)}>
                                <TrashIcon className="w-4 h-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="promo_code">Promo Code (Optional)</Label>
                    <Input 
                        id="promo_code" 
                        value={formData.promo_code} 
                        onChange={e => setFormData({...formData, promo_code: e.target.value})} 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <Input 
                        id="discount_amount" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={formData.discount_amount} 
                        onChange={e => setFormData({...formData, discount_amount: parseFloat(e.target.value) || 0})} 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea 
                    id="notes" 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    rows={3}
                />
            </div>

            <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Subtotal: ₱{formData.subtotal.toFixed(2)}</p>
                    {formData.discount_amount > 0 && (
                        <p className="text-sm text-muted-foreground">Discount: -₱{formData.discount_amount.toFixed(2)}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-foreground">₱{formData.total_price.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit">Create Quotation</Button>
            </div>
        </form>
    );
};

const ConvertToJobModal = ({ quotation, onConverted }) => {
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    
    useEffect(() => {
        const loadClients = async () => {
            const clientData = await Client.list();
            setClients(clientData);
            const existingClient = clientData.find(c => c.client_name.toLowerCase() === quotation.client_info.name.toLowerCase());
            if (existingClient) {
                setSelectedClientId(existingClient.id);
            } else {
                setIsCreatingClient(true);
            }
        };
        loadClients();
    }, [quotation]);

    const handleConvert = async () => {
        let clientId = selectedClientId;
        let clientName = '';

        if(isCreatingClient || !selectedClientId) {
            const newClient = await Client.create({
                client_name: quotation.client_info.name,
                contact_person: quotation.client_info.name,
                phone_number: quotation.client_info.phone,
                email: quotation.client_info.email,
            });
            clientId = newClient.id;
            clientName = newClient.client_name;
        } else {
            clientName = clients.find(c => c.id === selectedClientId).client_name;
        }

        const newJob = await Job.create({
            title: quotation.items[0]?.item_name || `Task for ${clientName}`,
            client_name: clientName,
            client_id: clientId,
            client_phone: quotation.client_info.phone,
            client_email: quotation.client_info.email,
            job_type: quotation.items.map(i => i.item_name).join(', '),
            quantity: quotation.items.reduce((sum, i) => sum + i.quantity, 0),
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimated_price: quotation.total_price,
            special_instructions: `From Quotation ID: ${quotation.quotation_id}`,
            status: 'pending_approval'
        });

        await Quotation.update(quotation.id, { status: 'converted' });
        onConverted();
    };

    return (
        <DialogContent className="dialog-content">
            <DialogHeader>
                <DialogTitle className="text-card-foreground">Convert Quotation to Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-card-foreground">
                <p>Client: {quotation.client_info.name}</p>
                <div>
                    <Label>Assign to Client:</Label>
                     <Select value={selectedClientId} onValueChange={(value) => { setSelectedClientId(value); setIsCreatingClient(false); }}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="-- Select Client --" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="create-new" checked={isCreatingClient} onCheckedChange={(checked) => { setIsCreatingClient(checked); if (checked) setSelectedClientId(''); }} />
                    <Label htmlFor="create-new">Or Create New Client from this Quotation</Label>
                </div>
                <Button onClick={handleConvert}>Convert to Task</Button>
            </div>
        </DialogContent>
    )
}

const UnifiedInvoiceForm = ({ onSubmitted, editingInvoice = null }) => {
    // Calculate payment terms from original invoice if editing
    const getInitialDates = () => {
        if (editingInvoice) {
            const originalIssue = new Date(editingInvoice.issue_date);
            const originalDue = new Date(editingInvoice.due_date);
            const paymentTermsDays = Math.round((originalDue.getTime() - originalIssue.getTime()) / (1000 * 60 * 60 * 24));
            
            const newIssueDate = format(new Date(), 'yyyy-MM-dd');
            const newDueDate = format(addDays(new Date(), paymentTermsDays), 'yyyy-MM-dd');
            
            return { newIssueDate, newDueDate };
        }
        return {
            newIssueDate: format(new Date(), 'yyyy-MM-dd'),
            newDueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd')
        };
    };

    const { newIssueDate, newDueDate } = getInitialDates();

    const [formData, setFormData] = useState({
        invoice_number: editingInvoice?.invoice_number || '',
        receipt_type: editingInvoice?.receipt_type || 'Collection Receipt',
        client_id: editingInvoice?.client_id || '',
        client_name: editingInvoice?.client_name || '',
        client_email: editingInvoice?.client_email || '',
        issue_date: newIssueDate,
        due_date: newDueDate,
        job_ids: editingInvoice?.job_ids || [],
        manual_items: editingInvoice ? (editingInvoice.items?.filter(item => !item.job_id)?.map(item => ({ 
            description: item.description,
            quantity: item.quantity,
            price: item.price
        })) || []) : [],
        discount: editingInvoice?.discount || 0,
        notes: editingInvoice?.notes || '',
        prepared_by: editingInvoice?.prepared_by || '', // Added prepared_by
        payment_footer_type: editingInvoice?.payment_footer_type || 'payment_options'
    });
    const [customReceiptType, setCustomReceiptType] = useState('');
    const [showDueDate, setShowDueDate] = useState(editingInvoice?.due_date ? true : false);
    const [clients, setClients] = useState([]);
    const [pricelist, setPricelist] = useState([]);
    const [availableJobs, setAvailableJobs] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Helper to get next invoice number for reset
    const getNextInvoiceNumberForReset = async () => {
        const year = new Date().getFullYear();
        const allInvoices = await Invoice.list();
        const yearInvoices = allInvoices.filter(inv => {
            const parts = inv.invoice_number?.split('-');
            return parts.length === 3 && parts[0] === 'MCTS' && parseInt(parts[1], 10) === year;
        });
        const maxNum = yearInvoices.reduce((max, inv) => {
            const parts = inv.invoice_number.split('-');
            const num = parseInt(parts[2], 10);
            return num > max ? num : max;
        }, 0);
        const newNum = maxNum + 1;
        return `MCTS-${year}-${String(newNum).padStart(5, '0')}`;
    };

    const fetchClientSpecificItems = useCallback(async (clientId, currentInvoiceId = null) => {
        if (!clientId) {
            setAvailableJobs([]);
            return;
        }
        setIsLoading(true);
        try {
            const allInvoices = await Invoice.list();
            const clientJobs = await Job.filter({ client_id: clientId, status: 'completed' });
            
            const unbilledJobs = clientJobs.filter(job =>
                !allInvoices.some(inv =>
                    inv.id !== currentInvoiceId &&
                    inv.job_ids && inv.job_ids.includes(job.id) && inv.status !== 'archived' && inv.status !== 'consolidated'
                )
            );
            setAvailableJobs(unbilledJobs);

        } catch (error) {
            console.error("Error fetching client data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load client data.' });
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        const loadInitialDataAndSetClient = async () => {
            const clientData = await Client.list();
            setClients(clientData);
            const pricelistData = await PriceListItem.list();
            const sortedPricelist = pricelistData.sort((a,b) => a.item_name.localeCompare(b.item_name));
            setPricelist(sortedPricelist);

            if (editingInvoice) {
                const client = clientData.find(c => c.id === editingInvoice.client_id);
                setSelectedClient(client);
            } else {
                const newInvoiceNumber = await getNextInvoiceNumberForReset();
                setFormData(prev => ({
                    ...prev,
                    invoice_number: newInvoiceNumber
                }));
            }
        };
        loadInitialDataAndSetClient();
    }, [editingInvoice]);

    useEffect(() => {
        if (selectedClient) {
            fetchClientSpecificItems(selectedClient.id, editingInvoice?.id);
        } else {
            setAvailableJobs([]);
        }
    }, [selectedClient, fetchClientSpecificItems, editingInvoice]);

    const handleClientChange = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        setSelectedClient(client);
        setFormData(prev => ({ 
            ...prev, 
            client_id: clientId, 
            client_name: client?.client_name || '',
            client_email: client?.email || '',
            job_ids: [],
            manual_items: editingInvoice ? prev.manual_items : []
        }));
    };

    const handleJobSelection = (jobId, checked) => {
        if (checked) {
            setFormData(prev => ({ ...prev, job_ids: [...prev.job_ids, jobId] }));
        } else {
            setFormData(prev => ({ ...prev, job_ids: prev.job_ids.filter(id => id !== jobId) }));
        }
    };

    const addManualItem = () => {
        setFormData(prev => ({
            ...prev,
            manual_items: [...prev.manual_items, { description: '', quantity: 1, price: 0 }]
        }));
    };

    const updateManualItem = (index, field, value) => {
        const newItems = [...formData.manual_items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, manual_items: newItems }));
    };

    const removeManualItem = (index) => {
        setFormData(prev => ({
            ...prev,
            manual_items: prev.manual_items.filter((_, i) => i !== index)
        }));
    };

    const addFromPricelist = (pricelistItem) => {
        setFormData(prev => ({
            ...prev,
            manual_items: [...prev.manual_items, {
                description: pricelistItem.item_name,
                quantity: 1,
                price: pricelistItem.price
            }]
        }));
    };

    const calculateTotal = () => {
        const selectedJobs = availableJobs.filter(job => formData.job_ids.includes(job.id));
        const jobsTotal = selectedJobs.reduce((sum, job) => {
            return sum + parseFloat(job.actual_price || job.estimated_price || 0);
        }, 0);

        const manualTotal = formData.manual_items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        }, 0);

        const subtotal = jobsTotal + manualTotal;
        const discount = parseFloat(formData.discount) || 0;
        return Math.max(0, subtotal - discount);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.client_id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a client.' });
            return;
        }

        const selectedJobsInCurrentSubmission = availableJobs.filter(job => formData.job_ids.includes(job.id));

        const items = [];

        // Add job-related items to the invoice
        selectedJobsInCurrentSubmission.forEach(job => {
            // Check if the job has items array
            if (job.items && Array.isArray(job.items) && job.items.length > 0) {
                // Add each item from the job separately
                job.items.forEach(item => {
                    items.push({
                        description: `${job.title} - ${item.item_name}`,
                        quantity: parseInt(item.quantity) || 1,
                        price: parseFloat(item.price) || 0,
                        job_id: job.id,
                    });
                });
            } else {
                // Fallback to old behavior if job has no items
                const jobAmount = parseFloat(job.actual_price || job.estimated_price || 0);
                const jobQuantity = parseInt(job.quantity) || 1;
                const description = job.title || (job.job_type || 'Service').replace(/_/g, ' ');
                const unitPrice = jobQuantity > 0 ? jobAmount / jobQuantity : jobAmount;

                items.push({
                    description: description,
                    quantity: jobQuantity,
                    price: unitPrice,
                    job_id: job.id,
                });
            }
        });

        // Add manual items
        formData.manual_items.forEach(item => {
            if (item.description.trim()) {
                items.push({
                    description: item.description,
                    quantity: parseInt(item.quantity) || 1,
                    price: parseFloat(item.price) || 0
                });
            }
        });

        // Check if there are any items at all
        if (items.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item or task.' });
            return;
        }

        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const discount = parseFloat(formData.discount) || 0;
        const finalAmount = subtotal - discount;

        try {
            const invoiceData = {
                invoice_number: formData.invoice_number,
                receipt_type: formData.receipt_type,
                issue_date: formData.issue_date,
                due_date: formData.due_date,
                client_name: formData.client_name,
                client_email: formData.client_email,
                client_id: formData.client_id,
                job_ids: formData.job_ids, // Pass the array of job IDs from form state
                items: items,
                subtotal: subtotal,
                discount: discount,
                amount: finalAmount,
                status: editingInvoice?.status || 'unpaid', // Preserve status for editing, default to unpaid for new
                notes: formData.notes,
                prepared_by: formData.prepared_by, // Include prepared_by
                payment_footer_type: formData.payment_footer_type
            };

            // Ensure client_name and client_email are most up-to-date from selectedClient
            if (selectedClient) {
                invoiceData.client_name = selectedClient.client_name;
                invoiceData.client_email = selectedClient.email;
            }

            let savedInvoice;
            if (editingInvoice) {
                await Invoice.update(editingInvoice.id, invoiceData);
                savedInvoice = { ...editingInvoice, ...invoiceData };
                toast({ title: 'Success', description: 'Invoice updated successfully.' });
            } else { // Creating a new invoice
                savedInvoice = await Invoice.create(invoiceData);
                toast({ title: 'Success', description: 'Invoice created successfully.' });

                // Update associated jobs to 'completed' status (only for newly created invoices)
                for (const job of selectedJobsInCurrentSubmission) {
                    await Job.update(job.id, {
                        status: 'completed',
                        completion_date: new Date().toISOString(),
                    });
                }
                
                // Open invoice in new tab only for new invoices
                window.open(createPageUrl('InvoicePrintView') + `?id=${savedInvoice.id}`, '_blank');

                // Reset form for new invoice
                const newInvoiceNum = await getNextInvoiceNumberForReset();
                const { newIssueDate, newDueDate } = getInitialDates(); // Reuse initial date logic

                setFormData({
                    invoice_number: newInvoiceNum,
                    receipt_type: 'Collection Receipt',
                    client_id: '',
                    client_name: '',
                    client_email: '',
                    issue_date: newIssueDate,
                    due_date: newDueDate,
                    job_ids: [],
                    manual_items: [],
                    discount: 0,
                    notes: '',
                    prepared_by: '' // Reset prepared_by
                });
                setSelectedClient(null); // Clear selected client after new invoice creation
            }

            onSubmitted(); // This should trigger a data reload in the parent component
        } catch (error) {
            console.error('Invoice creation/update error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create/update invoice.' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-card-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} readOnly />
                </div>
                <div className="space-y-2">
                    <Label>Receipt Type</Label>
                    <Select value={formData.receipt_type === customReceiptType && customReceiptType ? 'Custom' : formData.receipt_type} onValueChange={(value) => {
                        if (value === 'Custom') {
                            setFormData({...formData, receipt_type: customReceiptType || ''});
                        } else {
                            setFormData({...formData, receipt_type: value});
                            setCustomReceiptType('');
                        }
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select receipt type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Collection Receipt">Collection Receipt</SelectItem>
                            <SelectItem value="Official Receipt">Official Receipt</SelectItem>
                            <SelectItem value="Acknowledgement Receipt">Acknowledgement Receipt</SelectItem>
                            <SelectItem value="Delivery Receipt">Delivery Receipt</SelectItem>
                            <SelectItem value="Invoice">Invoice</SelectItem>
                            <SelectItem value="Custom">Custom...</SelectItem>
                        </SelectContent>
                    </Select>
                    {(formData.receipt_type === customReceiptType && customReceiptType) || (!['Collection Receipt', 'Official Receipt', 'Acknowledgement Receipt', 'Delivery Receipt', 'Invoice'].includes(formData.receipt_type)) ? (
                        <Input 
                            placeholder="Enter custom receipt type"
                            value={customReceiptType || formData.receipt_type}
                            onChange={(e) => {
                                setCustomReceiptType(e.target.value);
                                setFormData({...formData, receipt_type: e.target.value});
                            }}
                        />
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Client *</Label>
                    <Select onValueChange={handleClientChange} value={formData.client_id}>
                        <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                        <SelectContent>
                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                        <Checkbox 
                            id="show-due-date" 
                            checked={showDueDate} 
                            onCheckedChange={(checked) => {
                                setShowDueDate(checked);
                                if (!checked) setFormData({...formData, due_date: null});
                            }} 
                        />
                        <Label htmlFor="show-due-date" className="cursor-pointer">Include Due Date</Label>
                    </div>
                    {showDueDate && (
                        <Input type="date" value={formData.due_date || ''} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Prepared By</Label>
                <Input 
                    value={formData.prepared_by} 
                    onChange={e => setFormData({...formData, prepared_by: e.target.value})}
                    placeholder="Name of person preparing this invoice..."
                />
            </div>

            {selectedClient && (
                <>
                    {isLoading ? (
                        <p className="text-muted-foreground">Loading tasks...</p>
                    ) : (
                        <>
                            {availableJobs.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Unbilled Completed Tasks</Label>
                                        {availableJobs.length > 1 && (
                                            <div className="flex items-center space-x-2 text-sm">
                                                <Checkbox
                                                    id="select-all-jobs"
                                                    checked={formData.job_ids.length === availableJobs.length}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setFormData(prev => ({ ...prev, job_ids: availableJobs.map(j => j.id) }));
                                                        } else {
                                                            setFormData(prev => ({ ...prev, job_ids: [] }));
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor="select-all-jobs" className="cursor-pointer">Select All</Label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border border-border rounded-md p-4 space-y-2 max-h-32 overflow-y-auto">
                                        {availableJobs.map(job => (
                                            <div key={job.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`job-${job.id}`}
                                                    checked={formData.job_ids.includes(job.id)}
                                                    onCheckedChange={(checked) => handleJobSelection(job.id, checked)}
                                                />
                                                <Label htmlFor={`job-${job.id}`} className="flex-1 cursor-pointer text-foreground">
                                                    {job.title} (Qty: {job.quantity}) - ₱{(job.actual_price || job.estimated_price || 0).toFixed(2)}
                                                    {job.completion_date && (
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            (Completed: {format(new Date(job.completion_date), 'MMM d')})
                                                        </span>
                                                    )}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Manual Items/Services</Label>
                    <div className="flex gap-2">
                        <Select onValueChange={(value) => {
                            const pricelistItem = pricelist.find(p => p.id === value);
                            if (pricelistItem) addFromPricelist(pricelistItem);
                        }}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Add from pricelist" />
                            </SelectTrigger>
                            <SelectContent>
                                {pricelist.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.item_name} - ₱{p.price}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={addManualItem}>
                            <Plus className="w-4 h-4 mr-2" />Add Item
                        </Button>
                    </div>
                </div>

                {formData.manual_items.map((item, index) => (
                    <div key={index} className="grid grid-cols-6 gap-2 items-end p-3 bg-secondary/50 rounded-lg">
                        <div className="col-span-2">
                            <Input
                                placeholder="Item description"
                                value={item.description}
                                onChange={e => updateManualItem(index, 'description', e.target.value)}
                            />
                        </div>
                        <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={e => updateManualItem(index, 'quantity', e.target.value)}
                        />
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={item.price}
                            onChange={e => updateManualItem(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                        <div className="text-sm font-medium text-foreground">
                            ₱{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </div>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeManualItem(index)}
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Discount (₱)</Label>
                    <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={formData.discount} 
                        onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <div className="text-2xl font-bold text-foreground">₱{calculateTotal().toFixed(2)}</div>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes for this invoice..."
                />
            </div>

            <div className="space-y-2">
                <Label>Payment Footer Section</Label>
                <Select value={formData.payment_footer_type} onValueChange={(value) => setFormData({...formData, payment_footer_type: value})}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select footer content" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="payment_options">Payment Options (Bank & GCash)</SelectItem>
                        <SelectItem value="social_media">Social Media Accounts</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end">
                <Button type="submit">{editingInvoice ? 'Update' : 'Create'} {formData.receipt_type}</Button>
            </div>
        </form>
    );
};

const CombineInvoicesModal = ({ invoices, onCombine, onClose }) => {
    const { toast } = useToast();
    const [receiptType, setReceiptType] = useState('Invoice');
    const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');

    const combinedTotal = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const combinedSubtotal = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
    const combinedDiscount = invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);

    const handleSubmit = () => {
        const client = invoices[0].client_name;
        const clientId = invoices[0].client_id;
        const clientEmail = invoices[0].client_email;

        // Aggregate items
        const aggregatedItems = {};
        invoices.forEach(inv => {
            inv.items.forEach(item => {
                // Use a key that combines description and price to differentiate items that might have same description but different prices
                const key = `${item.description}-${item.price}`; 
                if (aggregatedItems[key]) {
                    aggregatedItems[key].quantity += item.quantity;
                } else {
                    aggregatedItems[key] = { ...item };
                }
            });
        });
        const combinedItems = Object.values(aggregatedItems);

        // Aggregate job_ids (ensure unique)
        const combinedJobIds = [...new Set(invoices.flatMap(inv => inv.job_ids || []))];

        onCombine({
            receiptType,
            dueDate,
            notes,
            clientName: client,
            clientId: clientId,
            clientEmail: clientEmail,
            items: combinedItems,
            jobIds: combinedJobIds,
            subtotal: combinedSubtotal,
            discount: combinedDiscount,
            amount: combinedTotal,
            originalInvoiceIds: invoices.map(inv => inv.id)
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="dialog-content max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-card-foreground">Combine Invoices</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-card-foreground">
                    <p>You are combining the following invoices for <span className="font-semibold">{invoices[0]?.client_name}</span>:</p>
                    <ul className="list-disc pl-5">
                        {invoices.map(inv => (
                            <li key={inv.id}>{inv.invoice_number} (₱{inv.amount.toFixed(2)}) - {inv.issue_date ? format(new Date(inv.issue_date), 'MMM d, yyyy') : '-'}</li>
                        ))}
                    </ul>
                    <div className="text-lg font-bold">New Combined Total: ₱{combinedTotal.toFixed(2)}</div>

                    <div className="space-y-2">
                        <Label>New Receipt Type</Label>
                        <Select value={receiptType} onValueChange={setReceiptType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select receipt type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Collection Receipt">Collection Receipt</SelectItem>
                                <SelectItem value="Official Receipt">Official Receipt</SelectItem>
                                <SelectItem value="Acknowledgement Receipt">Acknowledgement Receipt</SelectItem>
                                <SelectItem value="Invoice">Invoice</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>New Due Date</Label>
                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Notes for Combined Invoice</Label>
                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSubmit}>Create Combined Invoice</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const InvoicesList = ({ invoices, isLoading, loadInvoices, clients, onEditInvoice }) => {
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [filters, setFilters] = useState({
    client: '',
    dateFrom: '',
    dateTo: ''
  });
  const { toast } = useToast();
  // Keep original email and edit modal states for invoices
  const [emailModal, setEmailModal] = useState({ isOpen: false, data: null });
  
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [showCombineModal, setShowCombineModal] = useState(false);

  useEffect(() => {
    let filtered = [...invoices]; // 'invoices' prop is already status-filtered from FormsPage

    // Filter by client name (case-insensitive)
    if (filters.client) {
      filtered = filtered.filter(inv => inv.client_name.toLowerCase().includes(filters.client.toLowerCase()));
    }

    // No status filter here, it's handled by FormsPage

    // Filter by date range (issue_date)
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      // Set time to start of day for accurate comparison
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(inv => new Date(inv.issue_date) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      // Set time to end of day for accurate comparison
      toDate.setHours(23, 59, 59, 999); 
      filtered = filtered.filter(inv => new Date(inv.issue_date) <= toDate);
    }

    setFilteredInvoices(filtered);
  }, [invoices, filters]);

  // Updated getStatusBadge based on new styles and including 'archived' and 'billed'
  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': { className: "bg-green-100 text-green-800", text: "Paid" },
      'unpaid': { className: "bg-yellow-100 text-yellow-800", text: "Unpaid" },
      'billed': { className: "bg-blue-100 text-blue-800", text: "Billed" },
      'overdue': { className: "bg-red-100 text-red-800", text: "Overdue" },
      'void': { className: "bg-gray-100 text-gray-800", text: "Void" },
      'archived': { className: "bg-gray-100 text-gray-500", text: "Archived" },
      'consolidated': { className: "bg-purple-100 text-purple-800", text: "Consolidated" } // New status
    };
    const config = statusConfig[status] || { className: "bg-gray-100 text-gray-800", text: status };
    return <Badge className={`${config.className} capitalize`}>{config.text}</Badge>;
  };

  // Combined status update function from outline
  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      await Invoice.update(invoiceId, { 
        status: newStatus,
        ...(newStatus === 'paid' && { payment_date: new Date().toISOString().split('T')[0] })
      });
      toast({ title: 'Success', description: `Invoice marked as ${newStatus}.` });
      loadInvoices();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update invoice status.' });
    }
  };

  // Separate archive function (as requested in outline implicitly)
  const handleArchive = async (invoiceId) => {
    if (window.confirm('Are you sure you want to archive this invoice?')) {
      try {
        await Invoice.update(invoiceId, { status: 'archived' });
        toast({ title: 'Success', description: 'Invoice archived.' });
        loadInvoices();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to archive invoice.' });
      }
    }
  };

  // Restore original email modal functionality
  const openEmailModal = (invoice) => {
    setEmailModal({
        isOpen: true,
        data: {
            to: invoice.client_email,
            subject: `Invoice ${invoice.invoice_number} from MCTS`,
            body: `Dear ${invoice.client_name},

This is a reminder for your invoice:

Invoice Number: ${invoice.invoice_number}
Total Amount: ₱${invoice.amount?.toFixed(2)}
Due Date: ${invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'N/A'}

Please remit payment at your earliest convenience.

Thank you for your business!

Regards,
MCTS Team`
        }
    });
  };

  const handleSendEmail = async (emailData) => {
      try {
          await base44.integrations.Core.SendEmail(emailData); // Changed to use base44 client
          toast({ title: 'Email Sent', description: `Invoice sent to ${emailData.to}`});
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to send email.' });
      }
      setEmailModal({ isOpen: false, data: null });
  };

  // Uses onEditInvoice prop from parent
  const handleEditInvoice = (invoice) => {
    onEditInvoice(invoice);
  };

  const clearFilters = () => {
    setFilters({
      client: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    setSelectedInvoiceIds(prev => {
        if (checked) {
            return [...prev, invoiceId];
        } else {
            return prev.filter(id => id !== invoiceId);
        }
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // Only select invoices that can be combined (not 'consolidated' or 'archived')
      const selectableInvoices = filteredInvoices.filter(inv => 
        inv.status !== 'consolidated' && inv.status !== 'archived'
      );

      if (selectedInvoiceIds.length > 0) {
        const firstInvoice = filteredInvoices.find(inv => inv.id === selectedInvoiceIds[0]);
        const sameClientSelectableInvoices = selectableInvoices.filter(inv => 
          inv.client_id === firstInvoice.client_id
        );
        setSelectedInvoiceIds(sameClientSelectableInvoices.map(inv => inv.id));
      } else {
        setSelectedInvoiceIds(selectableInvoices.map(inv => inv.id));
      }
    } else {
      setSelectedInvoiceIds([]);
    }
  };

  const canCombineInvoices = () => {
    if (selectedInvoiceIds.length < 2) return false;
    
    const selected = filteredInvoices.filter(inv => selectedInvoiceIds.includes(inv.id));
    const firstClientId = selected[0]?.client_id;
    
    return selected.every(inv => 
      inv.client_id === firstClientId && 
      inv.status !== 'consolidated' && 
      inv.status !== 'archived'
    );
  };

  const handleCombineInvoices = async (combinedData) => {
    try {
      const year = new Date().getFullYear();
      const allExistingInvoices = await Invoice.list(); // Fetch all invoices for numbering
      const yearInvoices = allExistingInvoices.filter(inv => {
        const parts = inv.invoice_number?.split('-');
        return parts.length === 3 && parts[0] === 'MCTS' && parseInt(parts[1], 10) === year;
      });
      const maxNum = yearInvoices.reduce((max, inv) => {
        const parts = inv.invoice_number.split('-');
        const num = parseInt(parts[2], 10);
        return num > max ? num : max;
      }, 0);
      const newInvoiceNumber = `MCTS-${year}-${String(maxNum + 1).padStart(5, '0')}`;

      // Create the new consolidated invoice
      const newInvoice = await Invoice.create({
        invoice_number: newInvoiceNumber,
        receipt_type: combinedData.receiptType,
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: combinedData.dueDate,
        client_id: combinedData.clientId,
        client_name: combinedData.clientName,
        client_email: combinedData.clientEmail,
        job_ids: combinedData.jobIds,
        items: combinedData.items,
        subtotal: combinedData.subtotal,
        discount: combinedData.discount,
        amount: combinedData.amount,
        status: 'unpaid',
        notes: combinedData.notes,
        consolidated_from_invoice_ids: combinedData.originalInvoiceIds
      });

      // Update original invoices to consolidated status
      for (const originalId of combinedData.originalInvoiceIds) {
        await Invoice.update(originalId, {
          status: 'consolidated',
          consolidated_to_invoice_id: newInvoice.id
        });
      }

      toast({ title: 'Success', description: `Created consolidated invoice ${newInvoiceNumber}` });
      setShowCombineModal(false);
      setSelectedInvoiceIds([]);
      loadInvoices(); // Reload all invoices
    } catch (error) {
      console.error('Error combining invoices:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to combine invoices.' });
    }
  };

  const selectedInvoices = filteredInvoices.filter(inv => selectedInvoiceIds.includes(inv.id));

  const totalSelectableInvoices = filteredInvoices.filter(inv => inv.status !== 'consolidated' && inv.status !== 'archived').length;
  const isAllSelected = selectedInvoiceIds.length > 0 && selectedInvoiceIds.length === totalSelectableInvoices;


  return (
    <>
      {/* Filters */}
      <Card className="mb-4 bg-card border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-foreground">Client Name</Label>
              <Input
                placeholder="Search by client..."
                value={filters.client}
                onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                className="text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="text-foreground"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
          {(filters.client || filters.dateFrom || filters.dateTo) && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection and Combine Actions */}
      {filteredInvoices.length > 0 && (
        <Card className="mb-4 bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-invoices"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(checked)}
                  disabled={totalSelectableInvoices === 0}
                />
                <Label htmlFor="select-all-invoices" className="text-sm cursor-pointer">
                  {selectedInvoiceIds.length > 0 ? `${selectedInvoiceIds.length} selected` : 'Select invoices'}
                </Label>
              </div>
            </div>
            {canCombineInvoices() && (
              <Button onClick={() => setShowCombineModal(true)} variant="outline">
                <Merge className="w-4 h-4 mr-2" />
                Combine {selectedInvoiceIds.length} Invoices
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead> {/* Checkbox column */}
              <TableHead className="text-foreground">Invoice #</TableHead>
              <TableHead className="text-foreground">Client</TableHead>
              <TableHead className="text-foreground">Issue Date</TableHead>
              <TableHead className="text-foreground">Due Date</TableHead>
              <TableHead className="text-right text-foreground">Amount</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-right text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">Loading invoices...</TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">No invoices found.</TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => {
                const isSelectable = invoice.status !== 'consolidated' && invoice.status !== 'archived';
                const isDisabled = selectedInvoiceIds.length > 0 && 
                  selectedInvoices.length > 0 && 
                  invoice.client_id !== selectedInvoices[0].client_id &&
                  !selectedInvoiceIds.includes(invoice.id); // Allow deselection even if client mismatch occurs due to other selections
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {isSelectable && (
                        <Checkbox
                          checked={selectedInvoiceIds.includes(invoice.id)}
                          onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked)}
                          disabled={isDisabled}
                          className="rounded"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{invoice.invoice_number}</TableCell>
                    <TableCell className="text-foreground">{invoice.client_name}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.issue_date ? format(new Date(invoice.issue_date), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="text-right text-foreground">₱{invoice.amount?.toFixed(2)}</TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit Invoice
                          </DropdownMenuItem>
                          <Link to={createPageUrl(`InvoicePrintView?id=${invoice.id}`)} target="_blank">
                            <DropdownMenuItem>
                              <Printer className="w-4 h-4 mr-2" /> Print/View
                            </DropdownMenuItem>
                          </Link>
                          {invoice.client_email && (
                            <DropdownMenuItem onClick={() => openEmailModal(invoice)}>
                              <Mail className="w-4 h-4 mr-2" /> Send Email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {invoice.status !== 'paid' && invoice.status !== 'archived' && invoice.status !== 'consolidated' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'paid')}>
                              <Check className="w-4 h-4 mr-2" /> Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== 'unpaid' && invoice.status !== 'billed' && invoice.status !== 'archived' && invoice.status !== 'consolidated' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'unpaid')}>
                              <X className="w-4 h-4 mr-2" /> Mark as Unpaid
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== 'billed' && invoice.status !== 'paid' && invoice.status !== 'archived' && invoice.status !== 'consolidated' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'billed')}>
                              <CreditCard className="w-4 h-4 mr-2" /> Mark as Billed
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== 'void' && invoice.status !== 'archived' && invoice.status !== 'consolidated' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'void')}>
                              <FileText className="w-4 h-4 mr-2" /> Mark as Void
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {invoice.status !== 'archived' && (
                            <DropdownMenuItem onClick={() => handleArchive(invoice.id)} className="text-red-600">
                              <TrashIcon className="w-4 h-4 mr-2" /> Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Email Modal remains active */}
      <EmailModal
          isOpen={emailModal.isOpen}
          onClose={() => setEmailModal({ isOpen: false, data: null })}
          recipient={emailModal.data?.to}
          subject={emailModal.data?.subject}
          defaultBody={emailModal.data?.body}
          onSend={handleSendEmail}
      />
      
      {showCombineModal && (
        <CombineInvoicesModal
          invoices={selectedInvoices}
          onCombine={handleCombineInvoices}
          onClose={() => setShowCombineModal(false)}
        />
      )}
    </>
  );
};

const QuotationsList = ({ quotations, isLoading, loadQuotations }) => {
    const [convertingQuotation, setConvertingQuotation] = useState(null);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const { toast } = useToast();

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending_review': { className: "bg-yellow-100 text-yellow-800", text: "Pending Review" },
            'approved': { className: "bg-green-100 text-green-800", text: "Approved" },
            'rejected': { className: "bg-red-100 text-red-800", text: "Rejected" },
            'converted': { className: "bg-blue-100 text-blue-800", text: "Converted to Task" }
        };
        const config = statusConfig[status] || { className: "bg-gray-100 text-gray-800", text: status };
        return <Badge className={config.className}>{config.text}</Badge>;
    };

    const handleConvert = (quotation) => {
        setConvertingQuotation(quotation);
        setShowConvertModal(true);
    };

    const handleDelete = async (quotationId) => {
        if (window.confirm('Are you sure you want to delete this quotation?')) {
            try {
                await Quotation.delete(quotationId);
                toast({ title: 'Success', description: 'Quotation deleted.' });
                loadQuotations();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete quotation.' });
            }
        }
    };

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-foreground">Quotation ID</TableHead>
                            <TableHead className="text-foreground">Client</TableHead>
                            <TableHead className="text-foreground">Date</TableHead>
                            <TableHead className="text-right text-foreground">Total</TableHead>
                            <TableHead className="text-foreground">Status</TableHead>
                            <TableHead className="text-right text-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                        ) : quotations.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No quotations found.</TableCell></TableRow>
                        ) : (
                            quotations.map(quote => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium text-foreground">{quote.quotation_id}</TableCell>
                                    <TableCell className="text-foreground">{quote.client_info?.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{quote.created_date ? format(new Date(quote.created_date), 'MMM dd, yyyy') : '-'}</TableCell>
                                    <TableCell className="text-right text-foreground">₱{quote.total_price?.toFixed(2)}</TableCell>
                                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Link to={createPageUrl(`QuotationPrintView?id=${quote.id}`)} target="_blank">
                                                <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                                            </Link>
                                            {quote.status === 'pending_review' && (
                                                <Button variant="ghost" size="icon" onClick={() => handleConvert(quote)}>
                                                    <FileText className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(quote.id)}>
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

            {showConvertModal && convertingQuotation && (
                <ConvertToJobModal
                    quotation={convertingQuotation}
                    onConverted={() => {
                        setShowConvertModal(false);
                        setConvertingQuotation(null);
                        loadQuotations();
                    }}
                />
            )}
        </>
    );
};

const ReimbursementsList = ({ requests, isLoading, loadRequests, clients }) => {
    const [editingRequest, setEditingRequest] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const { toast } = useToast();

    const getStatusBadge = (status) => {
        // The previous statusMap was unused. Re-implementing the switch for clarity.
        switch(status) {
            case 'Pending': return <Badge variant="secondary">Pending</Badge>;
            case 'Approved': return <Badge>Approved</Badge>;
            case 'Reimbursed': return <Badge className="bg-green-500 text-green-50">Reimbursed</Badge>; 
            case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this reimbursement request?")) {
            try {
                await ReimbursementRequest.delete(id);
                toast({ title: "Success", description: "Request deleted." });
                loadRequests();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not delete request.' });
            }
        }
    };
    
    const handleEdit = (request) => {
        setEditingRequest(request);
        setShowForm(true);
    }

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-foreground">Requestor</TableHead>
                            <TableHead className="text-foreground">Client</TableHead>
                            <TableHead className="text-foreground">Date</TableHead>
                            <TableHead className="text-foreground">Status</TableHead>
                            <TableHead className="text-right text-foreground">Total</TableHead>
                            <TableHead className="text-right text-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center p-4 text-muted-foreground">Loading...</TableCell></TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No reimbursement requests found.</TableCell></TableRow>
                        ) : (
                            requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="whitespace-nowrap text-foreground">{req.requestor_name}</TableCell>
                                    <TableCell className="whitespace-nowrap text-foreground">
                                        {clients.find(c => c.id === req.client_id)?.client_name || req.client_name}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">{req.request_date ? format(new Date(req.request_date), 'MMM d, yyyy') : '-'}</TableCell>
                                    <TableCell className="whitespace-nowrap">{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right whitespace-nowrap text-foreground">₱{req.total_amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Link to={createPageUrl(`ReimbursementPrintView?id=${req.id}`)} target="_blank">
                                                <Button variant="ghost" size="icon"><Printer className="w-4 h-4" /></Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(req)}><Edit className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(req.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="dialog-content max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingRequest ? 'Edit' : 'New'} Reimbursement Form</DialogTitle>
                    </DialogHeader>
                    <ReimbursementForm 
                        editingRequest={editingRequest}
                        clients={clients}
                        onSubmitted={() => {
                            setShowForm(false);
                            setEditingRequest(null);
                            loadRequests();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

const IDPrintForm = ({ onSubmitted, editingRecord = null }) => {
    const [formData, setFormData] = useState(editingRecord ? {
        employee_name: editingRecord.employee_name || '',
        id_number: editingRecord.id_number || '',
        position: editingRecord.position || '',
        client_id: editingRecord.client_id || '',
        client_name: editingRecord.client_name || '',
        print_date: editingRecord.print_date || format(new Date(), 'yyyy-MM-dd'),
        unit_price: editingRecord.unit_price || 50,
        status: editingRecord.status || 'for_print'
    } : {
        employee_name: '',
        id_number: '',
        position: '',
        client_id: '',
        client_name: '',
        print_date: format(new Date(), 'yyyy-MM-dd'),
        unit_price: 50,
        status: 'for_print'
    });
    const [clients, setClients] = useState([]);
    const { toast } = useToast();

    useEffect(() => {
        const loadClients = async () => {
            const clientData = await Client.list();
            setClients(clientData);
        };
        loadClients();
    }, []);

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
        
        if (!formData.employee_name || !formData.client_id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill in required fields.' });
            return;
        }

        try {
            if (editingRecord) {
                await IDPrintRecord.update(editingRecord.id, formData);
                toast({ title: 'Success', description: 'ID Print record updated.' });
            } else {
                await IDPrintRecord.create(formData);
                toast({ title: 'Success', description: 'ID Print record created.' });
                setFormData({
                    employee_name: '',
                    id_number: '',
                    position: '',
                    client_id: '',
                    client_name: '',
                    print_date: format(new Date(), 'yyyy-MM-dd'),
                    unit_price: 50,
                    status: 'for_print'
                });
            }
            onSubmitted();
        } catch (error) {
            console.error('Error creating/updating ID record:', error);
            toast({ variant: 'destructive', title: 'Error', description: `Failed to ${editingRecord ? 'update' : 'create'} record.` });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Employee Name *</Label>
                    <Input
                        value={formData.employee_name}
                        onChange={e => setFormData({...formData, employee_name: e.target.value})}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>ID Number</Label>
                    <Input
                        value={formData.id_number}
                        onChange={e => setFormData({...formData, id_number: e.target.value})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                        value={formData.position}
                        onChange={e => setFormData({...formData, position: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Client *</Label>
                    <Select value={formData.client_id} onValueChange={handleClientChange} required>
                        <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                        <SelectContent>
                            {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>{client.client_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Print Date</Label>
                    <Input
                        type="date"
                        value={formData.print_date}
                        onChange={e => setFormData({...formData, print_date: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit">{editingRecord ? 'Update' : 'Create'} ID Record</Button>
            </div>
        </form>
    );
};

// Add this new component before the main FormsPage component
const ClientOrdersTab = ({ orders, isLoading, onRefresh }) => {
    const { toast } = useToast();
    const [convertingOrder, setConvertingOrder] = useState(null);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [viewingOrder, setViewingOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    
    // Enhanced conversion state
    const [selectedItems, setSelectedItems] = useState([]);
    const [taskDeadline, setTaskDeadline] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    const [assignedTo, setAssignedTo] = useState('');
    const [teamMembers, setTeamMembers] = useState([]);

    const publicFormUrl = `${window.location.origin}${createPageUrl('ClientOrderForm')}`;

    // Load team members when component mounts
    useEffect(() => {
        const loadTeam = async () => {
            try {
                const users = await User.list();
                setTeamMembers(users);
            } catch (error) {
                console.error('Error loading team:', error);
            }
        };
        loadTeam();
    }, []);

    const getStatusBadge = (status) => {
        const statusConfig = {
            'new': { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200", text: "New" },
            'reviewing': { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200", text: "Reviewing" },
            'approved': { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200", text: "Approved" },
            'converted_to_job': { className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200", text: "Converted to Task" },
            'rejected': { className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200", text: "Rejected" }
        };
        const config = statusConfig[status] || { className: "bg-gray-100 text-gray-800", text: status };
        return <Badge className={config.className}>{config.text}</Badge>;
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicFormUrl);
        toast({ title: 'Link Copied!', description: 'The client order form link has been copied to your clipboard.' });
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await Order.update(orderId, { status: newStatus });
            toast({ title: 'Success', description: 'Order status updated.' });
            onRefresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
        }
    };

    const handleDelete = async (orderId) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await Order.delete(orderId);
                toast({ title: 'Success', description: 'Order deleted.' });
                onRefresh();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete order.' });
            }
        }
    };

    const handleConvertToTask = (order) => {
        setConvertingOrder(order);
        // Pre-select all items by default
        setSelectedItems(order.items?.map((_, idx) => idx) || []);
        // Set default deadline
        setTaskDeadline(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
        // Reset assignee
        setAssignedTo('');
        setShowConvertModal(true);
    };

    const handleViewOrder = (order) => {
        setViewingOrder(order);
        setShowViewModal(true);
    };

    const handleItemToggle = (itemIndex) => {
        setSelectedItems(prev => {
            if (prev.includes(itemIndex)) {
                return prev.filter(idx => idx !== itemIndex);
            } else {
                return [...prev, itemIndex];
            }
        });
    };

    const handleSelectAllItems = () => {
        if (selectedItems.length === convertingOrder?.items?.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(convertingOrder?.items?.map((_, idx) => idx) || []);
        }
    };

    const confirmConvertToTask = async () => {
        if (!convertingOrder) return;

        if (selectedItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one item to convert.' });
            return;
        }

        try {
            // Get selected items
            const itemsToConvert = selectedItems.map(idx => convertingOrder.items[idx]);
            
            // Calculate total for selected items
            const totalAmount = itemsToConvert.reduce((sum, item) => 
                sum + (item.quantity * item.price), 0
            );

            // Map order items to job format
            const jobItems = itemsToConvert.map(item => ({
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity,
                price: item.price
            }));

            // Create job title from selected items
            const jobTitle = itemsToConvert.length === 1 
                ? itemsToConvert[0].item_name
                : `Order from ${convertingOrder.client_name} (${itemsToConvert.length} items)`;

            // Prepare job data with proper field mapping
            const jobData = {
                // Core identification
                title: jobTitle,
                job_id: `MCTS-${Date.now().toString().slice(-6)}`,
                
                // Client information
                client_name: convertingOrder.client_name,
                client_phone: convertingOrder.client_phone,
                client_email: convertingOrder.client_email || '',
                
                // Order reference for tracking
                order_id: convertingOrder.id,
                order_number: convertingOrder.order_number,
                
                // Items and pricing
                items: jobItems,
                job_type: itemsToConvert.map(i => i.item_name).join(', '),
                quantity: itemsToConvert.reduce((sum, i) => sum + i.quantity, 0),
                estimated_price: totalAmount,
                actual_price: totalAmount,
                
                // Special instructions from order
                special_instructions: convertingOrder.special_instructions 
                    ? `Order #${convertingOrder.order_number}\n\n${convertingOrder.special_instructions}`
                    : `Converted from Order #${convertingOrder.order_number}`,
                
                // Assignment and scheduling
                assigned_to: assignedTo || null,
                deadline: taskDeadline,
                
                // Status
                status: 'pending_approval',
                priority_level: 'normal'
            };

            // Create the new job
            const newJob = await Job.create(jobData);

            // Update order status and link to job
            await Order.update(convertingOrder.id, {
                status: 'converted_to_job',
                converted_job_id: newJob.id
            });

            toast({ 
                title: 'Success!', 
                description: `Task created${assignedTo ? ' and assigned' : ''} from order ${convertingOrder.order_number}.` 
            });
            
            setShowConvertModal(false);
            setConvertingOrder(null);
            setSelectedItems([]);
            onRefresh();
        } catch (error) {
            console.error('Error converting order to task:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to convert order to task.' });
        }
    };

    const selectedItemsTotal = selectedItems.reduce((sum, idx) => {
        const item = convertingOrder?.items?.[idx];
        return sum + (item ? item.quantity * item.price : 0);
    }, 0);

    return (
        <div className="space-y-6">
            {/* Public Form Link Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <Link2 className="w-5 h-5" />
                        Client Order Form Link
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Share this link with your clients so they can submit orders directly
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Input
                            value={publicFormUrl}
                            readOnly
                            className="bg-white dark:bg-gray-900 font-mono text-sm"
                        />
                        <Button onClick={handleCopyLink} variant="outline">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                        <a href={publicFormUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open
                            </Button>
                        </a>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This form can be accessed by anyone without logging in. Clients can browse your items, add them to their order, and submit their contact information.
                    </p>
                </CardContent>
            </Card>

            {/* Orders List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Client Orders ({orders.length})</CardTitle>
                    <Button onClick={onRefresh} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-foreground">Order #</TableHead>
                                    <TableHead className="text-foreground">Client</TableHead>
                                    <TableHead className="text-foreground">Contact</TableHead>
                                    <TableHead className="text-foreground">Items</TableHead>
                                    <TableHead className="text-right text-foreground">Total</TableHead>
                                    <TableHead className="text-foreground">Status</TableHead>
                                    <TableHead className="text-foreground">Date</TableHead>
                                    <TableHead className="text-right text-foreground">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                                            Loading orders...
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            No orders yet. Share the order form link with your clients to get started!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium text-foreground">
                                                {order.order_number}
                                            </TableCell>
                                            <TableCell className="text-foreground">
                                                <div>
                                                    <p className="font-medium">{order.client_name}</p>
                                                    {order.client_company && (
                                                        <p className="text-xs text-muted-foreground">{order.client_company}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div className="text-sm">
                                                    <p>{order.client_phone}</p>
                                                    {order.client_email && (
                                                        <p className="text-xs">{order.client_email}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {order.items?.length || 0} items
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-foreground">
                                                ₱{order.total_amount?.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {order.created_date ? format(new Date(order.created_date), 'MMM dd, yyyy') : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {(order.status === 'new' || order.status === 'reviewing' || order.status === 'approved') && (
                                                            <>
                                                                {order.status === 'new' && (
                                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'reviewing')}>
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Mark as Reviewing
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {order.status === 'reviewing' && (
                                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'approved')}>
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Approve Order
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handleConvertToTask(order)}>
                                                                    <FileText className="w-4 h-4 mr-2" />
                                                                    Convert to Task
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDelete(order.id)}
                                                            className="text-red-600 focus:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete Order
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* View Order Details Modal */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="dialog-content max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-card-foreground">Order Details</DialogTitle>
                    </DialogHeader>
                    {viewingOrder && (
                        <div className="space-y-4 text-card-foreground">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Order Number</Label>
                                    <p className="font-semibold">{viewingOrder.order_number}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Date</Label>
                                    <p className="font-semibold">{viewingOrder.created_date ? format(new Date(viewingOrder.created_date), 'MMM dd, yyyy') : '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Client</Label>
                                    <p className="font-semibold">{viewingOrder.client_name}</p>
                                    {viewingOrder.client_company && (
                                        <p className="text-sm text-muted-foreground">{viewingOrder.client_company}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Contact</Label>
                                    <p className="font-semibold">{viewingOrder.client_phone}</p>
                                    {viewingOrder.client_email && (
                                        <p className="text-sm text-muted-foreground">{viewingOrder.client_email}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label className="font-semibold mb-2 block">Order Items</Label>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewingOrder.items?.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₱{item.price?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">₱{(item.quantity * item.price)?.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {viewingOrder.promo_code && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <Label className="text-xs text-green-700">Promo Code Applied</Label>
                                    <p className="font-semibold text-green-800">{viewingOrder.promo_code}</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <span className="font-bold text-lg">Total Amount:</span>
                                <span className="text-2xl font-bold text-blue-600">₱{viewingOrder.total_amount?.toFixed(2)}</span>
                            </div>

                            {viewingOrder.special_instructions && (
                                <div>
                                    <Label className="font-semibold mb-2 block">Special Instructions</Label>
                                    <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-lg">
                                        {viewingOrder.special_instructions}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Enhanced Convert to Task Dialog */}
            <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
                <DialogContent className="dialog-content max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-card-foreground">Convert Order to Task</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Select items to include in the task and configure task details
                        </p>
                    </DialogHeader>
                    {convertingOrder && (
                        <div className="space-y-6 text-card-foreground">
                            {/* Order Info */}
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Order Number</Label>
                                        <p className="font-semibold">{convertingOrder.order_number}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Client</Label>
                                        <p className="font-semibold">{convertingOrder.client_name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Item Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold">Select Items to Include</Label>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleSelectAllItems}
                                    >
                                        {selectedItems.length === convertingOrder.items?.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                <TableHead>Item</TableHead>
                                                <TableHead className="text-center">Qty</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {convertingOrder.items?.map((item, idx) => (
                                                <TableRow key={idx} className={selectedItems.includes(idx) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedItems.includes(idx)}
                                                            onCheckedChange={() => handleItemToggle(idx)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{item.item_name}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">₱{item.price?.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">₱{(item.quantity * item.price)?.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {selectedItems.length > 0 && (
                                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <span className="font-semibold">Selected Items Total:</span>
                                        <span className="text-xl font-bold text-blue-600">₱{selectedItemsTotal.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Task Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Task Deadline *</Label>
                                    <Input
                                        type="date"
                                        value={taskDeadline}
                                        onChange={(e) => setTaskDeadline(e.target.value)}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Default: 7 days from now
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Assign To (Optional)</Label>
                                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Leave unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>Unassigned</SelectItem>
                                            {teamMembers.map(member => (
                                                <SelectItem key={member.id} value={member.email}>
                                                    {member.nickname || member.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Task will appear in their queue
                                    </p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                                <h4 className="font-semibold mb-3">Task Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Items selected:</span>
                                        <span className="font-medium">{selectedItems.length} of {convertingOrder.items?.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total value:</span>
                                        <span className="font-medium">₱{selectedItemsTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Deadline:</span>
                                        <span className="font-medium">{format(new Date(taskDeadline), 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Assigned to:</span>
                                        <span className="font-medium">
                                            {assignedTo 
                                                ? teamMembers.find(m => m.email === assignedTo)?.nickname || teamMembers.find(m => m.email === assignedTo)?.full_name || assignedTo
                                                : 'Unassigned'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConvertModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={confirmConvertToTask}
                            disabled={selectedItems.length === 0}
                        >
                            Create Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const PurchaseOrderForm = ({ onSubmitted, suppliers, editingPO = null }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(editingPO ? {
      po_number: editingPO.po_number || `PO-${Date.now().toString().slice(-6)}`,
      supplier_id: editingPO.supplier_id || '',
      supplier_name: editingPO.supplier_name || '',
      issue_date: editingPO.issue_date || format(new Date(), 'yyyy-MM-dd'),
      due_date: editingPO.due_date || format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      items: editingPO.items || [{ item_name: '', description: '', quantity: 1, unit_price: 0 }],
      shipping_cost: editingPO.shipping_cost || 0,
      tax_amount: editingPO.tax_amount || 0,
      notes: editingPO.notes || '',
      approved_by_email: editingPO.approved_by_email || ''
  } : {
      po_number: `PO-${Date.now().toString().slice(-6)}`,
      supplier_id: '',
      supplier_name: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      items: [{ item_name: '', description: '', quantity: 1, unit_price: 0 }],
      shipping_cost: 0,
      tax_amount: 0,
      notes: '',
      approved_by_email: ''
  });
  const { toast } = useToast();

  useEffect(() => {
      const loadUsers = async () => {
          const userData = await User.list();
          setUsers(userData);
      };
      loadUsers();
  }, []);

  const handleSupplierChange = (supplierId) => {
      const supplier = suppliers.find(s => s.id === supplierId);
      setFormData(prev => ({
          ...prev,
          supplier_id: supplierId,
          supplier_name: supplier ? supplier.supplier_name : ''
      }));
  };

  const addItem = () => {
      setFormData(prev => ({
          ...prev,
          items: [...prev.items, { item_name: '', description: '', quantity: 1, unit_price: 0 }]
      }));
  };

  const updateItem = (index, field, value) => {
      const newItems = [...formData.items];
      newItems[index][field] = value;
      setFormData(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index) => {
      setFormData(prev => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index)
      }));
  };

  const calculateTotals = () => {
      const subtotal = formData.items.reduce((sum, item) => {
          return sum + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0);
      }, 0);
      const total = subtotal + (parseFloat(formData.shipping_cost) || 0) + (parseFloat(formData.tax_amount) || 0);
      return { subtotal, total };
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!formData.supplier_id) {
          toast({ variant: 'destructive', title: 'Error', description: 'Please select a supplier.' });
          return;
      }

      const validItems = formData.items.filter(item => item.item_name.trim());
      if (validItems.length === 0) {
          toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item.' });
          return;
      }

      const { subtotal, total } = calculateTotals();

      try {
          if (editingPO) {
              await PurchaseOrder.update(editingPO.id, {
                  ...formData,
                  items: validItems,
                  subtotal,
                  total_amount: total
              });
              toast({ title: 'Success', description: 'Purchase Order updated successfully.' });
          } else {
              const currentUser = await User.me();
              const newPO = await PurchaseOrder.create({
                  ...formData,
                  items: validItems,
                  subtotal,
                  total_amount: total,
                  requested_by_email: currentUser.email,
                  status: 'draft'
              });

              // Notify approver if one is selected
              if (formData.approved_by_email) {
                await notifyPurchaseOrderApproval(newPO, formData.approved_by_email);
              }

              toast({ title: 'Success', description: 'Purchase Order created successfully.' });
          }
          onSubmitted();
      } catch (error) {
          console.error('Error creating/updating purchase order:', error);
          toast({ variant: 'destructive', title: 'Error', description: `Failed to ${editingPO ? 'update' : 'create'} purchase order.` });
      }
  };

  const { subtotal, total } = calculateTotals();

  return (
      <form onSubmit={handleSubmit} className="space-y-6 text-card-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input value={formData.po_number} onChange={e => setFormData({...formData, po_number: e.target.value})} required />
              </div>
              <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={formData.supplier_id} onValueChange={handleSupplierChange} required>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                          {suppliers.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
              </div>
          </div>

          <div className="space-y-3">
              <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="w-4 h-4 mr-2" />Add Item
                  </Button>
              </div>

              {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-secondary/50 rounded-lg">
                      <div className="col-span-3">
                          <Label className="text-xs">Brand Name</Label>
                          <Input
                              placeholder="Item name"
                              value={item.item_name}
                              onChange={e => updateItem(index, 'item_name', e.target.value)}
                          />
                      </div>
                      <div className="col-span-3">
                          <Label className="text-xs">Description</Label>
                          <Input
                              placeholder="Description"
                              value={item.description}
                              onChange={e => updateItem(index, 'description', e.target.value)}
                          />
                      </div>
                      <div className="col-span-2">
                          <Label className="text-xs">Qty</Label>
                          <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                      </div>
                      <div className="col-span-2">
                          <Label className="text-xs">Unit Price</Label>
                          <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                      </div>
                      <div className="col-span-1">
                          <Label className="text-xs">Total</Label>
                          <div className="text-sm font-medium pt-2">
                              ₱{((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}
                          </div>
                      </div>
                      <div className="col-span-1 flex items-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                      </div>
                  </div>
              ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                  <Label>Shipping Cost</Label>
                  <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shipping_cost}
                      onChange={e => setFormData({...formData, shipping_cost: parseFloat(e.target.value) || 0})}
                  />
              </div>
              <div className="space-y-2">
                  <Label>Tax Amount</Label>
                  <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.tax_amount}
                      onChange={e => setFormData({...formData, tax_amount: parseFloat(e.target.value) || 0})}
                  />
              </div>
              <div className="space-y-2">
                  <Label>To be Approved By</Label>
                  <Select value={formData.approved_by_email} onValueChange={(value) => setFormData({...formData, approved_by_email: value})}>
                      <SelectTrigger><SelectValue placeholder="Select approver" /></SelectTrigger>
                      <SelectContent>
                          {users.filter(u => u.role === 'admin').map(u => (
                              <SelectItem key={u.id} value={u.email}>{u.nickname || u.full_name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>

          <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes or instructions..."
              />
          </div>

          <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
              <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subtotal: ₱{subtotal.toFixed(2)}</p>
                  {formData.shipping_cost > 0 && (
                      <p className="text-sm text-muted-foreground">Shipping: ₱{parseFloat(formData.shipping_cost).toFixed(2)}</p>
                  )}
                  {formData.tax_amount > 0 && (
                      <p className="text-sm text-muted-foreground">Tax: ₱{parseFloat(formData.tax_amount).toFixed(2)}</p>
                  )}
              </div>
              <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-foreground">₱{total.toFixed(2)}</p>
              </div>
          </div>

          <div className="flex justify-end">
              <Button type="submit">{editingPO ? 'Update' : 'Create'} Purchase Order</Button>
          </div>
      </form>
  );
};

const PurchaseOrdersList = ({ purchaseOrders, isLoading, loadPurchaseOrders, onEditPO }) => {
    const { toast } = useToast();

    const getStatusBadge = (status) => {
        const statusConfig = {
            'draft': { className: "bg-gray-100 text-gray-800", text: "Draft" },
            'pending_approval': { className: "bg-yellow-100 text-yellow-800", text: "Pending Approval" },
            'approved': { className: "bg-green-100 text-green-800", text: "Approved" },
            'rejected': { className: "bg-red-100 text-red-800", text: "Rejected" },
            'ordered': { className: "bg-blue-100 text-blue-800", text: "Ordered" },
            'received': { className: "bg-purple-100 text-purple-800", text: "Received" },
            'cancelled': { className: "bg-gray-100 text-gray-500", text: "Cancelled" }
        };
        const config = statusConfig[status] || { className: "bg-gray-100 text-gray-800", text: status };
        return <Badge className={config.className}>{config.text}</Badge>;
    };

    const handleStatusUpdate = async (poId, newStatus) => {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'approved') {
                updateData.approved_date = new Date().toISOString();
            }
            await PurchaseOrder.update(poId, updateData);
            toast({ title: 'Success', description: `Purchase Order marked as ${newStatus}.` });
            loadPurchaseOrders();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
        }
    };

    const handleDelete = async (poId) => {
        if (window.confirm('Are you sure you want to delete this purchase order?')) {
            try {
                await PurchaseOrder.delete(poId);
                toast({ title: 'Success', description: 'Purchase Order deleted.' });
                loadPurchaseOrders();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete purchase order.' });
            }
        }
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-foreground">PO Number</TableHead>
                        <TableHead className="text-foreground">Supplier</TableHead>
                        <TableHead className="text-foreground">Issue Date</TableHead>
                        <TableHead className="text-foreground">Due Date</TableHead>
                        <TableHead className="text-right text-foreground">Total</TableHead>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell>
                        </TableRow>
                    ) : purchaseOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">No purchase orders found.</TableCell>
                        </TableRow>
                    ) : (
                        purchaseOrders.map(po => (
                            <TableRow key={po.id}>
                                <TableCell className="font-medium text-foreground">{po.po_number}</TableCell>
                                <TableCell className="text-foreground">{po.supplier_name}</TableCell>
                                <TableCell className="text-muted-foreground">{po.issue_date ? format(new Date(po.issue_date), 'MMM dd, yyyy') : '-'}</TableCell>
                                <TableCell className="text-muted-foreground">{po.due_date ? format(new Date(po.due_date), 'MMM dd, yyyy') : '-'}</TableCell>
                                <TableCell className="text-right text-foreground">₱{po.total_amount?.toFixed(2)}</TableCell>
                                <TableCell>{getStatusBadge(po.status)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEditPO(po)}>
                                                <Edit className="w-4 h-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <Link to={createPageUrl(`PurchaseOrderPrintView?id=${po.id}`)} target="_blank">
                                                <DropdownMenuItem>
                                                    <Printer className="w-4 h-4 mr-2" /> Print/View
                                                </DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuSeparator />
                                            {po.status === 'draft' && (
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(po.id, 'pending_approval')}>
                                                    <Send className="w-4 h-4 mr-2" /> Submit for Approval
                                                </DropdownMenuItem>
                                            )}
                                            {po.status === 'pending_approval' && (
                                                <>
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(po.id, 'approved')}>
                                                        <Check className="w-4 h-4 mr-2" /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(po.id, 'rejected')}>
                                                        <X className="w-4 h-4 mr-2" /> Reject
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            {po.status === 'approved' && (
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(po.id, 'ordered')}>
                                                    <ShoppingCart className="w-4 h-4 mr-2" /> Mark as Ordered
                                                </DropdownMenuItem>
                                            )}
                                            {po.status === 'ordered' && (
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(po.id, 'received')}>
                                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Received
                                                </DropdownMenuItem>
                                            )}
                                            {(po.status === 'draft' || po.status === 'pending_approval' || po.status === 'approved' || po.status === 'ordered') && (
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(po.id, 'cancelled')} className="text-red-600">
                                                    <X className="w-4 h-4 mr-2" /> Mark as Cancelled
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleDelete(po.id)} className="text-red-600">
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};


export default function FormsPage() {
    const [quotations, setQuotations] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [idPrintRecords, setIdPrintRecords] = useState([]);
    const [reimbursementRequests, setReimbursementRequests] = useState([]);
    const [orders, setOrders] = useState([]); // New state for client orders
    const [purchaseOrders, setPurchaseOrders] = useState([]); // New state for Purchase Orders
    const [keychainOrders, setKeychainOrders] = useState([]); // New state for keychain orders
    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]); // New state for Suppliers
    const [pricelist, setPricelist] = useState([]); // Added pricelist state
    const [isLoading, setIsLoading] = useState(true);
    const [showNewQuoteForm, setShowNewQuoteForm] = useState(false);
    const [showNewInvoiceForm, setShowNewInvoiceForm] = useState(false);
    const [showNewIDForm, setShowNewIDForm] = useState(false);
    const [showBatchIDUpload, setShowBatchIDUpload] = useState(false);
    const [showNewReimbursementForm, setShowNewReimbursementForm] = useState(false);
    const [showNewPOForm, setShowNewPOForm] = useState(false); // New state for PO form
    
    const [editingQuotation, setEditingQuotation] = useState(null);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [editingIdRecord, setEditingIdRecord] = useState(null);
    const [editingPO, setEditingPO] = useState(null);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [convertingQuotation, setConvertingQuotation] = useState(null);
    const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false); 

    const [invoiceFilter, setInvoiceFilter] = useState(['unpaid', 'billed']); 
    const [idFilters, setIdFilters] = useState({ 
        searchTerm: '', 
        client: 'all', 
        status: 'all', 
        invoice: 'all',
        dateFrom: '',
        dateTo: ''
    });
    const { toast } = useToast();
    const [invoicesForFilter, setInvoicesForFilter] = useState([]);

    const loadQuotations = useCallback(async () => {
        try {
            const quotationsData = await Quotation.list("-created_date");
            setQuotations(quotationsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        } catch (error) {
            console.error('Error loading quotations:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load quotations." });
        }
    }, [toast]);

    const loadInvoices = useCallback(async () => {
        try {
            const invoicesData = await Invoice.list("-issue_date");
            setInvoices(invoicesData.sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date)));
            setInvoicesForFilter(invoicesData);
        } catch (error) {
            console.error('Error loading invoices:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load invoices." });
        }
    }, [toast]);

    const loadIdRecords = useCallback(async () => {
        try {
            const idRecordsData = await IDPrintRecord.list("-print_date");
            setIdPrintRecords(idRecordsData);
        } catch (error) {
            console.error('Error loading ID records:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load ID print records." });
        }
    }, [toast]);

    const loadReimbursementRequests = useCallback(async () => {
        try {
            const reimbursementData = await ReimbursementRequest.list("-request_date");
            setReimbursementRequests(reimbursementData);
        } catch (error) {
            console.error('Error loading reimbursement requests:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load reimbursement requests." });
        }
    }, [toast]);

    const loadClients = useCallback(async () => {
        try {
            const clientData = await Client.list();
            setClients(clientData);
        } catch (error) {
            console.error('Error loading clients:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load clients." });
        }
    }, [toast]);

    const loadPricelist = useCallback(async () => {
        try {
            const pricelistData = await PriceListItem.list();
            setPricelist(pricelistData.sort((a,b) => a.item_name.localeCompare(b.item_name)));
        } catch (error) {
            console.error('Error loading pricelist:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load pricelist." });
        }
    }, [toast]);

    const loadOrders = useCallback(async () => {
        try {
            const ordersData = await Order.list('-created_date');
            setOrders(ordersData);
        } catch (error) {
            console.error('Failed to load orders:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load client orders." });
        }
    }, [toast]);

    const loadSuppliers = useCallback(async () => {
        try {
            const supplierData = await Supplier.list();
            setSuppliers(supplierData);
        } catch (error) {
            console.error('Error loading suppliers:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load suppliers." });
        }
    }, [toast]);

    const loadPurchaseOrders = useCallback(async () => {
        try {
            const poData = await PurchaseOrder.list('-issue_date');
            setPurchaseOrders(poData);
        } catch (error) {
            console.error('Error loading purchase orders:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load purchase orders." });
        }
    }, [toast]);

    const loadKeychainOrders = useCallback(async () => {
        try {
            const { KeychainOrder } = await import('@/entities/all');
            const keychainData = await KeychainOrder.list('-created_date');
            setKeychainOrders(keychainData);
        } catch (error) {
            console.error('Error loading keychain orders:', error);
            toast({ variant: "destructive", title: "Network Error", description: "Could not load keychain orders." });
        }
    }, [toast]);

    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadQuotations(),
                loadInvoices(),
                loadIdRecords(),
                loadReimbursementRequests(),
                loadClients(),
                loadPricelist(),
                loadOrders(),
                loadSuppliers(),
                loadPurchaseOrders(),
                loadKeychainOrders()
            ]);
        } catch (error) {
            // Error handling is already in individual load functions
        } finally {
            setIsLoading(false);
        }
    }, [loadQuotations, loadInvoices, loadIdRecords, loadReimbursementRequests, loadClients, loadPricelist, loadOrders, loadSuppliers, loadPurchaseOrders, loadKeychainOrders]);
    
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);


    const handleSendEmail = async (emailData) => {
        try {
            await base44.integrations.Core.SendEmail(emailData);
            toast({ title: 'Email Sent', description: `Email sent to ${emailData.to}`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send email.' });
        }
    };

    const handleIdStatusClick = async (record) => {
        if (record.status === 'for_print') {
            try {
                await IDPrintRecord.update(record.id, { status: 'printed' });
                toast({ title: "Status Updated", description: `${record.employee_name}'s ID marked as Printed.` });
                loadAllData();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not update status." });
            }
        }
    };
    
    const handleEditIdRecord = (record) => {
        setEditingIdRecord(record);
        setShowNewIDForm(true);
    };

    const handleDeleteIdRecord = async (recordId) => {
        if (window.confirm("Are you sure you want to delete this ID record?")) {
            try {
                await IDPrintRecord.delete(recordId);
                toast({ title: "Success", description: "ID Print record deleted." });
                loadAllData();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not delete record." });
            }
        }
    };

    const handleIdFormClose = () => {
        setShowNewIDForm(false);
        setEditingIdRecord(null);
    };

    const handleEditPO = (po) => {
        setEditingPO(po);
        setShowNewPOForm(true);
    };

    const handlePOFormClose = () => {
        setShowNewPOForm(false);
        setEditingPO(null);
    };
    
    const filteredIdRecords = idPrintRecords.filter(record => {
        const clientMatch = idFilters.client === 'all' || record.client_id === idFilters.client;
        const statusMatch = idFilters.status === 'all' || record.status === idFilters.status;
        const invoiceMatch = idFilters.invoice === 'all' || record.invoice_id === idFilters.invoice;
        const searchMatch = record.employee_name.toLowerCase().includes(idFilters.searchTerm.toLowerCase()) ||
                            (record.id_number || '').toLowerCase().includes(idFilters.searchTerm.toLowerCase()) ||
                            record.client_name.toLowerCase().includes(idFilters.searchTerm.toLowerCase());
        
        // Date filtering
        let dateMatch = true;
        if (idFilters.dateFrom) {
            const fromDate = new Date(idFilters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            dateMatch = dateMatch && new Date(record.print_date) >= fromDate;
        }
        if (idFilters.dateTo) {
            const toDate = new Date(idFilters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            dateMatch = dateMatch && new Date(record.print_date) <= toDate;
        }
        
        return clientMatch && statusMatch && searchMatch && invoiceMatch && dateMatch;
    });

    const getIdStatusBadge = (record) => {
        const baseClasses = "capitalize";
        switch(record.status) {
            case 'for_print': return <Badge onClick={() => handleIdStatusClick(record)} className={`${baseClasses} bg-yellow-500 text-yellow-50 cursor-pointer`}>For Print</Badge>;
            case 'printed': return <Badge variant="secondary" className={`${baseClasses} cursor-not-allowed`}>Printed</Badge>;
            case 'invoiced': return <Badge variant="outline" className={`${baseClasses} cursor-not-allowed`}>Invoiced</Badge>;
            case 'paid': return <Badge className={`${baseClasses} bg-green-500 text-green-50 cursor-not-allowed`}>Paid</Badge>; 
            default: return <Badge variant="secondary" className={baseClasses}>{record.status}</Badge>;
        }
    };

    const handlePrintReport = () => {
        const selectedInvoice = invoicesForFilter.find(inv => inv.id === idFilters.invoice);
        const reportTitle = selectedInvoice ? `ID Card Report - Invoice ${selectedInvoice.invoice_number}` : 'ID Card Report';
        
        let clientName = 'All Clients';
        if (idFilters.client !== 'all') {
            const selectedClientRecord = idPrintRecords.find(c => c.client_id === idFilters.client);
            if (selectedClientRecord) {
                clientName = selectedClientRecord.client_name;
            }
        } else if (selectedInvoice) {
            clientName = selectedInvoice.client_name;
        }


        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${reportTitle}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20mm; }
                    .letterhead { margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
                    .letterhead img { width: 100%; height: auto; max-width: 100%; }
                    .report-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 25px; }
                    .report-title { font-size: 24px; font-weight: bold; color: #1f2937; }
                    .report-info { text-align: right; font-size: 14px; color: #6b7280; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
                    th { background-color: #f9fafb; font-weight: 600; }
                    .footer { text-align: center; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="letterhead">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7574d74e3_letterhead.png" alt="MCTS Letterhead" />
                </div>
                
                <div class="report-header">
                    <div>
                        <h1 class="report-title">ID Card Report</h1>
                        ${selectedInvoice ? `<p>Invoice: ${selectedInvoice.invoice_number}</p>` : ''}
                    </div>
                    <div class="report-info">
                        <p>Date: ${format(new Date(), 'MMM d, yyyy')}</p>
                        <p>Client: ${clientName}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Employee Name</th>
                            <th>ID Number</th>
                            <th>Position</th>
                            <th>Print Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredIdRecords.map(record => `
                            <tr>
                                <td>${record.employee_name}</td>
                                <td>${record.id_number || '-'}</td>
                                <td>${record.position || '-'}</td>
                                <td>${record.print_date ? format(new Date(record.print_date), 'MMM d, yyyy') : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top: 20px;">
                    <strong>Total ID Cards: ${filteredIdRecords.length}</strong>
                </div>

                <div class="footer">
                    <p>Thank you for your business!</p>
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const handleEditInvoice = useCallback((invoice) => {
        setEditingInvoice(invoice);
        setShowEditInvoiceModal(true);
    }, []);

    const handleInvoiceStatusFilterChange = (status, checked) => {
        setInvoiceFilter(prev => {
            if (checked) {
                return [...prev, status];
            } else {
                return prev.filter(s => s !== status);
            }
        });
    };

    const filteredInvoices = useMemo(() => {
        if (invoiceFilter.length === 0) {
            return invoices; 
        }
        return invoices.filter(invoice => invoiceFilter.includes(invoice.status));
    }, [invoices, invoiceFilter]);

    const invoiceStatuses = ['unpaid', 'billed', 'paid', 'overdue', 'void', 'consolidated'];

    return (
        <div className="p-6 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Forms & Requests</h1>
                    <p className="text-muted-foreground mt-1">Manage invoices, receipts, quotations, purchase orders, and client orders</p>
                </div>
            
                <Tabs defaultValue="invoices" className="w-full">
                    <TabsList className="flex flex-wrap h-auto bg-secondary/70 p-1 rounded-md">
                        <TabsTrigger 
                            value="invoices" 
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Invoices & Receipts
                        </TabsTrigger>
                        <TabsTrigger 
                            value="quotations"
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <FileQuestion className="w-4 h-4 mr-2" />
                            Quotations
                        </TabsTrigger>
                        <TabsTrigger 
                            value="purchase-orders"
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Purchase Orders
                        </TabsTrigger>
                        <TabsTrigger 
                            value="reimbursements"
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Reimbursements
                        </TabsTrigger>
                        <TabsTrigger 
                            value="id-printing"
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            ID Printing
                        </TabsTrigger>
                        <TabsTrigger 
                            value="client-orders"
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Client Orders
                        </TabsTrigger>
                        <TabsTrigger 
                            value="dynamic-forms"
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Dynamic Forms
                        </TabsTrigger>
                        <TabsTrigger 
                            value="delivery-forms"
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Delivery Forms
                        </TabsTrigger>
                        <TabsTrigger 
                            value="keychain-orders"
                            className="flex-1 data-[state=active]:bg-background"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Keychain Orders
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="invoices" className="mt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h3 className="text-lg font-medium text-foreground">Invoices</h3>
                            <div className="flex items-center gap-3">
                                <Dialog open={showNewInvoiceForm} onOpenChange={setShowNewInvoiceForm}>
                                    <DialogTrigger asChild>
                                        <Button><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
                                    </DialogTrigger>
                                    <DialogContent className="dialog-content max-w-4xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-card-foreground">Create New Invoice</DialogTitle>
                                        </DialogHeader>
                                        <UnifiedInvoiceForm onSubmitted={() => { setShowNewInvoiceForm(false); loadAllData(); }} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                        <Card className="bg-card border-border mt-4">
                            <CardHeader>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                    <Label className="font-semibold text-foreground">Filter by Status:</Label>
                                    {invoiceStatuses.map(status => (
                                        <div key={status} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`status-${status}`}
                                                checked={invoiceFilter.includes(status)}
                                                onCheckedChange={(checked) => handleInvoiceStatusFilterChange(status, checked)}
                                            />
                                            <Label htmlFor={`status-${status}`} className="text-sm font-medium capitalize cursor-pointer text-foreground">
                                                {status}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 sm:p-4">
                                <InvoicesList 
                                    invoices={filteredInvoices} 
                                    isLoading={isLoading} 
                                    loadInvoices={loadAllData} 
                                    clients={clients}
                                    onEditInvoice={handleEditInvoice}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="quotations" className="mt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
                           <div>
                               <h3 className="font-semibold text-foreground">Internal Quotation</h3>
                               <p className="text-sm text-muted-foreground">Create a new quotation for an existing client.</p>
                               <Dialog open={showNewQuoteForm} onOpenChange={setShowNewQuoteForm}>
                                    <DialogTrigger asChild>
                                        <Button className="mt-2"><Plus className="w-4 h-4 mr-2" />Create Quotation</Button>
                                    </DialogTrigger>
                                    <DialogContent className="dialog-content max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-card-foreground">New Quotation</DialogTitle>
                                        </DialogHeader>
                                        <QuotationForm 
                                            onSubmitted={() => { setShowNewQuoteForm(false); loadAllData(); }}
                                            clients={clients}
                                            pricelistItems={pricelist}
                                        />
                                    </DialogContent>
                                </Dialog>
                           </div>
                            
                            <div className="text-left md:text-right w-full md:w-auto">
                                <h3 className="font-semibold text-foreground">External Client Quote Link</h3>
                                <p className="text-sm text-muted-foreground">Share this link with new clients to request a quote.</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Input 
                                        readOnly 
                                        value={`${window.location.origin}${createPageUrl('ClientQuote')}`}
                                        className="bg-background"
                                    />
                                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${createPageUrl('ClientQuote')}`)}>
                                        Copy Link
                                    </Button>
                                </div>
                            </div>
                        </div>
                        
                        <QuotationsList quotations={quotations} isLoading={isLoading} loadQuotations={loadAllData}/>
                    </TabsContent>

                    <TabsContent value="purchase-orders" className="mt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h3 className="text-lg font-medium text-foreground">Purchase Orders</h3>
                            <Dialog open={showNewPOForm} onOpenChange={handlePOFormClose}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="w-4 h-4 mr-2" /> New Purchase Order</Button>
                                </DialogTrigger>
                                <DialogContent className="dialog-content max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-card-foreground">{editingPO ? 'Edit' : 'Create'} Purchase Order</DialogTitle>
                                    </DialogHeader>
                                    <PurchaseOrderForm 
                                        suppliers={suppliers}
                                        editingPO={editingPO}
                                        onSubmitted={() => { 
                                            handlePOFormClose(); 
                                            loadAllData(); 
                                        }} 
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Card className="bg-card border-border mt-4">
                            <CardContent className="p-0 sm:p-4">
                                <PurchaseOrdersList 
                                    purchaseOrders={purchaseOrders} 
                                    isLoading={isLoading} 
                                    loadPurchaseOrders={loadAllData}
                                    onEditPO={handleEditPO}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reimbursements" className="mt-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-foreground">Reimbursement Requests</h3>
                            <Dialog open={showNewReimbursementForm} onOpenChange={setShowNewReimbursementForm}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="w-4 h-4 mr-2" /> New Request</Button>
                                </DialogTrigger>
                                <DialogContent className="dialog-content max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>New Reimbursement Form</DialogTitle>
                                    </DialogHeader>
                                    <ReimbursementForm 
                                        clients={clients} 
                                        onSubmitted={() => { setShowNewReimbursementForm(false); loadAllData(); }} 
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Card className="bg-card border-border mt-4">
                            <CardContent className="p-0 sm:p-4">
                                <ReimbursementsList 
                                    requests={reimbursementRequests} 
                                    isLoading={isLoading} 
                                    loadRequests={loadAllData} 
                                    clients={clients} 
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="id-printing" className="mt-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <CardTitle className="text-foreground">ID Print Records</CardTitle>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ml-auto">
                                        <Dialog open={showBatchIDUpload} onOpenChange={setShowBatchIDUpload}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline">
                                                    <Upload className="w-4 h-4 mr-2"/>
                                                    AI Batch Upload
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="dialog-content max-w-5xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle className="text-card-foreground">AI-Powered ID Batch Upload</DialogTitle>
                                                </DialogHeader>
                                                <IDBatchUpload 
                                                    clients={clients}
                                                    onSubmitted={() => { 
                                                        setShowBatchIDUpload(false); 
                                                        loadAllData(); 
                                                    }} 
                                                />
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog open={showNewIDForm} onOpenChange={handleIdFormClose}>
                                            <DialogTrigger asChild>
                                                <Button><Plus className="w-4 h-4 mr-2"/>Manual Entry</Button>
                                            </DialogTrigger>
                                            <DialogContent className="dialog-content max-w-4xl">
                                                <DialogHeader>
                                                    <DialogTitle className="text-card-foreground">{editingIdRecord ? 'Edit' : 'New'} ID Print Record</DialogTitle>
                                                </DialogHeader>
                                                <IDPrintForm editingRecord={editingIdRecord} onSubmitted={() => { handleIdFormClose(); loadAllData(); }} />
                                            </DialogContent>
                                        </Dialog>
                                        <Button onClick={handlePrintReport} variant="outline" disabled={filteredIdRecords.length === 0}>
                                            <Printer className="w-4 h-4 mr-2" />
                                            Print Report
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-6 items-center gap-2 pt-4">
                                    <div className="relative flex-1 sm:col-span-2 lg:col-span-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search records..."
                                            value={idFilters.searchTerm}
                                            onChange={(e) => setIdFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                            className="pl-8 text-foreground"
                                        />
                                    </div>
                                    <Select value={idFilters.client} onValueChange={(value) => setIdFilters(prev => ({...prev, client: value}))}>
                                        <SelectTrigger className="w-full text-foreground">
                                            <SelectValue placeholder="All Clients" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Clients</SelectItem>
                                            {[...new Map(idPrintRecords.map(item => [item['client_id'], item])).values()].map(record => (
                                                <SelectItem key={record.client_id} value={record.client_id}>{record.client_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={idFilters.invoice} onValueChange={(value) => setIdFilters(prev => ({...prev, invoice: value}))}>
                                        <SelectTrigger className="w-full text-foreground">
                                            <SelectValue placeholder="All Invoices" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Invoices</SelectItem>
                                            {invoicesForFilter.map(invoice => (
                                                <SelectItem key={invoice.id} value={invoice.id}>
                                                    {invoice.invoice_number} - {invoice.client_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={idFilters.status} onValueChange={(value) => setIdFilters(prev => ({...prev, status: value}))}>
                                        <SelectTrigger className="w-full text-foreground">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="for_print">For Print</SelectItem>
                                            <SelectItem value="printed">Printed</SelectItem>
                                            <SelectItem value="invoiced">Invoiced</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="space-y-2">
                                        <Input
                                            type="date"
                                            placeholder="From Date"
                                            value={idFilters.dateFrom}
                                            onChange={(e) => setIdFilters(prev => ({...prev, dateFrom: e.target.value}))}
                                            className="text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            type="date"
                                            placeholder="To Date"
                                            value={idFilters.dateTo}
                                            onChange={(e) => setIdFilters(prev => ({...prev, dateTo: e.target.value}))}
                                            className="text-foreground"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-foreground">Employee Name</TableHead>
                                                <TableHead className="text-foreground">ID Number</TableHead>
                                                <TableHead className="text-foreground">Position</TableHead>
                                                <TableHead className="text-foreground">Company</TableHead>
                                                <TableHead className="text-foreground">Print Date</TableHead>
                                                <TableHead className="text-foreground">Status</TableHead>
                                                <TableHead className="text-right text-foreground">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow><TableCell colSpan={7} className="text-center p-4 text-muted-foreground">Loading...</TableCell></TableRow>
                                            ) : filteredIdRecords.length > 0 ? (
                                                filteredIdRecords.map(record => (
                                                    <TableRow key={record.id}>
                                                        <TableCell className="text-foreground whitespace-nowrap">{record.employee_name}</TableCell>
                                                        <TableCell className="text-muted-foreground whitespace-nowrap">{record.id_number || '-'}</TableCell>
                                                        <TableCell className="text-muted-foreground whitespace-nowrap">{record.position || '-'}</TableCell>
                                                        <TableCell className="text-muted-foreground whitespace-nowrap">{record.client_name}</TableCell>
                                                        <TableCell className="text-muted-foreground whitespace-nowrap">{record.print_date ? format(new Date(record.print_date), 'MMM d, yyyy') : '-'}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{getIdStatusBadge(record)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button variant="ghost" size="icon" onClick={() => handleEditIdRecord(record)}>
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteIdRecord(record.id)}>
                                                                    <Trash2 className="w-4 h-4 text-destructive"/>
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No records found.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="client-orders" className="mt-6">
                        <ClientOrdersTab 
                        orders={orders} 
                        isLoading={isLoading}
                        onRefresh={loadAllData}
                        />
                    </TabsContent>

                    <TabsContent value="dynamic-forms" className="mt-6">
                        <Tabs defaultValue="manage" className="w-full">
                            <TabsList>
                                <TabsTrigger value="manage">Manage Forms</TabsTrigger>
                                <TabsTrigger value="submissions">View Submissions</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="manage" className="mt-6">
                                <FormDefinitionManager />
                            </TabsContent>
                            
                            <TabsContent value="submissions" className="mt-6">
                                <FormSubmissionsViewer />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="delivery-forms" className="mt-6">
                        <DeliveryFormManager />
                    </TabsContent>

                    <TabsContent value="keychain-orders" className="mt-6">
                        <KeychainOrdersManager 
                            orders={keychainOrders}
                            isLoading={isLoading}
                            onRefresh={loadAllData}
                        />
                    </TabsContent>
                </Tabs>
            </div>
             {/* Edit Invoice Dialog (moved here from InvoicesList) */}
            <Dialog open={showEditInvoiceModal} onOpenChange={setShowEditInvoiceModal}>
                <DialogContent className="dialog-content max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-card-foreground">Edit Invoice</DialogTitle>
                    </DialogHeader>
                    <UnifiedInvoiceForm 
                        editingInvoice={editingInvoice}
                        onSubmitted={() => { setShowEditInvoiceModal(false); setEditingInvoice(null); loadAllData(); }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}