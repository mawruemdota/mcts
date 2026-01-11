import React, { useState, useEffect } from 'react';
import { TaskTemplate, PriceListItem } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ClipboardList, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function TaskTemplates() {
  const [templates, setTemplates] = useState([]);
  const [pricelist, setPricelist] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    template_name: '',
    description: '',
    job_type: 'other',
    default_items: [],
    default_checklist: [],
    default_instructions: '',
    is_active: true
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newItem, setNewItem] = useState({ item_id: '', item_name: '', quantity: 1, price: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, pricelistData] = await Promise.all([
        TaskTemplate.list(),
        PriceListItem.list()
      ]);
      setTemplates(templatesData);
      setPricelist(pricelistData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({ variant: 'destructive', title: 'Failed to load templates' });
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        template_name: template.template_name,
        description: template.description || '',
        job_type: template.job_type || 'other',
        default_items: template.default_items || [],
        default_checklist: template.default_checklist || [],
        default_instructions: template.default_instructions || '',
        is_active: template.is_active !== false
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        template_name: '',
        description: '',
        job_type: 'other',
        default_items: [],
        default_checklist: [],
        default_instructions: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setNewChecklistItem('');
    setNewItem({ item_id: '', item_name: '', quantity: 1, price: 0 });
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData(prev => ({
        ...prev,
        default_checklist: [...prev.default_checklist, { task: newChecklistItem.trim(), completed: false }]
      }));
      setNewChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (index) => {
    setFormData(prev => ({
      ...prev,
      default_checklist: prev.default_checklist.filter((_, i) => i !== index)
    }));
  };

  const handleAddItem = () => {
    if (newItem.item_name.trim()) {
      setFormData(prev => ({
        ...prev,
        default_items: [...prev.default_items, { ...newItem }]
      }));
      setNewItem({ item_id: '', item_name: '', quantity: 1, price: 0 });
    }
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      default_items: prev.default_items.filter((_, i) => i !== index)
    }));
  };

  const handleItemSelect = (itemId) => {
    const selectedItem = pricelist.find(p => p.id === itemId);
    if (selectedItem) {
      setNewItem({
        item_id: selectedItem.id,
        item_name: selectedItem.item_name,
        quantity: 1,
        price: selectedItem.price_conservative || 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await TaskTemplate.update(editingTemplate.id, formData);
        toast({ title: 'Template updated successfully' });
      } else {
        await TaskTemplate.create(formData);
        toast({ title: 'Template created successfully' });
      }
      loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({ variant: 'destructive', title: 'Failed to save template' });
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await TaskTemplate.delete(templateId);
        toast({ title: 'Template deleted' });
        loadData();
      } catch (error) {
        console.error('Failed to delete template:', error);
        toast({ variant: 'destructive', title: 'Failed to delete template' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Templates</h1>
          <p className="text-muted-foreground">Create reusable templates for common tasks</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className={`${!template.is_active ? 'opacity-50' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.template_name}
                    {!template.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(template)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {template.default_items?.length || 0} default items
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {template.default_checklist?.length || 0} checklist items
                </span>
              </div>
              <Badge variant="outline" className="capitalize">{template.job_type}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">Create your first task template to speed up task creation</p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formData.template_name}
                  onChange={e => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g., Photobooth Package"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select value={formData.job_type} onValueChange={v => setFormData({ ...formData, job_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tarpaulin">Tarpaulin</SelectItem>
                    <SelectItem value="sticker">Sticker</SelectItem>
                    <SelectItem value="invitation_card">Invitation Card</SelectItem>
                    <SelectItem value="calling_card">Calling Card</SelectItem>
                    <SelectItem value="photocopy">Photocopy</SelectItem>
                    <SelectItem value="photobooth">Photobooth</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this template is used for..."
              />
            </div>

            <div className="space-y-2">
              <Label>Default Instructions</Label>
              <Textarea
                value={formData.default_instructions}
                onChange={e => setFormData({ ...formData, default_instructions: e.target.value })}
                placeholder="Default special instructions for tasks using this template..."
              />
            </div>

            <div className="space-y-3">
              <Label>Default Items</Label>
              {formData.default_items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ₱{item.price}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Select value={newItem.item_id} onValueChange={handleItemSelect}>
                    <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
                    <SelectContent>
                      {pricelist.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.item_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newItem.quantity}
                  onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  className="col-span-2"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newItem.price}
                  onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                  className="col-span-3"
                />
                <Button type="button" onClick={handleAddItem} className="col-span-1">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Default Checklist</Label>
              {formData.default_checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <span className="flex-1">{item.task}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChecklistItem(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add checklist item..."
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                />
                <Button type="button" onClick={handleAddChecklistItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Active (available for use)</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit">{editingTemplate ? 'Update' : 'Create'} Template</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}