import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';

export default function InvoiceModal({ isOpen, onClose, prefilledData = null }) {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    invoice_number: '',
    receipt_type: 'Collection Receipt',
    client_id: '',
    client_name: '',
    client_email: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [],
    discount: 0,
    notes: '',
    prepared_by: '',
    status: 'unpaid',
    job_ids: []
  });

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    price: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        client_id: prefilledData.client_id || '',
        client_name: prefilledData.client_name || '',
        client_email: prefilledData.client_email || '',
        items: prefilledData.items || [],
        notes: prefilledData.notes || '',
        job_ids: prefilledData.job_ids || []
      }));
    }
  }, [prefilledData]);

  const loadInitialData = async () => {
    try {
      const [clientsData, productsData, currentUser] = await Promise.all([
        base44.entities.Client.list(),
        base44.entities.PriceListItem.list(),
        base44.auth.me()
      ]);

      setClients(clientsData);
      setProducts(productsData);

      const invoiceNumber = generateInvoiceNumber();
      setFormData(prev => ({
        ...prev,
        invoice_number: invoiceNumber,
        prepared_by: currentUser?.full_name || ''
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const prefix = 'INV';
    const timestamp = date.getTime().toString().slice(-6);
    return `${prefix}-${format(date, 'yyyyMMdd')}-${timestamp}`;
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        client_id: clientId,
        client_name: client.client_name,
        client_email: client.email || ''
      });
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewItem({
        description: product.item_name,
        quantity: 1,
        price: product.price_conservative || ''
      });
    }
  };

  const addItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.price) {
      toast({ variant: 'destructive', title: 'Please fill all item fields' });
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem }]
    });
    setNewItem({ description: '', quantity: 1, price: '' });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - (formData.discount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_name || formData.items.length === 0) {
      toast({ variant: 'destructive', title: 'Please fill in all required fields' });
      return;
    }

    setIsLoading(true);
    try {
      const invoiceData = {
        ...formData,
        subtotal: calculateSubtotal(),
        amount: calculateTotal()
      };

      const newInvoice = await base44.entities.Invoice.create(invoiceData);
      toast({ title: 'Invoice created successfully' });
      window.open(createPageUrl('InvoicePrintView') + `?id=${newInvoice.id}`, '_blank');
      onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({ variant: 'destructive', title: 'Failed to create invoice' });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input value={formData.invoice_number} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Receipt Type</Label>
              <Select value={formData.receipt_type} onValueChange={(val) => setFormData({ ...formData, receipt_type: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Collection Receipt">Collection Receipt</SelectItem>
                  <SelectItem value="Official Receipt">Official Receipt</SelectItem>
                  <SelectItem value="Acknowledgement Receipt">Acknowledgement Receipt</SelectItem>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Select Client</Label>
              <Select value={formData.client_id} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose client" />
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
            <div>
              <Label>Client Name *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Or type manually"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Items</Label>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Select onValueChange={handleProductSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select from products" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.item_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-5">
                  <Input
                    placeholder="Or type description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2 mt-2">
                <div className="col-span-10">
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Button type="button" onClick={addItem} className="w-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {formData.items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">₱{parseFloat(item.price).toLocaleString()}</TableCell>
                      <TableCell className="text-right">₱{(parseFloat(item.price) * item.quantity).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₱{calculateSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <Input
                    type="number"
                    className="w-32"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₱{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}