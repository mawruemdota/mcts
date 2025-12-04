import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Plus, X, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function CreateDeliveryForm() {
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    delivery_number: '',
    delivery_date: format(new Date(), 'yyyy-MM-dd'),
    client_id: '',
    client_name: '',
    items: [],
    prepared_by: '',
    notes: '',
    status: 'pending'
  });

  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 1,
    price: '',
    is_from_pricelist: false
  });

  const [itemInputType, setItemInputType] = useState('manual');

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = urlParams.get('jobId');

        const [productsData, clientsData, currentUser] = await Promise.all([
          base44.entities.PriceListItem.list(),
          base44.entities.Client.list(),
          base44.auth.me()
        ]);
        setProducts(productsData);
        setClients(clientsData);

        const newDeliveryNumber = generateDeliveryNumber();
        setFormData(prev => ({ 
          ...prev, 
          delivery_number: newDeliveryNumber,
          prepared_by: currentUser?.full_name || ''
        }));

        if (jobId) {
          const jobData = await base44.entities.Job.filter({ id: jobId });
          if (jobData.length > 0) {
            const job = jobData[0];
            setFormData(prev => ({
              ...prev,
              client_id: job.client_id || '',
              client_name: job.client_name || '',
              notes: job.title ? `Task: ${job.title}` : '',
              items: job.items?.map(item => ({
                item_name: item.item_name,
                quantity: item.quantity,
                price: item.price,
                is_from_pricelist: true
              })) || (job.title ? [{
                item_name: job.title,
                quantity: job.quantity || 1,
                price: job.actual_price || job.estimated_price || '',
                is_from_pricelist: false
              }] : [])
            }));
          }
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({ variant: 'destructive', title: 'Failed to load data' });
      }
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  const generateDeliveryNumber = () => {
    const date = new Date();
    const prefix = 'DLV';
    const timestamp = date.getTime().toString().slice(-6);
    return `${prefix}-${format(date, 'yyyyMMdd')}-${timestamp}`;
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        client_id: clientId,
        client_name: client.client_name
      });
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewItem({
        ...newItem,
        item_name: product.item_name,
        price: product.price_conservative || '',
        is_from_pricelist: true
      });
    }
  };

  const addItem = () => {
    if (!newItem.item_name || !newItem.quantity) {
      toast({ variant: 'destructive', title: 'Item name and quantity are required' });
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, price: newItem.price || null }]
    });
    setNewItem({ item_name: '', quantity: 1, price: '', is_from_pricelist: false });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_name || formData.items.length === 0 || !formData.prepared_by) {
      toast({ variant: 'destructive', title: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newDelivery = await base44.entities.DeliveryForm.create(formData);
      toast({ title: 'Delivery form created' });
      window.open(createPageUrl('DeliveryFormPrint') + `?id=${newDelivery.id}`, '_blank');
      window.location.href = createPageUrl('Forms');
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Failed to create delivery form' });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Delivery Form</CardTitle>
          <p className="text-sm text-muted-foreground">Fill out the details for the delivery receipt.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Delivery Number</Label>
                <Input value={formData.delivery_number} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  required
                />
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

            <div>
              <Label>Prepared By *</Label>
              <Input
                value={formData.prepared_by}
                onChange={(e) => setFormData({ ...formData, prepared_by: e.target.value })}
                placeholder="Name of person preparing delivery"
                required
              />
            </div>

            {/* Items Section */}
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Items</Label>
              
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={itemInputType === 'manual' ? 'default' : 'outline'}
                    onClick={() => setItemInputType('manual')}
                  >
                    Manual Input
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={itemInputType === 'product' ? 'default' : 'outline'}
                    onClick={() => setItemInputType('product')}
                  >
                    From Products
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  {itemInputType === 'product' ? (
                    <div className="col-span-5">
                      <Select onValueChange={handleProductSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
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
                  ) : (
                    <div className="col-span-5">
                      <Input
                        placeholder="Item name"
                        value={newItem.item_name}
                        onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value, is_from_pricelist: false })}
                      />
                    </div>
                  )}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Price (optional)"
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
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {item.price ? `₱${parseFloat(item.price).toLocaleString()}` : '-'}
                        </TableCell>
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

            <div className="flex justify-end gap-2">
              <Link to={createPageUrl('Dashboard')}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Delivery Form'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}