import React, { useState, useEffect } from "react";
import { Quotation, PriceListItem, Client } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileQuestion,
  Plus,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function CreateQuotationPage() {
  const [formData, setFormData] = useState({
    client_id: '',
    items: [{ item_id: '', quantity: 1 }],
    discount_amount: 0,
    notes: ''
  });
  const [clients, setClients] = useState([]);
  const [pricelist, setPricelist] = useState([]);
  const [quote, setQuote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clientsData, pricelistData] = await Promise.all([
      Client.list(),
      PriceListItem.list()
    ]);
    setClients(clientsData);
    setPricelist(pricelistData);
  };

  useEffect(() => {
    const calculateQuote = () => {
      let subtotal = 0;
      formData.items.forEach(item => {
        const pricelistItem = pricelist.find(p => p.id === item.item_id);
        if (pricelistItem) {
          subtotal += pricelistItem.price * item.quantity;
        }
      });
      
      const total = subtotal - formData.discount_amount;
      setQuote({ subtotal, total });
    };
    if (pricelist.length > 0) calculateQuote();
  }, [formData, pricelist]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({...prev, items: [...prev.items, { item_id: '', quantity: 1 }]}));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id || formData.items.some(i => !i.item_id)) {
      toast({ variant: "destructive", title: "Error", description: "Please select a client and at least one item." });
      return;
    }
    
    setIsSubmitting(true);
    const generatedId = `QU-${Date.now().toString().slice(-6)}`;
    const selectedClient = clients.find(c => c.id === formData.client_id);

    const itemsForSubmission = formData.items.map(item => {
      const pricelistItem = pricelist.find(p => p.id === item.item_id);
      return {
        item_id: item.item_id,
        item_name: pricelistItem.item_name,
        quantity: Number(item.quantity),
        price: pricelistItem.price
      }
    });

    try {
      await Quotation.create({
        quotation_id: generatedId,
        client_info: {
          name: selectedClient.client_name,
          phone: selectedClient.phone_number,
          email: selectedClient.email
        },
        items: itemsForSubmission,
        subtotal: quote.subtotal,
        discount_amount: formData.discount_amount,
        total_price: quote.total,
        status: 'pending_review'
      });
      
      toast({ title: "Success", description: `Quotation ${generatedId} created successfully.` });
      
      // Reset form
      setFormData({
        client_id: '',
        items: [{ item_id: '', quantity: 1 }],
        discount_amount: 0,
        notes: ''
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create quotation." });
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <FileQuestion className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Quotation</h1>
            <p className="text-muted-foreground">Generate a quote for a client</p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>New Quotation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Select Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
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
                <Label>Items & Services</Label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-end gap-2 mb-2">
                    <div className="flex-grow">
                      <Select 
                        value={item.item_id} 
                        onValueChange={value => handleItemChange(index, 'item_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pricelist.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.item_name} (₱{p.price}/{p.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                        className="w-24"
                        placeholder="Qty"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => removeItem(index)}
                    >
                      <X className="w-4 h-4"/>
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2"/>Add Item
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <Label>Discount Amount (₱)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={formData.discount_amount} 
                    onChange={e => setFormData({...formData, discount_amount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                {quote && (
                  <div className="text-right space-y-2">
                    <p>Subtotal: ₱{quote.subtotal.toFixed(2)}</p>
                    {formData.discount_amount > 0 && (
                      <p className="text-green-600">Discount: -₱{formData.discount_amount.toFixed(2)}</p>
                    )}
                    <p className="text-xl font-bold">Total: ₱{quote.total.toFixed(2)}</p>
                  </div>
                )}
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Create Quotation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}