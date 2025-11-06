import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Minus,
  ShoppingCart
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClientOrderFormPage() {
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_company: '',
    special_instructions: '',
    items: []
  });
  const [pricelist, setPricelist] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const loadPricelist = async () => {
      try {
        const items = await base44.entities.PriceListItem.list();
        // Sort items alphabetically
        const sortedItems = items.sort((a, b) => a.item_name.localeCompare(b.item_name));
        setPricelist(sortedItems);
      } catch (error) {
        console.error('Error loading price list:', error);
        setError('Failed to load items. Please refresh the page.');
      }
    };
    loadPricelist();
  }, []);

  const addItemToOrder = (pricelistItem) => {
    const existingItemIndex = formData.items.findIndex(i => i.item_id === pricelistItem.id);
    
    if (existingItemIndex !== -1) {
      // Item already in order, increase quantity
      const newItems = [...formData.items];
      newItems[existingItemIndex].quantity += 1;
      setFormData({ ...formData, items: newItems });
    } else {
      // Add new item to order
      const newItem = {
        item_id: pricelistItem.id,
        item_name: pricelistItem.item_name,
        quantity: 1,
        price: pricelistItem.price_conservative || 0,
        unit: pricelistItem.unit
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }
  };

  const updateItemQuantity = (index, delta) => {
    const newItems = [...formData.items];
    const newQuantity = newItems[index].quantity + delta;
    
    if (newQuantity <= 0) {
      // Remove item if quantity would be 0 or less
      newItems.splice(index, 1);
    } else {
      newItems[index].quantity = newQuantity;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.client_phone) {
      setError("Please provide your name and contact number.");
      return;
    }
    
    if (formData.items.length === 0) {
      setError("Please add at least one item to your order.");
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Generate order number using timestamp
      const year = new Date().getFullYear();
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const generatedOrderNumber = `ORD-${year}-${timestamp}-${randomSuffix}`;

      // Create order
      await base44.entities.Order.create({
        order_number: generatedOrderNumber,
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email || null,
        client_company: formData.client_company || null,
        items: formData.items,
        total_amount: calculateTotal(),
        special_instructions: formData.special_instructions || null,
        status: 'new'
      });

      setOrderNumber(generatedOrderNumber);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit order. Please try again or contact us directly.");
      console.error('Order submission error:', err);
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
            <CardTitle className="text-2xl text-gray-900">Order Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Thank you for your order! We have received your request and will contact you shortly to confirm the details and finalize your order.
            </p>
            <div className="space-y-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
              <p><strong>Order Number:</strong> {orderNumber}</p>
              <p><strong>Total:</strong> ₱{calculateTotal().toFixed(2)}</p>
              <p><strong>Items:</strong> {formData.items.length}</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Please keep your order number for reference. We'll reach out to you at {formData.client_phone} soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MCTS</h1>
          <p className="text-gray-600">Place Your Order</p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-3xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left side - Product List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-lg border-none bg-white text-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900">Available Items & Services</CardTitle>
                <p className="text-sm text-gray-500">Click on any item to add it to your order</p>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2">
                  {pricelist.map(item => (
                    <div
                      key={item.id}
                      onClick={() => addItemToOrder(item)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {item.item_name}
                        </h3>
                        <Badge variant="outline" className="ml-2">
                          {item.category === 'item' ? 'Item' : 'Service'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description || 'No description'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">
                          ₱{item.price_conservative?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-xs text-gray-500">per {item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Order Summary & Contact Form */}
          <div className="space-y-4">
            <Card className="shadow-lg border-none bg-white text-gray-800 sticky top-4">
              <CardHeader>
                <CardTitle className="text-gray-900">Your Order</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {formData.items.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No items added yet. Click on items to add them to your order.
                      </p>
                    ) : (
                      formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.item_name}</p>
                            <p className="text-xs text-gray-500">₱{item.price.toFixed(2)} / {item.unit}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(index, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(index, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeItem(index)}
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Total */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">₱{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="font-semibold text-gray-900">Your Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_name" className="text-gray-700">Full Name *</Label>
                      <Input
                        id="client_name"
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        required
                        className="text-gray-900 bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_phone" className="text-gray-700">Contact Number *</Label>
                      <Input
                        id="client_phone"
                        value={formData.client_phone}
                        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                        required
                        className="text-gray-900 bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_email" className="text-gray-700">Email (Optional)</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                        className="text-gray-900 bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_company" className="text-gray-700">Company (Optional)</Label>
                      <Input
                        id="client_company"
                        value={formData.client_company}
                        onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                        className="text-gray-900 bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="special_instructions" className="text-gray-700">Special Instructions (Optional)</Label>
                      <Textarea
                        id="special_instructions"
                        value={formData.special_instructions}
                        onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                        className="text-gray-900 bg-gray-50"
                        rows={3}
                        placeholder="Any special requests or details..."
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || formData.items.length === 0}
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? "Submitting Order..." : "Submit Order"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}