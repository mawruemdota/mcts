import React, { useState, useEffect } from 'react';
import { Supplier } from '@/entities/all';
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
import { Plus, Truck, Search, Link as LinkIcon, MapPin } from 'lucide-react';

const SupplierForm = ({ onSubmitted, supplier }) => {
  const [formData, setFormData] = useState(supplier || {
    supplier_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    category: '',
    location: '',
    link: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (supplier?.id) {
      await Supplier.update(supplier.id, formData);
    } else {
      await Supplier.create(formData);
    }
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
      <div className="space-y-2">
        <Label>Supplier Name</Label>
        <Input value={formData.supplier_name} onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })} required />
      </div>
       <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Category</Label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Ink, Paper" />
            </div>
            <div className="space-y-2">
                <Label>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Manila, Philippines" />
            </div>
        </div>
      <div className="space-y-2">
        <Label>Contact Person</Label>
        <Input value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
      </div>
       <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input type="tel" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label>Website/Link</Label>
                <Input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://..."/>
            </div>
        </div>
      <Button type="submit">{supplier ? 'Update' : 'Create'} Supplier</Button>
    </form>
  );
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setIsLoading(true);
    const data = await Supplier.list();
    setSuppliers(data);
    setIsLoading(false);
  };
  
  const filteredSuppliers = suppliers.filter(s => s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground">Manage your list of suppliers.</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Supplier</Button>
            </DialogTrigger>
            <DialogContent className="dialog-content">
              <DialogHeader><DialogTitle className="text-card-foreground">Add New Supplier</DialogTitle></DialogHeader>
              <SupplierForm onSubmitted={() => { loadSuppliers(); setShowForm(false); }} />
            </DialogContent>
          </Dialog>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <Input placeholder="Search suppliers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground">Category</TableHead>
                  <TableHead className="text-foreground">Location</TableHead>
                  <TableHead className="text-foreground">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow> :
                  filteredSuppliers.map(supplier => (
                    <TableRow key={supplier.id}>
                      <TableCell className="text-foreground font-medium">{supplier.supplier_name}</TableCell>
                      <TableCell className="text-muted-foreground">{supplier.category}</TableCell>
                      <TableCell className="text-muted-foreground">{supplier.location}</TableCell>
                       <TableCell className="text-muted-foreground">
                        {supplier.link && <a href={supplier.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline"><LinkIcon className="w-4 h-4 inline-block"/> View</a>}
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