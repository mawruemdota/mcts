
import React, { useState, useEffect, useCallback } from "react";
import { PriceListItem } from "@/entities/all";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CostingCalculator from "../components/products/CostingCalculator";

const PricelistForm = ({ item, onSubmitted }) => {
  const [formData, setFormData] = useState(
    item || {
      item_name: "",
      category: "item",
      price_aggressive: "",
      price_conservative: "",
      price_extreme: "",
      unit: "",
      description: "",
      material: "",
      dimension: "",
    }
  );
  const { toast } = useToast();

  useEffect(() => {
    setFormData(item ? {
      ...item,
      price_aggressive: item.price_aggressive?.toString() || "",
      price_conservative: item.price_conservative?.toString() || "",
      price_extreme: item.price_extreme?.toString() || "",
    } : {
      item_name: "",
      category: "item",
      price_aggressive: "",
      price_conservative: "",
      price_extreme: "",
      unit: "",
      description: "",
      material: "",
      dimension: "",
    });
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        price_aggressive: parseFloat(formData.price_aggressive) || null,
        price_conservative: parseFloat(formData.price_conservative) || null,
        price_extreme: parseFloat(formData.price_extreme) || null,
      };

      if (isNaN(dataToSubmit.price_aggressive)) dataToSubmit.price_aggressive = null;
      if (isNaN(dataToSubmit.price_conservative)) dataToSubmit.price_conservative = null;
      if (isNaN(dataToSubmit.price_extreme)) dataToSubmit.price_extreme = null;

      if (item) {
        await PriceListItem.update(item.id, dataToSubmit);
        toast({ title: "Success", description: "Item updated successfully." });
      } else {
        await PriceListItem.create(dataToSubmit);
        toast({ title: "Success", description: "New item added to pricelist." });
      }
      onSubmitted();
    } catch (error) {
      console.error("Failed to save item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save item. " + (error.message || ""),
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item_name">Name</Label>
          <Input id="item_name" value={formData.item_name} onChange={(e) => handleInputChange("item_name", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="item">Item</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
          <Label>Pricing Tiers (₱)</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
              <div>
                  <Label htmlFor="price_aggressive" className="text-xs text-muted-foreground">Aggressive</Label>
                  <Input id="price_aggressive" type="number" step="0.01" placeholder="e.g., 80.00" value={formData.price_aggressive} onChange={(e) => handleInputChange("price_aggressive", e.target.value)} />
              </div>
              <div>
                  <Label htmlFor="price_conservative" className="text-xs text-muted-foreground">Conservative *</Label>
                  <Input id="price_conservative" type="number" step="0.01" placeholder="e.g., 100.00" value={formData.price_conservative} onChange={(e) => handleInputChange("price_conservative", e.target.value)} required/>
              </div>
              <div>
                  <Label htmlFor="price_extreme" className="text-xs text-muted-foreground">Extreme</Label>
                  <Input id="price_extreme" type="number" step="0.01" placeholder="e.g., 120.00" value={formData.price_extreme} onChange={(e) => handleInputChange("price_extreme", e.target.value)} />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" value={formData.unit} onChange={(e) => handleInputChange("unit", e.target.value)} placeholder="e.g., per piece, per sq ft" required />
        </div>
      </div>
       <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} />
        </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input id="material" value={formData.material} onChange={(e) => handleInputChange("material", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimension">Dimension</Label>
          <Input id="dimension" value={formData.dimension} onChange={(e) => handleInputChange("dimension", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">{item ? "Update" : "Add"}</Button>
      </div>
    </form>
  );
};

const ItemsTable = ({ items, handleEdit, handleDelete }) => (
    <div className="bg-card border-border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-foreground">Item Name</TableHead>
            <TableHead className="text-foreground">Unit</TableHead>
            <TableHead className="text-right text-foreground">Aggressive (₱)</TableHead>
            <TableHead className="text-right text-foreground">Conservative (₱)</TableHead>
            <TableHead className="text-right text-foreground">Extreme (₱)</TableHead>
            <TableHead className="text-right text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item) => (
              <TableRow key={item.id} className="hover:bg-secondary/50">
                <TableCell className="font-medium text-foreground">{item.item_name}</TableCell>
                <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                <TableCell className="text-right text-foreground">{item.price_aggressive?.toFixed(2) ? `₱${item.price_aggressive.toFixed(2)}` : 'N/A'}</TableCell>
                <TableCell className="text-right font-semibold text-foreground">{item.price_conservative?.toFixed(2) ? `₱${item.price_conservative.toFixed(2)}` : 'N/A'}</TableCell>
                <TableCell className="text-right text-foreground">{item.price_extreme?.toFixed(2) ? `₱${item.price_extreme.toFixed(2)}` : 'N/A'}</TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No items found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
);

const ServicesTable = ({ services, handleEdit, handleDelete }) => (
    <div className="bg-card border-border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-foreground">Service Name</TableHead>
            <TableHead className="text-foreground">Unit</TableHead>
            <TableHead className="text-right text-foreground">Aggressive (₱)</TableHead>
            <TableHead className="text-right text-foreground">Conservative (₱)</TableHead>
            <TableHead className="text-right text-foreground">Extreme (₱)</TableHead>
            <TableHead className="text-right text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length > 0 ? (
            services.map((service) => (
              <TableRow key={service.id} className="hover:bg-secondary/50">
                <TableCell className="font-medium text-foreground">{service.item_name}</TableCell>
                <TableCell className="text-muted-foreground">{service.unit}</TableCell>
                <TableCell className="text-right text-foreground">{service.price_aggressive?.toFixed(2) ? `₱${service.price_aggressive.toFixed(2)}` : 'N/A'}</TableCell>
                <TableCell className="text-right font-semibold text-foreground">{service.price_conservative?.toFixed(2) ? `₱${service.price_conservative.toFixed(2)}` : 'N/A'}</TableCell>
                <TableCell className="text-right text-foreground">{service.price_extreme?.toFixed(2) ? `₱${service.price_extreme.toFixed(2)}` : 'N/A'}</TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}><Edit className="w-4 h-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No services found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
);


export default function ItemsAndServicesPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await PriceListItem.list();
      // Sort items alphabetically by item_name
      const sortedData = data.sort((a, b) => a.item_name.localeCompare(b.item_name));
      setItems(sortedData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load price list items.",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);
  

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this?")) {
        try {
            await PriceListItem.delete(itemId);
            toast({ title: "Success", description: "Deleted successfully." });
            loadItems();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete." });
        }
    }
  }
  
  const handleFormSubmitted = () => {
    setShowForm(false);
    setEditingItem(null);
    loadItems();
  };
  
  const filteredItems = items.filter(i => 
    i.category === 'item' &&
    (i.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (i.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredServices = items.filter(i => 
    i.category === 'service' &&
    (i.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (i.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Products & Services</h1>
            <p className="text-muted-foreground mt-1">Manage all offered products and services.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button onClick={() => { setEditingItem(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        <Tabs defaultValue="items" className="w-full">
            <TabsList className="tabs-list">
              <TabsTrigger value="items" className="tabs-trigger">Items</TabsTrigger>
              <TabsTrigger value="services" className="tabs-trigger">Services</TabsTrigger>
              <TabsTrigger value="costing" className="tabs-trigger">
                <Calculator className="w-4 h-4 mr-2" />
                Costing Calculator
              </TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="mt-4">
                {isLoading ? <p className="text-center text-muted-foreground">Loading...</p> : 
                    <ItemsTable items={filteredItems} handleEdit={handleEdit} handleDelete={handleDelete} />
                }
            </TabsContent>
            <TabsContent value="services" className="mt-4">
                 {isLoading ? <p className="text-center text-muted-foreground">Loading...</p> : 
                    <ServicesTable services={filteredServices} handleEdit={handleEdit} handleDelete={handleDelete} />
                }
            </TabsContent>
            <TabsContent value="costing" className="mt-4">
                <CostingCalculator onSaveSuccess={loadItems} />
            </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{editingItem ? "Edit" : "Add New"}</DialogTitle>
          </DialogHeader>
          <PricelistForm item={editingItem} onSubmitted={handleFormSubmitted} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
