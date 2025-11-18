import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Minus,
  Search,
  Tag,
  Shield,
  Home
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createPageUrl } from "@/utils";

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
  const [discountCodes, setDiscountCodes] = useState([]);
  const [appliedCode, setAppliedCode] = useState(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [homepageContent, setHomepageContent] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState('');
  const recaptchaRef = useRef(null);

  // Load Google reCAPTCHA script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Make callback available globally
    window.onRecaptchaSuccess = (token) => {
      setRecaptchaToken(token);
      setRecaptchaError('');
    };

    window.onRecaptchaExpired = () => {
      setRecaptchaToken(null);
      setRecaptchaError('CAPTCHA expired. Please verify again.');
    };

    return () => {
      document.body.removeChild(script);
      delete window.onRecaptchaSuccess;
      delete window.onRecaptchaExpired;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [items, codes, contentData] = await Promise.all([
          base44.entities.PriceListItem.list(),
          base44.entities.DiscountCode.filter({ is_active: true }),
          base44.entities.HomePageContent.list()
        ]);
        const sortedItems = items.sort((a, b) => a.item_name.localeCompare(b.item_name));
        setPricelist(sortedItems);
        setDiscountCodes(codes);
        if (contentData.length > 0) {
          setHomepageContent(contentData[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load items. Please refresh the page.');
      }
    };
    loadData();
  }, []);

  const heroBackground = homepageContent?.hero_background_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/6e687ce1e_bg.png';

  const applyPromoCode = () => {
    setPromoCodeError('');
    const code = discountCodes.find((c) => c.code.toUpperCase() === promoCodeInput.toUpperCase());

    if (!code) {
      setPromoCodeError('Invalid promo code');
      return;
    }

    setAppliedCode(code);
    setPromoCodeError('');

    const updatedItems = formData.items.map((item) => {
      const pricelistItem = pricelist.find((p) => p.id === item.item_id);
      if (!pricelistItem) return item;

      let newPrice;
      if (code.type === 'aggressive_pricing') {
        newPrice = pricelistItem.price_aggressive || pricelistItem.price_conservative;
      } else {
        newPrice = pricelistItem.price_conservative;
      }

      return { ...item, price: newPrice };
    });

    setFormData({ ...formData, items: updatedItems });
  };

  const removePromoCode = () => {
    setAppliedCode(null);
    setPromoCodeInput('');
    setPromoCodeError('');

    const updatedItems = formData.items.map((item) => {
      const pricelistItem = pricelist.find((p) => p.id === item.item_id);
      if (!pricelistItem) return item;
      return { ...item, price: pricelistItem.price_conservative };
    });

    setFormData({ ...formData, items: updatedItems });
  };

  const addItemToOrder = (pricelistItem) => {
    const existingItemIndex = formData.items.findIndex((i) => i.item_id === pricelistItem.id);

    let itemPrice;
    if (appliedCode && appliedCode.type === 'aggressive_pricing') {
      itemPrice = pricelistItem.price_aggressive || pricelistItem.price_conservative;
    } else {
      itemPrice = pricelistItem.price_conservative;
    }

    if (existingItemIndex !== -1) {
      const newItems = [...formData.items];
      newItems[existingItemIndex].quantity += 1;
      setFormData({ ...formData, items: newItems });
    } else {
      const newItem = {
        item_id: pricelistItem.id,
        item_name: pricelistItem.item_name,
        quantity: 1,
        price: itemPrice,
        unit: pricelistItem.unit
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }
  };

  const updateItemQuantity = (index, delta) => {
    const newItems = [...formData.items];
    const newQuantity = newItems[index].quantity + delta;

    if (newQuantity <= 0) {
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

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!appliedCode) return 0;
    
    const subtotal = calculateSubtotal();
    
    switch(appliedCode.type) {
      case 'percentage_off':
        return subtotal * (appliedCode.value / 100);
      case 'fixed_amount':
        return Math.min(appliedCode.value, subtotal);
      case 'aggressive_pricing':
        return 0;
      default:
        return 0;
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
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

    if (!recaptchaToken) {
      setRecaptchaError("Please complete the security verification.");
      setError("Please complete the security verification to submit your order.");
      return;
    }

    setIsSubmitting(true);
    setError('');
    setRecaptchaError('');

    try {
      const year = new Date().getFullYear();
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const generatedOrderNumber = `ORD-${year}-${timestamp}-${randomSuffix}`;

      await base44.entities.Order.create({
        order_number: generatedOrderNumber,
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email || null,
        client_company: formData.client_company || null,
        items: formData.items,
        total_amount: calculateTotal(),
        special_instructions: formData.special_instructions || null,
        promo_code: appliedCode ? appliedCode.code : null,
        status: 'new'
      });

      setOrderNumber(generatedOrderNumber);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit order. Please try again or contact us directly.");
      console.error('Order submission error:', err);
      // Reset reCAPTCHA on error
      if (window.grecaptcha) {
        window.grecaptcha.reset();
        setRecaptchaToken(null);
      }
    }

    setIsSubmitting(false);
  };

  if (submitted) {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const total = calculateTotal();
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-2xl bg-white">
          <CardHeader>
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Order Submitted!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Thank you! We have received your order request and will contact you shortly to finalize the details.
            </p>
            <div className="space-y-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
              <p><strong>Order Number:</strong> {orderNumber}</p>
              <p><strong>Total:</strong> ₱{total.toFixed(2)}</p>
              <p><strong>Items:</strong> {formData.items.length}</p>
              {appliedCode && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-green-600 font-medium">
                    <strong>Promo Applied:</strong> {appliedCode.code}
                  </p>
                  {discount > 0 && (
                    <p className="text-green-600">You saved ₱{discount.toFixed(2)}!</p>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Please keep your order number for reference. We'll reach out to you at {formData.client_phone} soon.
            </p>
            <div className="mt-6 space-y-2">
              <a href={createPageUrl('OrderTracking')} className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Track Your Order
                </Button>
              </a>
              <a href={createPageUrl('Home')} className="block">
                <Button variant="outline" className="w-full">
                  Back to Homepage
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount();
  const total = calculateTotal();

  const filteredItems = pricelist.filter((item) =>
  item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemProducts = filteredItems.filter((item) => item.category === 'item');
  const itemServices = filteredItems.filter((item) => item.category === 'service');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Load reCAPTCHA Script */}
      <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Place Your Order</h1>
            <p className="text-sm text-gray-600">Select items and submit your order request</p>
          </div>
          <a href={createPageUrl('Home')}>
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Back to Homepage
            </Button>
          </a>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {error &&
          <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          }

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left side - Product/Service List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="shadow-lg border-none bg-white text-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900">Available Items & Services</CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10" />

                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="products" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="products">Products ({itemProducts.length})</TabsTrigger>
                      <TabsTrigger value="services">Services ({itemServices.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="products" className="mt-4">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itemProducts.map((item) =>
                            <TableRow key={item.id} className="cursor-pointer hover:bg-blue-50" onClick={() => addItemToOrder(item)}>
                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                <TableCell className="text-sm text-gray-600">{item.description || 'No description'}</TableCell>
                                <TableCell className="text-right">
                                  <div className="font-bold text-blue-600">₱{item.price_conservative?.toFixed(2) || '0.00'}</div>
                                  <div className="text-xs text-gray-500">per {item.unit}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" onClick={(e) => {e.stopPropagation();addItemToOrder(item);}}>
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        {itemProducts.length === 0 &&
                        <p className="text-center text-gray-500 py-8">No products found</p>
                        }
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="services" className="mt-4">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Service Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itemServices.map((item) =>
                            <TableRow key={item.id} className="cursor-pointer hover:bg-blue-50" onClick={() => addItemToOrder(item)}>
                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                <TableCell className="text-sm text-gray-600">{item.description || 'No description'}</TableCell>
                                <TableCell className="text-right">
                                  <div className="font-bold text-blue-600">₱{item.price_conservative?.toFixed(2) || '0.00'}</div>
                                  <div className="text-xs text-gray-500">per {item.unit}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" onClick={(e) => {e.stopPropagation();addItemToOrder(item);}} className="bg-[#2053E6] text-slate-50 px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground h-8">
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        {itemServices.length === 0 &&
                        <p className="text-center text-gray-500 py-8">No services found</p>
                        }
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Right side - Order Summary & Contact Form */}
            <div className="space-y-4">
              <Card className="shadow-lg border-none bg-white text-gray-800 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-gray-900">Your Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {formData.items.length === 0 ?
                      <p className="text-sm text-gray-500 text-center py-4">
                          No items added yet. Click on items to add them to your order.
                        </p> :

                      formData.items.map((item, index) =>
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
                            onClick={() => updateItemQuantity(index, -1)}>

                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                              <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateItemQuantity(index, 1)}>

                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeItem(index)}>

                                <X className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                      )
                      }
                    </div>

                    {/* Promo Code Section */}
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Promo Code
                        </Label>
                        <span className="text-xs text-gray-500">(One code per order)</span>
                      </div>
                      {!appliedCode ?
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter code"
                              value={promoCodeInput}
                              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                              className="flex-1 uppercase"
                            />
                            <Button type="button" size="sm" onClick={applyPromoCode} className="bg-blue-600 hover:bg-blue-700">
                              Apply
                            </Button>
                          </div>
                          {promoCodeError &&
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {promoCodeError}
                            </p>
                          }
                        </div> :
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-800">{appliedCode.code}</p>
                              <p className="text-xs text-green-700">
                                {appliedCode.type === 'aggressive_pricing' 
                                  ? 'Special pricing applied' 
                                  : appliedCode.type === 'percentage_off'
                                  ? `${appliedCode.value}% off`
                                  : `₱${appliedCode.value} off`}
                              </p>
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={removePromoCode} className="hover:bg-red-100">
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      }
                    </div>

                    {/* Total */}
                    <div className="pt-3 border-t-2 border-gray-200 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 &&
                        <div className="flex justify-between text-sm bg-green-50 px-2 py-1 rounded">
                          <span className="text-green-700 font-medium">Discount ({appliedCode?.code}):</span>
                          <span className="text-green-700 font-bold">-₱{discount.toFixed(2)}</span>
                        </div>
                      }
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-900 text-lg">Total Amount:</span>
                        <div className="text-right">
                          {discount > 0 && (
                            <p className="text-xs text-gray-500 line-through">₱{subtotal.toFixed(2)}</p>
                          )}
                          <p className="text-2xl font-bold text-blue-600">₱{total.toFixed(2)}</p>
                          {discount > 0 && (
                            <p className="text-xs text-green-600 font-medium">You save ₱{discount.toFixed(2)}!</p>
                          )}
                        </div>
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

                    {/* Security Verification */}
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Security Verification</h3>
                      </div>
                      <div className="flex justify-center">
                        <div 
                          className="g-recaptcha" 
                          data-sitekey="6LegRBAsAAAAAOG6SQbS96zG3vPGQeh-TubAOwy6"
                          data-callback="onRecaptchaSuccess"
                          data-expired-callback="onRecaptchaExpired"
                          ref={recaptchaRef}
                        ></div>
                      </div>
                      {recaptchaError && (
                        <p className="text-xs text-red-500 flex items-center gap-1 justify-center">
                          <AlertTriangle className="w-3 h-3" />
                          {recaptchaError}
                        </p>
                      )}
                      {recaptchaToken && (
                        <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Verified successfully</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 text-center">
                        This helps us prevent automated spam orders
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || formData.items.length === 0 || !recaptchaToken}
                      className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">

                      {isSubmitting ? "Submitting Order..." : "Submit Order"}
                    </Button>
                    
                    {!recaptchaToken && formData.items.length > 0 && (
                      <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Please complete the security verification above
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}