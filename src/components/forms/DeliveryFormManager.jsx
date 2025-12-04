import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Printer, Edit, X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function DeliveryFormManager() {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deliveriesData, productsData, clientsData] = await Promise.all([
        base44.entities.DeliveryForm.list('-created_date'),
        base44.entities.PriceListItem.list(),
        base44.entities.Client.list()
      ]);
      setDeliveries(deliveriesData);
      setProducts(productsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Failed to load data' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateDeliveryNumber = () => {
    const date = new Date();
    const prefix = 'DLV';
    const timestamp = date.getTime().toString().slice(-6);
    return `${prefix}-${format(date, 'yyyyMMdd')}-${timestamp}`;
  };

  const resetForm = () => {
    setFormData({
      delivery_number: generateDeliveryNumber(),
      delivery_date: format(new Date(), 'yyyy-MM-dd'),
      client_id: '',
      client_name: '',
      items: [],
      prepared_by: '',
      notes: '',
      status: 'pending'
    });
    setNewItem({ item_name: '', quantity: 1, price: '', is_from_pricelist: false });
    setItemInputType('manual');
    setEditingDelivery(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setFormData(prev => ({ ...prev, delivery_number: generateDeliveryNumber() }));
    setShowDialog(true);
  };

  const handleEdit = (delivery) => {
    setEditingDelivery(delivery);
    setFormData({
      delivery_number: delivery.delivery_number,
      delivery_date: delivery.delivery_date || format(new Date(), 'yyyy-MM-dd'),
      client_id: delivery.client_id || '',
      client_name: delivery.client_name || '',
      items: delivery.items || [],
      prepared_by: delivery.prepared_by || '',
      notes: delivery.notes || '',
      status: delivery.status || 'pending'
    });
    setShowDialog(true);
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

    try {
      if (editingDelivery) {
        await base44.entities.DeliveryForm.update(editingDelivery.id, formData);
        toast({ title: 'Delivery form updated' });
      } else {
        await base44.entities.DeliveryForm.create(formData);
        toast({ title: 'Delivery form created' });
      }

      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Failed to save delivery form' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this delivery form?')) return;

    try {
      await base44.entities.DeliveryForm.delete(id);
      toast({ title: 'Delivery form deleted' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Delivery Forms</h2>
          <p className="text-sm text-muted-foreground">Manage delivery receipts</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          New Delivery Form
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No delivery forms yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Prepared By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                  <TableCell>{delivery.delivery_date ? format(new Date(delivery.delivery_date), 'MMM d, yyyy') : '-'}</TableCell>
                  <TableCell>{delivery.client_name}</TableCell>
                  <TableCell>{delivery.items?.length || 0} item(s)</TableCell>
                  <TableCell>{delivery.prepared_by}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`${createPageUrl('DeliveryFormPrint')}?id=${delivery.id}`} target="_blank">
                        <Button size="sm" variant="outline">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(delivery)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(delivery.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDelivery ? 'Edit' : 'New'} Delivery Form</DialogTitle>
          </DialogHeader>

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

            {editingDelivery && (
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDelivery ? 'Update' : 'Create'} Delivery Form
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}