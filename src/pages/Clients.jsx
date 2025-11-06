import React, { useState, useEffect } from 'react';
import { Client } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, BookUser, Search, Link as LinkIcon, Briefcase } from 'lucide-react';

const ClientForm = ({ onSubmitted, client }) => {
  const [formData, setFormData] = useState(client || {
    client_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
    industry: '',
    link: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (client?.id) {
      await Client.update(client.id, formData);
    } else {
      await Client.create(formData);
    }
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
      <div className="space-y-2">
        <Label>Client/Company Name</Label>
        <Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Contact Person</Label>
        <Input value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input type="tel" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} required />
        </div>
        <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} placeholder="e.g. Retail, F&B"/>
        </div>
        <div className="space-y-2">
            <Label>Website/Link</Label>
            <Input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://..."/>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
      </div>
      <Button type="submit">{client ? 'Update' : 'Create'} Client</Button>
    </form>
  );
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    const data = await Client.list();
    setClients(data);
    setIsLoading(false);
  };
  
  const filteredClients = clients.filter(c => c.client_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">Manage your client list.</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Client</Button>
            </DialogTrigger>
            <DialogContent className="dialog-content">
              <DialogHeader><DialogTitle className="text-card-foreground">Add New Client</DialogTitle></DialogHeader>
              <ClientForm onSubmitted={() => { loadClients(); setShowForm(false); }} />
            </DialogContent>
          </Dialog>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <Input placeholder="Search clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground">Contact</TableHead>
                  <TableHead className="text-foreground">Industry</TableHead>
                  <TableHead className="text-foreground">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow> :
                  filteredClients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell className="text-foreground font-medium">{client.client_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div>{client.contact_person}</div>
                        <div className="text-xs">{client.phone_number}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{client.industry}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.link && <a href={client.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline"><LinkIcon className="w-4 h-4 inline-block"/> View</a>}
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}