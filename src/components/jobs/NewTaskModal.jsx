import React, { useState, useEffect, useCallback } from "react";
import { Job, Client, PriceListItem, User, Notification, TaskTemplate } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Upload,
  FileText,
  Link2,
  X,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Trash2,
  Package,
  Edit,
  Check
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

const ClientForm = ({ onClientCreated }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
    industry: '',
    link: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newClient = await Client.create(formData);
      onClientCreated(newClient);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  return (
    <DialogContent className="dialog-content">
      <DialogHeader>
        <DialogTitle className="text-card-foreground">Add New Client</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name *</Label>
            <Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <Input value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Industry</Label>
          <Input value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Add Client</Button>
        </div>
      </form>
    </DialogContent>
  );
};

const EditablePrice = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    onSave(parseFloat(currentValue) || 0);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          className="w-24 h-8 text-sm"
          step="0.01"
          autoFocus
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
        />
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
          <Check className="w-4 h-4 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
          <X className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 cursor-pointer group" onClick={() => setIsEditing(true)}>
      <span className="font-bold text-lg">₱{value.toFixed(2)}</span>
      <Edit className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default function NewTaskModal({ isOpen, onClose, onTaskCreated, user }) {
  const { toast } = useToast();

  const [jobData, setJobData] = useState({
    client_id: '',
    title: '',
    deadline: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    deadline_time: '',
    assigned_to: '',
    special_instructions: '',
    is_rush: false,
    file_urls: [],
    file_links: [''],
    items: [],
    job_type: 'other',
  });
  
  const [clients, setClients] = useState([]);
  const [pricelist, setPricelist] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const statusOptions = [
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'in_production', label: 'In Production' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'ready_pickup', label: 'Ready for Pickup' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const loadData = useCallback(async () => {
    try {
      const [clientData, pricelistData, teamData, templatesData] = await Promise.all([
        Client.list(),
        PriceListItem.list(),
        User.list(),
        TaskTemplate.filter({ is_active: true })
      ]);
      setClients(clientData);
      const sortedPriceList = pricelistData.sort((a, b) => a.item_name.localeCompare(b.item_name));
      setPricelist(sortedPriceList);
      setTeamMembers(teamData.filter(u => u.role === 'user' || u.role === 'admin'));
      setTemplates(templatesData);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (jobData.items.length === 0) {
        addItem(); // Add one item by default
      }
    }
  }, [isOpen, loadData, jobData.items.length]); // Added jobData.items.length to dependency array to prevent infinite loop on initial render

  const handleJobChange = (field, value) => {
    setJobData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      handleJobChange('client_id', clientId);
    }
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...jobData.file_links];
    newLinks[index] = value;
    handleJobChange('file_links', newLinks);
  };

  const addLinkInput = () => handleJobChange('file_links', [...jobData.file_links, '']);
  const removeLinkInput = (index) => handleJobChange('file_links', jobData.file_links.filter((_, i) => i !== index));
  const handleFileSelect = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleClientCreated = (newClient) => {
    setClients(prev => [...prev, newClient]);
    setSelectedClient(newClient);
    handleJobChange('client_id', newClient.id);
    setShowClientForm(false);
  };

  const handleTemplateSelect = (templateId) => {
    if (!templateId || templateId === 'none') {
      setSelectedTemplate(null);
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setJobData(prev => ({
        ...prev,
        job_type: template.job_type || prev.job_type,
        special_instructions: template.default_instructions || prev.special_instructions,
        items: template.default_items?.map(item => ({
          ...item,
          id: `temp-${Date.now()}-${Math.random()}`,
          is_custom: !item.item_id,
          custom_price: item.price,
          pricing_tier: 'custom',
          completed: false
        })) || prev.items
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...jobData.items];
    const currentItem = newItems[index];

    if (field === 'item_id') {
      if (value === 'custom') {
          currentItem.is_custom = true;
          currentItem.item_id = 'custom';
          currentItem.item_name = '';
          currentItem.price = 0;
          currentItem.custom_price = 0;
          currentItem.pricing_tier = 'custom';
      } else {
          const selectedItem = pricelist.find(p => p.id === value);
          currentItem.is_custom = false;
          currentItem.item_id = value;
          currentItem.item_name = selectedItem?.item_name || '';
          const tier = currentItem.pricing_tier !== 'custom' ? currentItem.pricing_tier : 'conservative';
          currentItem.price = selectedItem?.[`price_${tier}`] || selectedItem?.price_conservative || 0;
          currentItem.custom_price = currentItem.price;
      }
    } else if (field === 'item_name' && currentItem.is_custom) {
        currentItem.item_name = value;
    } else if (field === 'pricing_tier') {
      currentItem.pricing_tier = value;
      if (value === 'custom') {
        // Retain current price as starting point for custom price
        currentItem.custom_price = currentItem.price;
      } else if (!currentItem.is_custom) {
        const selectedItem = pricelist.find(p => p.id === currentItem.item_id);
        const newPrice = selectedItem?.[`price_${value}`] || selectedItem?.price_conservative || 0;
        currentItem.price = newPrice;
        currentItem.custom_price = newPrice;
      }
    } else if (field === 'custom_price') {
      currentItem.custom_price = parseFloat(value) || 0;
      if (currentItem.is_custom) {
          currentItem.price = parseFloat(value) || 0;
      }
    } else if (field === 'quantity') {
      currentItem.quantity = parseInt(value) || 1;
    } else {
      currentItem[field] = value;
    }
    setJobData(prev => ({ ...prev, items: newItems }));
  };


  const addItem = () => {
    setJobData(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: `temp-${Date.now()}`, 
        is_custom: false,
        item_id: '', 
        quantity: 1, 
        price: 0, 
        item_name: '', 
        custom_price: 0, 
        pricing_tier: 'conservative' 
      }]
    }));
  };

  const addCustomItem = () => {
    setJobData(prev => ({
        ...prev,
        items: [...prev.items, { 
            id: `temp-${Date.now()}`,
            is_custom: true,
            item_id: 'custom', 
            item_name: '',
            quantity: 1,
            price: 0,
            custom_price: 0,
            pricing_tier: 'custom'
        }]
    }));
  };
  
  const removeItem = (index) => handleJobChange('items', jobData.items.filter((_, i) => i !== index));

  const estimatedTotal = jobData.items.reduce((total, item) => total + ((item.custom_price || 0) * (item.quantity || 1)), 0);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobData.client_id || !jobData.title || jobData.items.some(i => i.is_custom ? !i.item_name : !i.item_id)) {
      setError('Please select a client, provide a task title, and complete all item fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const uploadedFiles = [];
      for (const file of files) {
        const { file_url } = await UploadFile({ file });
        uploadedFiles.push(file_url);
      }

      const generatedJobId = `MCTS-${Date.now().toString().slice(-6)}`;
      let deadlineDateTime = jobData.deadline;
      if (jobData.deadline_time) {
        deadlineDateTime = `${jobData.deadline}T${jobData.deadline_time}`;
      }

      const totalQuantity = jobData.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

      const finalJobData = {
        ...jobData,
        job_id: generatedJobId,
        client_name: selectedClient?.client_name,
        client_phone: selectedClient?.phone_number || '',
        client_email: selectedClient?.email || '',
        deadline: deadlineDateTime,
        file_urls: uploadedFiles,
        file_links: jobData.file_links.filter(link => link.trim() !== ''),
        estimated_price: estimatedTotal,
        actual_price: estimatedTotal,
        items: jobData.items.filter(i => i.item_name).map(item => ({
          item_id: item.is_custom ? null : item.item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          price: item.custom_price,
          completed: false
        })),
        checklist: selectedTemplate?.default_checklist || [],
        quantity: totalQuantity,
        status: 'pending_approval'
      };

      await Job.create(finalJobData);

      // Notify user if they assigned the task to themselves
      if (user && finalJobData.assigned_to === user.email) {
          try {
              await Notification.create({
                  recipient_email: user.email,
                  message: `You assigned a new task to yourself: "${finalJobData.title}"`,
                  link_to: createPageUrl('Dashboard')
              });
          } catch (notifError) {
              console.error("Failed to create self-assignment notification:", notifError);
          }
      }

      toast({ title: "Task Created!", description: "The new task has been added successfully." });
      onTaskCreated();
      onClose();
    } catch (error) {
      setError('Failed to create task. Please try again.');
      console.error('Task creation error:', error);
    }
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-content max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">New Task Intake</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6">
          <form onSubmit={handleCreateJob} className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Client & Task Title</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="client_select">Select Client *</Label>
                    <Select value={jobData.client_id} onValueChange={handleClientSelect}>
                      <SelectTrigger><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
                     <DialogTrigger asChild>
                        <Button type="button" variant="outline">New</Button>
                     </DialogTrigger>
                    <ClientForm onClientCreated={handleClientCreated} />
                  </Dialog>
                </div>
                 <div>
                  <Label htmlFor="title">Task Title *</Label>
                  <Input id="title" placeholder="e.g., Rush Tarpaulin for Birthday" value={jobData.title} onChange={(e) => handleJobChange("title", e.target.value)} required />
                </div>
                {templates.length > 0 && (
                  <div className="md:col-span-2">
                    <Label>Use Template (Optional)</Label>
                    <Select value={selectedTemplate?.id || 'none'} onValueChange={handleTemplateSelect}>
                      <SelectTrigger><SelectValue placeholder="Start from scratch or use a template..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Template (Start Fresh)</SelectItem>
                        {templates.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.template_name} - {t.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedClient && (
                  <div className="md:col-span-2 bg-secondary p-4 rounded-lg text-sm">
                    <p><strong>Contact:</strong> {selectedClient.contact_person}</p>
                    <p><strong>Phone:</strong> {selectedClient.phone_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                  <CardTitle>Items / Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 font-bold text-sm mb-2 px-1">
                    <div className="col-span-4">Item/Service</div>
                    <div className="col-span-2">Tier</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>
                  {jobData.items.map((item, index) => (
                      <div key={item.id || index} className="grid grid-cols-12 gap-2 items-center">
                          {item.is_custom ? (
                            <Input 
                                placeholder="Custom Item Name" 
                                value={item.item_name}
                                onChange={e => handleItemChange(index, 'item_name', e.target.value)}
                                className="col-span-4"
                            />
                          ) : (
                            <Select value={item.item_id} onValueChange={value => handleItemChange(index, 'item_id', value)} className="col-span-4">
                                <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custom">-- Add Custom Item --</SelectItem>
                                    {pricelist.map(p => <SelectItem key={p.id} value={p.id}>{p.item_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          )}
                          <div className="col-span-2">
                            <Select value={item.pricing_tier} onValueChange={value => handleItemChange(index, 'pricing_tier', value)} disabled={item.is_custom}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="aggressive">Aggressive</SelectItem>
                                    <SelectItem value="conservative">Conservative</SelectItem>
                                    <SelectItem value="extreme">Extreme</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                          </div>
                          <Input className="col-span-1" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                          <Input className="col-span-2" type="number" step="0.01" placeholder="Price" value={item.custom_price} onChange={e => handleItemChange(index, 'custom_price', e.target.value)} disabled={item.pricing_tier !== 'custom' && !item.is_custom} />
                          <div className="col-span-2 text-right font-semibold">
                              ₱{((item.custom_price || 0) * (item.quantity || 1)).toFixed(2)}
                          </div>
                          <div className="col-span-1 text-right">
                            {jobData.items.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                            )}
                          </div>
                      </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2"/>Add Item</Button>
                    <Button type="button" variant="outline" size="sm" onClick={addCustomItem}><Plus className="w-4 h-4 mr-2"/>Add Custom Item</Button>
                  </div>
              </CardContent>
              <CardFooter className="flex justify-end pr-6">
                <div className="text-right">
                    <Label className="text-sm">Total Amount</Label>
                    <p className="text-2xl font-bold">₱{estimatedTotal.toFixed(2)}</p>
                </div>
              </CardFooter>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
               <Card>
                 <CardHeader><CardTitle>Schedule & Assignment</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Popover>
                          <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{jobData.deadline ? format(new Date(jobData.deadline), 'PPP') : 'Pick a date'}</Button></PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(jobData.deadline)} onSelect={(d) => handleJobChange('deadline', format(d, 'yyyy-MM-dd'))} /></PopoverContent>
                      </Popover>
                      <Input type="time" value={jobData.deadline_time} onChange={(e) => handleJobChange('deadline_time', e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Select value={jobData.assigned_to} onValueChange={v => handleJobChange('assigned_to', v)}>
                        <SelectTrigger><SelectValue placeholder="Select team member..."/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {teamMembers.map(m => <SelectItem key={m.id} value={m.email}>{m.nickname || m.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                 </CardContent>
               </Card>
               <Card>
                  <CardHeader><CardTitle>Files & Instructions</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     <div>
                        <Label>Special Instructions</Label>
                        <Textarea value={jobData.special_instructions} onChange={e => handleJobChange('special_instructions', e.target.value)} />
                     </div>
                     <div>
                        <Label>Upload Files</Label>
                        <Input type="file" multiple onChange={handleFileSelect}/>
                     </div>
                     <div className="space-y-2">
                        <Label>File Links</Label>
                        {jobData.file_links.map((link, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    type="url"
                                    placeholder="https://example.com/file"
                                    value={link}
                                    onChange={(e) => handleLinkChange(index, e.target.value)}
                                />
                                {jobData.file_links.length > 1 && (
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeLinkInput(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addLinkInput}>
                            <Plus className="h-4 w-4 mr-2" />Add Link
                        </Button>
                     </div>
                     {files.length > 0 && (
                        <div className="space-y-2">
                            <Label>Selected Files:</Label>
                            <ul className="text-sm text-muted-foreground">
                                {files.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between">
                                        <span>{file.name}</span>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                     )}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_rush"
                            checked={jobData.is_rush}
                            onCheckedChange={(checked) => handleJobChange('is_rush', checked)}
                        />
                        <Label htmlFor="is_rush">Rush Order</Label>
                     </div>
                  </CardContent>
               </Card>
            </div>

            <div className="pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto min-w-[150px]">
                {isSubmitting ? "Creating Task..." : "Create Task"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}