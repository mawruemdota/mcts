
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReimbursementRequest, Client } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Plus, Trash2, Upload, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { UploadFile } from '@/integrations/Core';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReimbursementForm({ clients, editingRequest, onSubmitted }) {
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    requestor_name: '',
    requestor_designation: '',
    request_date: new Date(),
    items: [{ purchased_from: '', item_description: '', quantity: 1, price: '' }],
    reference_photos: [],
    notes: '',
    status: 'Pending',
  });
  const [editingId, setEditingId] = useState(null);
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingRequest) {
      setFormData({
        client_id: editingRequest.client_id || '',
        client_name: editingRequest.client_name || '',
        requestor_name: editingRequest.requestor_name || '',
        requestor_designation: editingRequest.requestor_designation || '',
        request_date: editingRequest.request_date ? new Date(editingRequest.request_date) : new Date(),
        items: editingRequest.items && editingRequest.items.length > 0 ? editingRequest.items : [{ purchased_from: '', item_description: '', quantity: 1, price: '' }],
        reference_photos: editingRequest.reference_photos || [],
        notes: editingRequest.notes || '',
        status: editingRequest.status || 'Pending',
      });
      setEditingId(editingRequest.id);
    } else {
      // Reset form if editingRequest becomes null/undefined, useful for creating new after editing
      setFormData({
        client_id: '',
        client_name: '',
        requestor_name: '',
        requestor_designation: '',
        request_date: new Date(),
        items: [{ purchased_from: '', item_description: '', quantity: 1, price: '' }],
        reference_photos: [],
        notes: '',
        status: 'Pending',
      });
      setEditingId(null);
    }
  }, [editingRequest]);
  
  useEffect(() => {
    const newTotal = formData.items.reduce((acc, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      return acc + (price * quantity);
    }, 0);
    setTotal(newTotal);
  }, [formData.items]);

  const handleClientChange = (clientId) => {
    const client = (clients || []).find(c => c.id === clientId);
    if (client) {
        setFormData(prev => ({
            ...prev,
            client_id: client.id,
            client_name: client.client_name
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            client_id: '',
            client_name: ''
        }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { purchased_from: '', item_description: '', quantity: 1, price: '' }]
    }));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setIsUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async file => {
          const { file_url } = await UploadFile({ file });
          return file_url;
        })
      );
      setFormData(prev => ({
        ...prev,
        reference_photos: [...prev.reference_photos, ...uploadedUrls]
      }));
      toast({ title: "Photos uploaded successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed." });
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (urlToRemove) => {
    setFormData(prev => ({
      ...prev,
      reference_photos: prev.reference_photos.filter(url => url !== urlToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const dataToSubmit = { 
            ...formData, 
            total_amount: total,
            request_date: format(formData.request_date, 'yyyy-MM-dd')
        };
        
        let result;
        if (editingId) {
            result = await ReimbursementRequest.update(editingId, dataToSubmit);
            toast({ title: 'Success', description: 'Reimbursement request updated.' });
        } else {
            result = await ReimbursementRequest.create(dataToSubmit);
            toast({ title: 'Success', description: 'Reimbursement request submitted.' });
        }
        
        if (onSubmitted) {
          onSubmitted(result); // Pass the created/updated request object to the parent
        } else {
          // Reset form or redirect if not controlled by parent
          setFormData({
              client_id: '',
              client_name: '',
              requestor_name: '',
              requestor_designation: '',
              request_date: new Date(),
              items: [{ purchased_from: '', item_description: '', quantity: 1, price: '' }],
              reference_photos: [],
              notes: '',
              status: 'Pending',
          });
          setEditingId(null);
        }
    } catch (error) {
      console.error("Submission error:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit request.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit' : 'Create'} Reimbursement Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    id="client"
                    value={formData.client_id}
                    onValueChange={handleClientChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Select Client --" />
                    </SelectTrigger>
                    <SelectContent>
                      {(clients || []).map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request_date">Date of Request *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.request_date ? format(formData.request_date, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.request_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, request_date: date }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestor_name">Requestor Name *</Label>
                  <Input id="requestor_name" value={formData.requestor_name} onChange={e => setFormData(prev => ({...prev, requestor_name: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestor_designation">Designation</Label>
                  <Input id="requestor_designation" value={formData.requestor_designation} onChange={e => setFormData(prev => ({...prev, requestor_designation: e.target.value}))} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Items for Reimbursement</h3>
                {formData.items.map((item, index) => (
                  <div key={index} className="grid md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Purchased From</Label>
                      <Input value={item.purchased_from} onChange={e => handleItemChange(index, 'purchased_from', e.target.value)} />
                    </div>
                     <div className="md:col-span-2 space-y-2">
                      <Label>Item Description *</Label>
                      <Input value={item.item_description} onChange={e => handleItemChange(index, 'item_description', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Price *</Label>
                      <Input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} required />
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                       {formData.items.length > 1 && (
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>

              <div className="space-y-4">
                 <h3 className="font-medium text-lg border-b pb-2">Supporting Photos</h3>
                 <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} multiple accept="image/*" className="hidden" />
                 <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Upload className="w-4 h-4 mr-2"/>}
                    Upload Photos
                 </Button>
                 <div className="flex flex-wrap gap-4 mt-4">
                    {formData.reference_photos.map((url, index) => (
                        <div key={index} className="relative group">
                            <img src={url} alt={`Reference ${index+1}`} className="w-24 h-24 object-cover rounded-md"/>
                            <Button 
                                type="button"
                                variant="destructive" 
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => removePhoto(url)}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))} />
              </div>
              
              {editingId && (
                <div className="space-y-2">
                   <Label htmlFor="status">Status</Label>
                   <Select value={formData.status} onValueChange={v => setFormData(prev => ({...prev, status: v}))}>
                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Reimbursed">Reimbursed</SelectItem>
                        </SelectContent>
                   </Select>
                </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Total: ₱{total.toFixed(2)}</h3>
              <div className="flex gap-2">
                <Link to={createPageUrl("Forms")}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                  {editingId ? 'Update Request' : 'Submit Request'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
