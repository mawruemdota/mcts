
import React, { useState, useEffect, useCallback } from 'react';
import { InventoryItem, Supplier, InventoryRequest, User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Package, Edit, Trash, Search, ShoppingCart, Check, X, CheckSquare, Wrench, Trash2, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from "date-fns";
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';

const ItemForm = ({ item, suppliers, onSubmitted }) => {
  const [formData, setFormData] = useState(
    item || {
      item_name: '',
      identifier: '',
      category: 'consumables',
      dimension: '',
      unit: 'pieces',
      current_quantity: 0,
      minimum_threshold: 10,
      critical_threshold: 0,
      unit_cost: 0,
      supplier: '',
      location: '',
    }
  );
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name || '',
        identifier: item.identifier || '',
        category: item.category || 'consumables',
        dimension: item.dimension || '',
        unit: item.unit || 'pieces',
        current_quantity: item.current_quantity || 0,
        minimum_threshold: item.minimum_threshold || 10,
        critical_threshold: item.critical_threshold || 0,
        unit_cost: item.unit_cost || 0,
        supplier: item.supplier || '',
        location: item.location || '',
      });
    } else {
      setFormData({
        item_name: '',
        identifier: '',
        category: 'consumables',
        dimension: '',
        unit: 'pieces',
        current_quantity: 0,
        minimum_threshold: 10,
        critical_threshold: 0,
        unit_cost: 0,
        supplier: '',
        location: '',
      });
    }
  }, [item]); // Dependency on 'item' is correct for re-initialization

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      current_quantity: Number(formData.current_quantity),
      minimum_threshold: Number(formData.minimum_threshold),
      critical_threshold: Number(formData.critical_threshold),
      unit_cost: Number(formData.unit_cost),
    };

    try {
      if (item?.id) {
        await InventoryItem.update(item.id, dataToSubmit);
        toast({ title: 'Success', description: 'Item updated successfully.' });
      } else {
        await InventoryItem.create(dataToSubmit);
        toast({ title: 'Success', description: 'Item added to inventory.' });
      }
      onSubmitted();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save item.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="item_name">Item Name *</Label>
          <Input id="item_name" value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="identifier">SKU/Identifier</Label>
          <Input id="identifier" value={formData.identifier} onChange={(e) => setFormData({ ...formData, identifier: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select id="category" value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paper">Paper</SelectItem>
              <SelectItem value="ink">Ink</SelectItem>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="consumables">Consumables</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimension">Dimension</Label>
          <Input id="dimension" value={formData.dimension} onChange={(e) => setFormData({ ...formData, dimension: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="current_quantity">Current Quantity *</Label>
          <Input id="current_quantity" type="number" value={formData.current_quantity} onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Select id="unit" value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pieces">Pieces</SelectItem>
              <SelectItem value="rolls">Rolls</SelectItem>
              <SelectItem value="sheets">Sheets</SelectItem>
              <SelectItem value="ml">ml</SelectItem>
              <SelectItem value="liters">Liters</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="packs">Packs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="minimum_threshold">Low Stock Threshold *</Label>
          <Input id="minimum_threshold" type="number" value={formData.minimum_threshold} onChange={(e) => setFormData({ ...formData, minimum_threshold: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="critical_threshold">Critical Stock Threshold</Label>
          <Input id="critical_threshold" type="number" value={formData.critical_threshold} onChange={(e) => setFormData({ ...formData, critical_threshold: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="unit_cost">Unit Cost</Label>
          <Input id="unit_cost" type="number" value={formData.unit_cost} onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })} placeholder="e.g., 12.50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Select id="supplier" value={formData.supplier} onValueChange={(v) => setFormData({ ...formData, supplier: v })}>
            <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map(s => <SelectItem key={s.id} value={s.supplier_name}>{s.supplier_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Storage Location</Label>
        <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Shelf A, Rack 2" />
      </div>
      <div className="flex justify-end">
        <Button type="submit">{item ? 'Update Item' : 'Add Item'}</Button>
      </div>
    </form>
  );
};

const RequestForm = ({ onSubmitted, user, inventoryItems, request, allUsers = [] }) => {
  const [isNewItem, setIsNewItem] = useState(request ? !request.existing_item_id : false);
  const [formData, setFormData] = useState(request || {
    item_name: '',
    existing_item_id: '',
    quantity: 1,
    unit: 'pieces',
    details: '',
    link: '',
    assignee: 'jonathan@mcts.com' // Default assignee
  });
  const { toast } = useToast();

  const handleSelectChange = (itemId) => {
    const selected = inventoryItems.find(i => i.id === itemId);
    if (selected) {
      setFormData({
        ...formData,
        existing_item_id: itemId,
        item_name: selected.item_name,
        unit: selected.unit
      });
    } else {
      setFormData({
        ...formData,
        existing_item_id: itemId,
        item_name: '',
        unit: 'pieces'
      });
    }
  };

  useEffect(() => {
    if (request) {
      setIsNewItem(!request.existing_item_id);
      setFormData({
        item_name: request.item_name || '',
        existing_item_id: request.existing_item_id || '',
        quantity: request.quantity || 1,
        unit: request.unit || 'pieces',
        details: request.details || '',
        link: request.link || '',
        assignee: request.assignee || 'jonathan@mcts.com' // Set assignee from request or default
      });
    } else {
      setFormData({
        item_name: '',
        existing_item_id: '',
        quantity: 1,
        unit: 'pieces',
        details: '',
        link: '',
        assignee: 'jonathan@mcts.com' // Reset to default for new requests
      });
    }
  }, [request]); // Dependency on 'request' is correct for re-initialization

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      quantity: Number(formData.quantity),
      requested_by: request ? request.requested_by : user.email,
      assignee: formData.assignee || 'jonathan@mcts.com' // Ensure default
    };
    try {
      if (request?.id) {
        await InventoryRequest.update(request.id, dataToSubmit);
        toast({ title: 'Request Updated' });
      } else {
        await InventoryRequest.create(dataToSubmit);
        toast({ title: 'Request Submitted' });
      }
      onSubmitted();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to submit request' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="new-item-check" checked={isNewItem} onChange={e => setIsNewItem(e.target.checked)} />
        <Label htmlFor="new-item-check">Requesting a new, unlisted item?</Label>
      </div>

      {isNewItem ? (
        <div>
          <Label>Item Name</Label>
          <Input value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} required />
        </div>
      ) : (
        <div>
          <Label>Select Existing Item</Label>
          <Select value={formData.existing_item_id} onValueChange={handleSelectChange}>
            <SelectTrigger><SelectValue placeholder="-- Select from inventory --" /></SelectTrigger>
            <SelectContent>
              {inventoryItems.map(i => <SelectItem key={i.id} value={i.id}>{i.item_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} /></div>
        {isNewItem && <div><Label>Unit (e.g. pcs, rolls)</Label><Input value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} /></div>}
      </div>
      
      <div>
        <Label>Assignee</Label>
        <Select value={formData.assignee} onValueChange={v => setFormData({ ...formData, assignee: v })}>
          <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
          <SelectContent>
            {allUsers.map(u => (
              <SelectItem key={u.email} value={u.email}>
                {u.nickname || u.full_name} ({u.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Details / Specifications</Label><Input value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} /></div>
      <div><Label>Shopping Link (Optional)</Label><Input type="url" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} /></div>
      <Button type="submit">{request ? 'Update' : 'Submit'} Request</Button>
    </form>
  );
};

const InventoryList = ({ inventory, onEdit, onDelete, onUpdateQuantity, getStatus }) => {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground">Item</TableHead>
                <TableHead className="text-foreground">Category</TableHead>
                <TableHead className="text-foreground">Dimension</TableHead>
                <TableHead className="text-foreground">Unit</TableHead>
                <TableHead className="text-foreground">Quantity</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-right text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map(item => {
                const status = getStatus(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-foreground whitespace-nowrap">{item.item_name}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{item.identifier}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap capitalize">{item.category}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.dimension}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.unit}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.current_quantity}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={`${status.color} border`}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(item.id)}><Trash className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const EquipmentForm = ({ onSubmitted, item }) => {
  const [formData, setFormData] = useState(
    item || {
      item_name: '', // Changed from equipment_name to item_name
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_expiry: '',
      status: 'operational',
      location: '',
      notes: '',
      picture_url: ''
    }
  );
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name || '', // Changed from equipment_name to item_name
        model: item.model || '',
        serial_number: item.serial_number || '',
        purchase_date: item.purchase_date ? format(new Date(item.purchase_date), 'yyyy-MM-dd') : '',
        warranty_expiry: item.warranty_expiry ? format(new Date(item.warranty_expiry), 'yyyy-MM-dd') : '',
        status: item.status || 'operational',
        location: item.location || '',
        notes: item.notes || '',
        picture_url: item.picture_url || ''
      });
    } else {
      setFormData({
        item_name: '', // Changed from equipment_name to item_name
        model: '',
        serial_number: '',
        purchase_date: '',
        warranty_expiry: '',
        status: 'operational',
        location: '',
        notes: '',
        picture_url: ''
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      category: 'equipment',
      // Fields not relevant for equipment are set to defaults
      current_quantity: 1, 
      minimum_threshold: 0,
      critical_threshold: 0,
      unit: 'pieces'
    };
    try {
      if (item?.id) {
        await InventoryItem.update(item.id, dataToSubmit);
        toast({ title: 'Success', description: 'Equipment updated successfully.' });
      } else {
        await InventoryItem.create(dataToSubmit);
        toast({ title: 'Success', description: 'Equipment added successfully.' });
      }
      onSubmitted();
    } catch (error) {
      console.error("Failed to save equipment:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save equipment.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="equipment_name">Equipment Name *</Label>
          <Input 
            id="equipment_name" 
            value={formData.item_name} 
            onChange={e => setFormData({ ...formData, item_name: e.target.value })} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="serial_number">Serial Number</Label>
          <Input id="serial_number" value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="maintenance">Under Maintenance</SelectItem>
              <SelectItem value="broken">Broken</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Purchase Date</Label>
          <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={e => setFormData({ ...formData, purchase_date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
          <Input id="warranty_expiry" type="date" value={formData.warranty_expiry} onChange={e => setFormData({ ...formData, warranty_expiry: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="picture_url">Picture URL</Label>
            <Input id="picture_url" value={formData.picture_url} onChange={e => setFormData({ ...formData, picture_url: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
      </div>
      <div className="flex justify-end">
        <Button type="submit">{item ? 'Update' : 'Add'} Equipment</Button>
      </div>
    </form>
  );
};

const EquipmentList = ({ equipment, onEdit, onDelete }) => {
  const [showQrCode, setShowQrCode] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      operational: 'bg-green-100 text-green-800 border-green-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      broken: 'bg-red-100 text-red-800 border-red-200',
      retired: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const generateQrCodeUrl = (itemId) => {
      const itemUrl = window.location.origin + createPageUrl(`Inventory?tab=equipment&itemId=${itemId}`);
      return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(itemUrl)}`;
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground">Equipment</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Location</TableHead>
                <TableHead className="text-foreground">Model/Serial</TableHead>
                <TableHead className="text-right text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        {item.picture_url && <img src={item.picture_url} alt={item.item_name} className="w-10 h-10 object-cover rounded-md" />}
                        <div className="font-medium text-foreground whitespace-nowrap">
                            {item.item_name}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{item.location}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    <div>{item.model}</div>
                    <div>{item.serial_number}</div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                       <Dialog open={showQrCode === item.id} onOpenChange={(isOpen) => !isOpen && setShowQrCode(null)}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setShowQrCode(item.id)}>
                                    <QrCode className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>QR Code for {item.item_name}</DialogTitle></DialogHeader>
                                <div className="flex flex-col items-center justify-center p-4">
                                    <img src={generateQrCodeUrl(item.id)} alt="QR Code"/>
                                    <p className="text-sm text-muted-foreground mt-2">Scan to view item details</p>
                                </div>
                            </DialogContent>
                       </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
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
  );
};

const RequestsList = ({ requests, onEdit, onUpdateStatus, user, onBulkAction, selectedRequests, onSelectRequest, onSelectAll }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-blue-100 text-blue-800';
            case 'purchased': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        {requests.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedRequests.length === requests.length && requests.length > 0}
                onCheckedChange={onSelectAll}
                disabled={requests.length === 0}
              />
              <span className="text-sm text-muted-foreground">
                {selectedRequests.length > 0 ? `${selectedRequests.length} selected` : 'Select all'}
              </span>
            </div>
            {selectedRequests.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onBulkAction('purchased')}>
                  Mark as Purchased
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onBulkAction('delete')}>
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRequests.includes(req.id)}
                      onCheckedChange={() => onSelectRequest(req.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{req.item_name}
                    {req.link && <a href={req.link} target="_blank" rel="noopener noreferrer">🔗</a>}
                  </TableCell>
                  <TableCell>{req.requested_by.split('@')[0]}</TableCell>
                  <TableCell>{format(new Date(req.created_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{req.quantity} {req.unit}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                  </TableCell>
                  <TableCell>{req.assignee?.split('@')[0] || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {user?.email === req.assignee && req.status === 'approved' && (
                      <Button variant="ghost" size="icon" onClick={() => onUpdateStatus(req.id, 'purchased')}><CheckSquare className="w-4 h-4 text-green-500" /></Button>
                    )}
                    {(user?.role === 'admin' && req.status === 'pending') && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => onUpdateStatus(req.id, 'approved')}><Check className="w-4 h-4 text-green-500" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onUpdateStatus(req.id, 'rejected')}><X className="w-4 h-4 text-red-500" /></Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onEdit(req)}><Edit className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};


export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequests, setSelectedRequests] = useState([]);
  const { toast } = useToast();

  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'stock';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemsData, suppliersData, requestsData, userData, allUsersData] = await Promise.all([
        InventoryItem.list("-created_date"),
        Supplier.list(),
        InventoryRequest.list("-created_date"),
        User.me(),
        User.list()
      ]);
      setItems(itemsData);
      setSuppliers(suppliersData);
      setRequests(requestsData);
      setUser(userData);
      setAllUsers(allUsersData);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditItem = (item) => {
    setEditingItem(item);
    if(item.category === 'equipment') {
        setShowEquipmentForm(true);
        setShowItemForm(false);
    } else {
        setShowItemForm(true);
        setShowEquipmentForm(false);
    }
  };

  const handleEditRequest = (req) => {
    setEditingRequest(req);
    setShowRequestForm(true);
  };

  const handleUpdateReqStatus = async (id, status) => {
    try {
      await InventoryRequest.update(id, { status });
      toast({ title: `Request status updated to ${status}` });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update request status.' });
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        try {
            await InventoryItem.delete(id);
            toast({ title: "Item deleted" });
            loadData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting item' });
        }
    }
  };

  const equipmentItems = items.filter(item => item.category === 'equipment');
  
  const filteredItems = items.filter(item =>
    item.category !== 'equipment' && (
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  const filteredEquipment = equipmentItems.filter(item => 
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.serial_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredRequests = requests.filter(req =>
    req.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requested_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.assignee || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelectRequest = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAllRequests = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(r => r.id));
    }
  };
  
  const handleBulkAction = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} ${selectedRequests.length} requests?`)) return;

    try {
      if (action === 'delete') {
        await Promise.all(selectedRequests.map(id => InventoryRequest.delete(id)));
        toast({ title: 'Success', description: `${selectedRequests.length} requests deleted.` });
      } else if (action === 'purchased') {
        await Promise.all(selectedRequests.map(id => InventoryRequest.update(id, { status: 'purchased' })));
        toast({ title: 'Success', description: `${selectedRequests.length} requests marked as purchased.` });
      }
      setSelectedRequests([]);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to ${action} requests.` });
    }
  };


  if (isLoading) {
    return (
      <div className="p-4 md:p-8 bg-background min-h-screen flex items-center justify-center text-foreground">
        <p>Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Track stock levels and manage purchase requests.</p>
          </div>
          <div className="flex gap-2">
             <Dialog open={showRequestForm} onOpenChange={(open) => {
                setShowRequestForm(open);
                if (!open) setEditingRequest(null);
            }}>
              <DialogTrigger asChild>
                <Button variant="outline"><ShoppingCart className="w-4 h-4 mr-2"/>New Request</Button>
              </DialogTrigger>
              <DialogContent className="dialog-content">
                <DialogHeader><DialogTitle>{editingRequest ? 'Edit' : 'New'} Purchase Request</DialogTitle></DialogHeader>
                <RequestForm 
                    onSubmitted={() => { setShowRequestForm(false); loadData(); }} 
                    user={user}
                    inventoryItems={items.filter(i => i.category !== 'equipment')}
                    request={editingRequest}
                    allUsers={allUsers}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={showItemForm} onOpenChange={(open) => {
                setShowItemForm(open);
                if (!open) setEditingItem(null);
            }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2"/>Add Stock Item</Button>
              </DialogTrigger>
              <DialogContent className="dialog-content">
                <DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'Add New'} Item</DialogTitle></DialogHeader>
                <ItemForm item={editingItem} suppliers={suppliers} onSubmitted={() => { setShowItemForm(false); loadData(); }}/>
              </DialogContent>
            </Dialog>
            <Dialog open={showEquipmentForm} onOpenChange={(open) => {
                setShowEquipmentForm(open);
                if (!open) setEditingItem(null);
            }}>
              <DialogTrigger asChild>
                  <Button variant="outline"><Plus className="w-4 h-4 mr-2"/>Add Equipment</Button>
              </DialogTrigger>
              <DialogContent className="dialog-content">
                  <DialogHeader><DialogTitle>{editingItem ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle></DialogHeader>
                  <EquipmentForm item={editingItem} onSubmitted={() => { setShowEquipmentForm(false); loadData(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="mb-4">
          <Input 
            placeholder="Search..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
            <TabsList>
                <TabsTrigger value="stock"><Package className="w-4 h-4 mr-2"/>Stock Levels</TabsTrigger>
                <TabsTrigger value="requests"><ShoppingCart className="w-4 h-4 mr-2"/>Purchase Requests</TabsTrigger>
                <TabsTrigger value="equipment"><Wrench className="w-4 h-4 mr-2"/>Equipment</TabsTrigger>
            </TabsList>
            <TabsContent value="stock" className="mt-4">
                <InventoryList
                    inventory={filteredItems}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    getStatus={(item) => {
                        if (item.current_quantity <= item.critical_threshold) return { label: 'Critical', color: 'bg-red-200 text-red-800' };
                        if (item.current_quantity <= item.minimum_threshold) return { label: 'Low Stock', color: 'bg-yellow-200 text-yellow-800' };
                        return { label: 'In Stock', color: 'bg-green-200 text-green-800' };
                    }}
                />
            </TabsContent>
            <TabsContent value="requests" className="mt-4">
                <RequestsList 
                  requests={filteredRequests} 
                  onEdit={handleEditRequest} 
                  onUpdateStatus={handleUpdateReqStatus} 
                  user={user}
                  selectedRequests={selectedRequests}
                  onSelectRequest={handleSelectRequest}
                  onSelectAll={handleSelectAllRequests}
                  onBulkAction={handleBulkAction}
                />
            </TabsContent>
            <TabsContent value="equipment" className="mt-4">
                <EquipmentList 
                    equipment={filteredEquipment}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                />
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
