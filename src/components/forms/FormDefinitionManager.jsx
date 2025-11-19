import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Copy, ExternalLink, X, GripVertical } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function FormDefinitionManager() {
  const [forms, setForms] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    form_name: '',
    service_id: '',
    service_name: '',
    description: '',
    fields: [],
    is_active: true
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [formsData, servicesData] = await Promise.all([
        base44.entities.FormDefinition.list('-created_date'),
        base44.entities.PriceListItem.list()
      ]);
      setForms(formsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Failed to load forms' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      form_name: '',
      service_id: '',
      service_name: '',
      description: '',
      fields: [],
      is_active: true
    });
    setEditingForm(null);
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setFormData({
      form_name: form.form_name || '',
      service_id: form.service_id || '',
      service_name: form.service_name || '',
      description: form.description || '',
      fields: form.fields || [],
      is_active: form.is_active !== false
    });
    setShowDialog(true);
  };

  const handleDelete = async (formId) => {
    if (!window.confirm('Delete this form? All related submissions will remain.')) return;

    try {
      await base44.entities.FormDefinition.delete(formId);
      toast({ title: 'Form deleted' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete form' });
    }
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setFormData({
        ...formData,
        service_id: serviceId,
        service_name: service.item_name
      });
    } else {
      setFormData({
        ...formData,
        service_id: '',
        service_name: ''
      });
    }
  };

  const addField = () => {
    const newField = {
      field_id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: []
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    });
  };

  const updateField = (index, key, value) => {
    const newFields = [...formData.fields];
    newFields[index][key] = value;
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.form_name) {
      toast({ variant: 'destructive', title: 'Form name is required' });
      return;
    }

    try {
      if (editingForm) {
        await base44.entities.FormDefinition.update(editingForm.id, formData);
        toast({ title: 'Form updated' });
      } else {
        await base44.entities.FormDefinition.create(formData);
        toast({ title: 'Form created' });
      }

      resetForm();
      setShowDialog(false);
      loadData();
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Failed to save form' });
    }
  };

  const copyFormLink = (formId) => {
    const link = `${window.location.origin}${createPageUrl('DynamicForm')}?id=${formId}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dynamic Forms</h2>
          <p className="text-sm text-muted-foreground">Create custom forms for different services</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Form
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No forms created yet. Click "Create Form" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{form.form_name}</h3>
                      {!form.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {form.service_name && (
                        <Badge variant="outline">{form.service_name}</Badge>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-sm text-muted-foreground mb-2">{form.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {form.fields?.length || 0} custom field(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyFormLink(form.id)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <a
                      href={`${createPageUrl('DynamicForm')}?id=${form.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(form)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(form.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingForm ? 'Edit' : 'Create'} Form</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="form_name">Form Name *</Label>
                <Input
                  id="form_name"
                  value={formData.form_name}
                  onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
                  placeholder="e.g., Event Planning Request"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this form for?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="service">Link to Service (Optional)</Label>
                <Select value={formData.service_id} onValueChange={handleServiceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="is_active">Status</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base">Custom Form Fields</Label>
                <Button type="button" size="sm" onClick={addField}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {formData.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom fields. Name, phone, and email are always included.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.fields.map((field, index) => (
                    <Card key={field.field_id} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-4">
                            <Label className="text-xs">Field Label *</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(index, 'label', e.target.value)}
                              placeholder="e.g., Event Date"
                              className="h-9"
                            />
                          </div>

                          <div className="col-span-3">
                            <Label className="text-xs">Field Type *</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) => updateField(index, 'type', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="textarea">Text Area</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="select">Dropdown</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-3">
                            <Label className="text-xs">Placeholder</Label>
                            <Input
                              value={field.placeholder}
                              onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                              placeholder="Hint text"
                              className="h-9"
                            />
                          </div>

                          <div className="col-span-1 flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(index, 'required', e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-xs">Req</span>
                            </label>
                          </div>

                          <div className="col-span-1 flex items-end justify-end">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeField(index)}
                              className="h-9 w-9"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>

                          {field.type === 'select' && (
                            <div className="col-span-12">
                              <Label className="text-xs">Dropdown Options (comma-separated)</Label>
                              <Input
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => {
                                  const options = e.target.value.split(',').map(o => o.trim()).filter(o => o);
                                  updateField(index, 'options', options);
                                }}
                                placeholder="Option 1, Option 2, Option 3"
                                className="h-9"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingForm ? 'Update' : 'Create'} Form
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}