
import React, { useState, useEffect, useCallback } from "react";
import { Client, Supplier } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Building, Briefcase, BookUser, Users, Truck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ContactForm = ({ contact, type, onSubmitted }) => {
  const isClient = type === 'client';
  const [formData, setFormData] = useState(
    contact || {
      ...(isClient ? { client_name: "", contact_person: "", industry: "", link: "" } : { supplier_name: "", category: "" }),
      phone_number: "",
      email: "",
      address: "",
      notes: ""
    }
  );
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (contact) {
        isClient ? await Client.update(contact.id, formData) : await Supplier.update(contact.id, formData);
        toast({ title: "Success", description: `${isClient ? 'Client' : 'Supplier'} updated.` });
      } else {
        isClient ? await Client.create(formData) : await Supplier.create(formData);
        toast({ title: "Success", description: `${isClient ? 'Client' : 'Supplier'} added.` });
      }
      onSubmitted();
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: `Failed to save ${isClient ? 'client' : 'supplier'}.`});
       console.error("Axios Error Details:", error.response);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
      <div className="space-y-2">
        <Label htmlFor={isClient ? 'client_name' : 'supplier_name'}>{isClient ? 'Company Name' : 'Supplier Name'}</Label>
        <Input id={isClient ? 'client_name' : 'supplier_name'} value={isClient ? formData.client_name : formData.supplier_name} onChange={e => handleChange(isClient ? 'client_name' : 'supplier_name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input id="contact_person" value={formData.contact_person} onChange={e => handleChange('contact_person', e.target.value)} />
        </div>
        {isClient ? (
            <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" value={formData.industry} onChange={e => handleChange('industry', e.target.value)} />
            </div>
        ) : (
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={formData.category} onChange={e => handleChange('category', e.target.value)} placeholder="e.g., Ink, Paper" />
            </div>
        )}
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input id="phone_number" value={formData.phone_number} onChange={e => handleChange('phone_number', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">{isClient ? 'Company Address' : 'Location'}</Label>
        <Input id="address" value={formData.address} onChange={e => handleChange('address', e.target.value)} />
      </div>
       <div className="space-y-2">
        <Label htmlFor="link">Website/Social Link</Label>
        <Input id="link" value={formData.link} onChange={e => handleChange('link', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="submit">{contact ? 'Update' : 'Save'}</Button>
      </div>
    </form>
  );
};

const ClientsList = ({ clients, onEdit, onDelete, isLoading }) => (
    <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-foreground">Company Name</TableHead>
                    <TableHead className="text-foreground">Contact Person</TableHead>
                    <TableHead className="text-foreground">Phone</TableHead>
                    <TableHead className="text-foreground">Website/Link</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : clients.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No clients found.</TableCell></TableRow>
                ) : (
                    clients.map(client => (
                        <TableRow key={client.id}>
                            <TableCell className="text-foreground font-medium whitespace-nowrap">{client.client_name}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{client.contact_person || '-'}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{client.phone_number || '-'}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                {client.link ? (
                                    <a href={client.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        {client.link.length > 30 ? client.link.substring(0, 30) + '...' : client.link}
                                    </a>
                                ) : '-'}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(client, 'client')}><Edit className="w-4 h-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(client, 'client')}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    </div>
);

const SuppliersList = ({ suppliers, onEdit, onDelete, isLoading }) => (
    <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-foreground">Supplier Name</TableHead>
                    <TableHead className="text-foreground">Contact Person</TableHead>
                    <TableHead className="text-foreground">Phone</TableHead>
                    <TableHead className="text-foreground">Website/Link</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : suppliers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No suppliers found.</TableCell></TableRow>
                ) : (
                    suppliers.map(supplier => (
                        <TableRow key={supplier.id}>
                            <TableCell className="text-foreground font-medium whitespace-nowrap">{supplier.supplier_name}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{supplier.contact_person || '-'}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{supplier.phone_number || '-'}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                {supplier.link ? (
                                    <a href={supplier.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        {supplier.link.length > 30 ? supplier.link.substring(0, 30) + '...' : supplier.link}
                                    </a>
                                ) : '-'}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(supplier, 'supplier')}><Edit className="w-4 h-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(supplier, 'supplier')}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    </div>
);

export default function ContactsPage() {
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formType, setFormType] = useState('client');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientData, supplierData] = await Promise.all([
        Client.list(),
        Supplier.list()
      ]);
      setClients(clientData);
      setSuppliers(supplierData);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load contacts." });
      console.error("Failed to load contacts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);
  
  const handleAddNew = (type) => {
    setFormType(type);
    setEditingContact(null);
    setShowForm(true);
  };

  const handleEdit = (contact, type) => {
    setFormType(type);
    setEditingContact(contact);
    setShowForm(true);
  };
  
  const handleDelete = async (contact, type) => {
      const confirmation = window.confirm(`Are you sure you want to delete ${type === 'client' ? contact.client_name : contact.supplier_name}?`);
      if(confirmation) {
          try {
            type === 'client' ? await Client.delete(contact.id) : await Supplier.delete(contact.id);
            toast({ title: "Success", description: `${type === 'client' ? 'Client' : 'Supplier'} deleted.`});
            loadContacts();
          } catch(e) {
            toast({ variant: "destructive", title: "Error", description: `Could not delete ${type}.`});
          }
      }
  }
  
  const filteredClients = clients
    .filter(c => 
      (c.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''));
    
  const filteredSuppliers = suppliers
    .filter(s =>
      (s.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.supplier_name || '').localeCompare(b.supplier_name || ''));

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <BookUser className="w-7 h-7" />
            Contacts
          </h1>
          <p className="text-muted-foreground">Manage clients and suppliers for your business.</p>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-foreground">
                <Building className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg">{clients.length}</span>
                <span className="text-sm text-muted-foreground">Clients</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
                <Briefcase className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg">{suppliers.length}</span>
                <span className="text-sm text-muted-foreground">Suppliers</span>
            </div>
          </div>
      </div>

      <div className="relative w-full md:w-64 mt-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="clients" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients" className="data-[state=active]:bg-background">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-background">
              <Truck className="w-4 h-4 mr-2" />
              Suppliers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="clients" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Clients ({filteredClients.length})</CardTitle>
                    <Button onClick={() => handleAddNew('client')}><Plus className="w-4 h-4 mr-2" />Add Client</Button>
                </CardHeader>
                <CardContent>
                   <ClientsList clients={filteredClients} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="suppliers" className="mt-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
                    <Button onClick={() => handleAddNew('supplier')}><Plus className="w-4 h-4 mr-2" />Add Supplier</Button>
                </CardHeader>
                <CardContent>
                   <SuppliersList suppliers={filteredSuppliers} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
                </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
        
        {/* This is the main Dialog component that controls the form display */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="dialog-content">
                <DialogHeader>
                    <DialogTitle className="text-card-foreground">{editingContact ? 'Edit' : 'Add New'} {formType === 'client' ? 'Client' : 'Supplier'}</DialogTitle>
                </DialogHeader>
                <ContactForm contact={editingContact} type={formType} onSubmitted={() => { setShowForm(false); loadContacts(); }} />
            </DialogContent>
        </Dialog>
    </div>
  );
}
