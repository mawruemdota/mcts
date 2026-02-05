import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import OptimizedImage from "@/components/ui/OptimizedImage";

export default function KeychainPhotoForm() {
  const [clientName, setClientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [orders, setOrders] = useState([{
    keychain_type: "1_photo_same_b2b",
    photo_urls: [],
    notes: "",
    uploading: false
  }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const keychainTypes = [
    { value: "1_photo_same_b2b", label: "1 Photo (Same on both sides)", numPhotos: 1 },
    { value: "2_photos_different_b2b", label: "2 Photos (Different back-to-back)", numPhotos: 2 },
    { value: "3_photos_same_b2b", label: "3 Photos (Same set on both sides)", numPhotos: 3 },
    { value: "6_photos_different_b2b", label: "6 Photos (3 front, 3 back)", numPhotos: 6 }
  ];

  const addOrder = () => {
    setOrders([...orders, {
      keychain_type: "1_photo_same_b2b",
      photo_urls: [],
      notes: "",
      uploading: false
    }]);
  };

  const removeOrder = (index) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const updateOrder = (index, field, value) => {
    const newOrders = [...orders];
    newOrders[index][field] = value;
    if (field === "keychain_type") {
      newOrders[index].photo_urls = [];
    }
    setOrders(newOrders);
  };

  const handleFileUpload = async (index, files) => {
    const selectedType = keychainTypes.find(t => t.value === orders[index].keychain_type);
    const requiredPhotos = selectedType?.numPhotos || 1;

    if (files.length > requiredPhotos) {
      toast({
        title: "Too many photos",
        description: `This keychain type requires exactly ${requiredPhotos} photo(s)`,
        variant: "destructive"
      });
      return;
    }

    const newOrders = [...orders];
    newOrders[index].uploading = true;
    setOrders(newOrders);

    try {
      const uploadPromises = Array.from(files).map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      newOrders[index].photo_urls = [...newOrders[index].photo_urls, ...urls];
      newOrders[index].uploading = false;
      setOrders(newOrders);

      toast({
        title: "Photos uploaded",
        description: `${files.length} photo(s) uploaded successfully`
      });
    } catch (error) {
      console.error("Upload error:", error);
      newOrders[index].uploading = false;
      setOrders(newOrders);
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const removePhoto = (orderIndex, photoIndex) => {
    const newOrders = [...orders];
    newOrders[orderIndex].photo_urls = newOrders[orderIndex].photo_urls.filter((_, i) => i !== photoIndex);
    setOrders(newOrders);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientName || !contactNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and contact number",
        variant: "destructive"
      });
      return;
    }

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const selectedType = keychainTypes.find(t => t.value === order.keychain_type);
      const requiredPhotos = selectedType?.numPhotos || 1;

      if (order.photo_urls.length !== requiredPhotos) {
        toast({
          title: "Incomplete order",
          description: `Order ${i + 1} requires exactly ${requiredPhotos} photo(s)`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await base44.entities.KeychainOrder.create({
        client_name: clientName,
        contact_number: contactNumber,
        orders: orders.map(({ uploading, ...rest }) => rest),
        status: "new"
      });

      setSubmitted(true);
      toast({
        title: "Order submitted!",
        description: "We'll contact you soon to confirm your order"
      });
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you, {clientName}! We've received your keychain order and will contact you soon at {contactNumber}.
            </p>
            <Button onClick={() => {
              setSubmitted(false);
              setClientName("");
              setContactNumber("");
              setOrders([{ keychain_type: "1_photo_same_b2b", photo_urls: [], notes: "", uploading: false }]);
            }}>
              Submit Another Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Keychain Photo Order</CardTitle>
            <CardDescription>Upload your photos for custom keychains</CardDescription>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact Number *</Label>
                <Input
                  id="contact"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {orders.map((order, index) => {
            const selectedType = keychainTypes.find(t => t.value === order.keychain_type);
            const requiredPhotos = selectedType?.numPhotos || 1;
            const canUploadMore = order.photo_urls.length < requiredPhotos;

            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Order {index + 1}</CardTitle>
                  {orders.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOrder(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Keychain Type *</Label>
                    <Select
                      value={order.keychain_type}
                      onValueChange={(value) => updateOrder(index, "keychain_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {keychainTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Required: {requiredPhotos} photo{requiredPhotos > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <Label>Upload Photos ({order.photo_urls.length}/{requiredPhotos})</Label>
                    {canUploadMore && (
                      <div className="mt-2">
                        <label className="cursor-pointer">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                            {order.uploading ? (
                              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                            ) : (
                              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            )}
                            <p className="text-sm text-gray-600">
                              Click to upload {requiredPhotos - order.photo_urls.length} more photo{requiredPhotos - order.photo_urls.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple={requiredPhotos > 1}
                            className="hidden"
                            onChange={(e) => handleFileUpload(index, e.target.files)}
                            disabled={order.uploading}
                          />
                        </label>
                      </div>
                    )}

                    {order.photo_urls.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {order.photo_urls.map((url, photoIndex) => (
                          <div key={photoIndex} className="relative group">
                            <OptimizedImage
                              src={url}
                              alt={`Photo ${photoIndex + 1}`}
                              className="w-full h-32 rounded-lg border"
                              objectFit="cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index, photoIndex)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={order.notes}
                      onChange={(e) => updateOrder(index, "notes", e.target.value)}
                      placeholder="Any special instructions for this keychain?"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={addOrder}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Keychain
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Order"
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}