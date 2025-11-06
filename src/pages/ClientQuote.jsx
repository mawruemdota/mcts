
import React, { useState, useEffect } from "react";
import { Quotation, PriceListItem } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  X,
  Plus
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClientQuotePage() {
  const [formData, setFormData] = useState({
    client_info: { name: '', phone: '', email: '' },
    items: [{ item_id: '', quantity: 1 }],
    promo_code: ''
  });
  const [pricelist, setPricelist] = useState([]);
  const [quote, setQuote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [quotationId, setQuotationId] = useState('');

  useEffect(() => {
    const loadPricelist = async () => {
        const items = await PriceListItem.list();
        setPricelist(items);
    };
    loadPricelist();
  }, []);

  useEffect(() => {
    const calculateQuote = () => {
        let subtotal = 0;
        formData.items.forEach(item => {
            const pricelistItem = pricelist.find(p => p.id === item.item_id);
            if (pricelistItem) {
                subtotal += pricelistItem.price * item.quantity;
            }
        });
        
        const discount = formData.promo_code === 'DISCOUNT10' ? subtotal * 0.1 : 0;
        const total = subtotal - discount;

        setQuote({ subtotal, discount, total });
    };
    if(pricelist.length > 0) calculateQuote();
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
    if (!formData.client_info.name || !formData.client_info.phone || formData.items.some(i => !i.item_id)) {
        setError("Please fill in your name, phone, and select at least one item.");
        return;
    }
    
    setIsSubmitting(true);
    
    const year = new Date().getFullYear();
    const allQuotes = await Quotation.list();
    const yearQuotes = allQuotes.filter(q => q.quotation_id?.startsWith(`MCTSQ-${year}`));
    const maxNum = yearQuotes.reduce((max, q) => {
        const parts = q.quotation_id.split('-');
        if (parts.length === 3 && parts[0] === 'MCTSQ' && parseInt(parts[1], 10) === year) {
            const num = parseInt(parts[2], 10);
            return num > max ? num : max;
        }
        return max;
    }, 0);
    const newNum = maxNum + 1;
    const generatedId = `MCTSQ-${year}-${String(newNum).padStart(5, '0')}`;

    const itemsForSubmission = formData.items.map(item => {
        const pricelistItem = pricelist.find(p => p.id === item.item_id);
        return {
            item_id: item.item_id,
            item_name: pricelistItem ? pricelistItem.item_name : 'Unknown Item', // Fallback for item_name
            quantity: Number(item.quantity),
            price: pricelistItem ? pricelistItem.price : 0 // Fallback for price
        }
    }).filter(item => item.item_id);

    try {
        await Quotation.create({
            quotation_id: generatedId,
            client_info: formData.client_info,
            items: itemsForSubmission,
            subtotal: quote.subtotal,
            discount_amount: quote.discount,
            promo_code: formData.promo_code,
            total_price: quote.total,
            status: 'pending_review'
        });
        setQuotationId(generatedId);
        setSubmitted(true);
    } catch (err) {
        setError("Failed to submit quotation. Please try again.");
        console.error(err);
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-lg bg-white">
          <CardHeader>
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Request Submitted!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Thank you! We have received your quotation request and will contact you shortly to finalize the details.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p><strong>Quotation ID:</strong> {quotationId}</p>
              <p><strong>Total:</strong> ₱{quote?.total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MCTS</h1>
          <p className="text-gray-600">Instant Quote Maker</p>
        </div>
        
        <Card className="shadow-lg border-none bg-white text-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900">Quote Maker</CardTitle>
              <p className="text-gray-500">Select items and get instant pricing</p>
            </CardHeader>
            <CardContent>
                {error && <Alert variant="destructive" className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-900">Your Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div><Label className="text-gray-700">Full Name *</Label><Input className="text-gray-900 bg-gray-50" value={formData.client_info.name} onChange={e => setFormData({...formData, client_info: {...formData.client_info, name: e.target.value}})} required/></div>
                            <div><Label className="text-gray-700">Phone Number *</Label><Input className="text-gray-900 bg-gray-50" value={formData.client_info.phone} onChange={e => setFormData({...formData, client_info: {...formData.client_info, phone: e.target.value}})} required/></div>
                        </div>
                        <div className="mt-4"><Label className="text-gray-700">Email (Optional)</Label><Input type="email" className="text-gray-900 bg-gray-50" value={formData.client_info.email} onChange={e => setFormData({...formData, client_info: {...formData.client_info, email: e.target.value}})}/></div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-900">Select Items & Services</h3>
                        {formData.items.map((item, index) => {
                          const selectedItem = pricelist.find(p => p.id === item.item_id);
                          const itemTotal = selectedItem ? selectedItem.price * item.quantity : 0;
                          
                          return (
                            <div key={index} className="flex items-end gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex-grow">
                                    <Label className="text-gray-700">Item/Service</Label>
                                    <select 
                                      value={item.item_id} 
                                      onChange={e => handleItemChange(index, 'item_id', e.target.value)} 
                                      className="w-full p-2 border rounded-md bg-white text-gray-900"
                                      required
                                    >
                                        <option value="">Select an item...</option>
                                        {pricelist.map(p => <option key={p.id} value={p.id}>{p.item_name} - ₱{p.price}/{p.unit}</option>)}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <Label className="text-gray-700">Quantity</Label>
                                    <Input type="number" min="1" className="text-gray-900 bg-white" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required/>
                                </div>
                                <div className="w-28 text-right">
                                    <Label className="text-gray-700">Subtotal</Label>
                                    <div className="font-bold text-lg text-gray-900">₱{itemTotal.toFixed(2)}</div>
                                </div>
                                {formData.items.length > 1 && (
                                  <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}><X className="w-4 h-4"/></Button>
                                )}
                            </div>
                          );
                        })}
                         <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2"/>Add another item</Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                             <Label className="text-gray-700">Promo Code (Optional)</Label>
                             <Input placeholder="Enter promo code" className="text-gray-900 bg-gray-50" value={formData.promo_code} onChange={e => setFormData({...formData, promo_code: e.target.value})}/>
                             <p className="text-xs text-gray-500 mt-1">Try "DISCOUNT10" for 10% off</p>
                        </div>
                        {quote && (
                            <div className="text-right space-y-2 text-gray-800">
                                <p>Subtotal: ₱{quote.subtotal.toFixed(2)}</p>
                                {quote.discount > 0 && <p className="text-green-600">Discount: -₱{quote.discount.toFixed(2)}</p>}
                                <p className="text-2xl font-bold text-blue-600">Total: ₱{quote.total.toFixed(2)}</p>
                            </div>
                        )}
                    </div>
                    
                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? "Submitting..." : "Submit to MCTS"}
                    </Button>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
