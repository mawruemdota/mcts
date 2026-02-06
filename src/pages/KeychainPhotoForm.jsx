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
import KeychainVisualEditor from "@/components/keychain/KeychainVisualEditor";

export default function KeychainPhotoForm() {
  const [clientName, setClientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [templates, setTemplates] = useState([]);
  const [orders, setOrders] = useState([{
    template_id: "",
    template_name: "",
    num_photos: 1,
    photo_urls: [],
    photo_margin: 4,
    photo_border_width: 0,
    photo_border_color: "#000000",
    background_color: "#FFFFFF",
    background_image: null,
    width_inches: 1,
    height_inches: 3,
    orientation: "portrait",
    photo_layout: "horizontal",
    notes: "",
    uploadingIndex: null
  }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templatesData = await base44.entities.KeychainTemplate.filter({ is_active: true });
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const addOrder = () => {
    setOrders([...orders, {
      template_id: "",
      template_name: "",
      num_photos: 1,
      photo_urls: [],
      photo_margin: 4,
      photo_border_width: 0,
      photo_border_color: "#000000",
      background_color: "#FFFFFF",
      background_image: null,
      width_inches: 1,
      height_inches: 3,
      orientation: "portrait",
      photo_layout: "horizontal",
      notes: "",
      uploadingIndex: null
    }]);
  };

  const removeOrder = (index) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const updateOrder = (index, field, value) => {
    const newOrders = [...orders];
    newOrders[index][field] = value;
    if (field === "template_id") {
      const selectedTemplate = templates.find(t => t.id === value);
      if (selectedTemplate) {
        newOrders[index] = {
          ...newOrders[index],
          template_id: value,
          template_name: selectedTemplate.template_name,
          num_photos: selectedTemplate.num_photos,
          photo_urls: [],
          photo_margin: selectedTemplate.photo_margin,
          photo_border_width: selectedTemplate.photo_border_width,
          photo_border_color: selectedTemplate.photo_border_color,
          background_color: selectedTemplate.background_color,
          background_image: selectedTemplate.background_image,
          width_inches: selectedTemplate.width_inches,
          height_inches: selectedTemplate.height_inches,
          orientation: selectedTemplate.orientation,
          photo_layout: selectedTemplate.photo_layout || "horizontal"
        };
      }
    }
    setOrders(newOrders);
  };

  const handleFileUpload = (index, photoSlotIndex, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newOrders = [...orders];
      newOrders[index].photo_urls[photoSlotIndex] = reader.result; // Store as Data URL for local display only
      newOrders[index].uploadingIndex = null;
      setOrders(newOrders);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (orderIndex, photoIndex) => {
    const newOrders = [...orders];
    newOrders[orderIndex].photo_urls[photoIndex] = null;
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
      const requiredPhotos = order.num_photos || 1;

      const uploadedPhotos = order.photo_urls.filter(url => url).length;
      if (uploadedPhotos !== requiredPhotos) {
        toast({
          title: "Incomplete order",
          description: `Order ${i + 1} requires ${requiredPhotos} photo(s), but only ${uploadedPhotos} uploaded`,
          variant: "destructive"
        });
        return;
      }

      if (!order.template_id) {
        toast({
          title: "Missing information",
          description: `Please select a template for Order ${i + 1}`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Generate images for each order first
      const images = [];
      const ordersWithImages = [];
      
      for (let orderIndex = 0; orderIndex < orders.length; orderIndex++) {
        const order = orders[orderIndex];
        const cleanOrder = {
          ...order,
          photo_urls: order.photo_urls.filter(url => url)
        };
        delete cleanOrder.uploadingIndex;
        try {
          const canvas = document.createElement('canvas');
          const dpi = 300;
          const width = order.width_inches * dpi;
          const height = order.height_inches * dpi;
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Background
          if (order.background_image) {
            const bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            await new Promise((resolve) => {
              bgImg.onload = () => {
                ctx.drawImage(bgImg, 0, 0, width, height);
                resolve();
              };
              bgImg.src = order.background_image;
            });
          } else {
            ctx.fillStyle = order.background_color || '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          // Calculate photo layout
          const margin = order.photo_margin * (dpi / 96);
          const numPhotos = order.num_photos;
          const isVertical = order.photo_layout === "vertical";
          
          let photoWidth, photoHeight, cols, rows;
          
          if (isVertical) {
            cols = 1;
            rows = numPhotos;
            photoWidth = width - (margin * 2);
            photoHeight = (height - (margin * (rows + 1))) / rows;
          } else {
            if (numPhotos === 1) { cols = 1; rows = 1; }
            else if (numPhotos === 2) { cols = 2; rows = 1; }
            else if (numPhotos === 3) { cols = 3; rows = 1; }
            else if (numPhotos === 4) { cols = 2; rows = 2; }
            else if (numPhotos === 6) { cols = 3; rows = 2; }
            else { cols = 2; rows = Math.ceil(numPhotos / 2); }
            
            photoWidth = (width - (margin * (cols + 1))) / cols;
            photoHeight = (height - (margin * (rows + 1))) / rows;
          }

          // Draw photos
          for (let i = 0; i < order.photo_urls.length; i++) {
            const photoUrl = order.photo_urls[i];
            if (!photoUrl) continue;

            const col = isVertical ? 0 : i % cols;
            const row = isVertical ? i : Math.floor(i / cols);
            
            const x = margin + (col * (photoWidth + margin));
            const y = margin + (row * (photoHeight + margin));

            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve) => {
              img.onload = () => {
                if (order.photo_border_width > 0) {
                  ctx.fillStyle = order.photo_border_color || '#000000';
                  const borderPx = order.photo_border_width * (dpi / 96);
                  ctx.fillRect(x - borderPx, y - borderPx, photoWidth + borderPx * 2, photoHeight + borderPx * 2);
                }
                
                ctx.drawImage(img, x, y, photoWidth, photoHeight);
                resolve();
              };
              img.src = photoUrl;
            });
          }

          const dataUrl = canvas.toDataURL('image/png');
          
          // Convert data URL to blob and upload
          const blob = await fetch(dataUrl).then(res => res.blob());
          const file = new File([blob], `keychain-${orderIndex + 1}.png`, { type: 'image/png' });
          const uploadResult = await base44.integrations.Core.UploadFile({ file });
          
          images.push({ 
            template: cleanOrder.template_name,
            dataUrl,
            fileUrl: uploadResult.file_url
          });
          
          ordersWithImages.push({
            ...cleanOrder,
            photo_urls: [], // Individual photos are not stored in the database
            generated_image_url: uploadResult.file_url
          });
        } catch (imgError) {
          console.error("Error generating image:", imgError);
          ordersWithImages.push({
            ...cleanOrder,
            photo_urls: [], // Individual photos are not stored in the database
            generated_image_url: null // No generated image on error
          });
        }
      }

      await base44.entities.KeychainOrder.create({
        client_name: clientName,
        contact_number: contactNumber,
        orders: ordersWithImages,
        status: "new"
      });

      setGeneratedImages(images);
      setSubmitted(true);
      toast({
        title: "Order submitted!",
        description: "Your keychain designs are ready for download"
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

  const downloadImage = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Order Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Thank you, {clientName}! We've received your keychain order and will contact you soon at {contactNumber}.
              </p>
            </div>

            {generatedImages.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg">Your Keychain Designs:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((img, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-sm">{img.template}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <img src={img.dataUrl} alt={`Keychain ${idx + 1}`} className="w-full border rounded mb-3" />
                        <Button 
                          onClick={() => downloadImage(img.dataUrl, `keychain-${idx + 1}-${img.template}.png`)}
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        >
                          Download Design
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Button onClick={() => {
                setSubmitted(false);
                setClientName("");
                setContactNumber("");
                setGeneratedImages([]);
                setOrders([{ 
                  template_id: "",
                  template_name: "",
                  num_photos: 1,
                  photo_urls: [],
                  photo_margin: 4,
                  photo_border_width: 0,
                  photo_border_color: "#000000",
                  background_color: "#FFFFFF",
                  background_image: null,
                  width_inches: 1,
                  height_inches: 3,
                  orientation: "portrait",
                  photo_layout: "horizontal",
                  notes: "", 
                  uploadingIndex: null 
                }]);
              }}>
                Submit Another Order
              </Button>
            </div>
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
            const requiredPhotos = order.num_photos || 1;

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
                    <Label>Select Template *</Label>
                    <Select
                      value={order.template_id}
                      onValueChange={(value) => updateOrder(index, "template_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a keychain template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.template_name} ({template.num_photos} photos, {template.width_inches}" × {template.height_inches}")
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {order.template_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {templates.find(t => t.id === order.template_id)?.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Upload Photos ({requiredPhotos} needed)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {Array.from({ length: requiredPhotos }).map((_, photoIndex) => (
                        <div key={photoIndex} className="relative">
                          {order.photo_urls[photoIndex] ? (
                            <div className="relative group">
                              <OptimizedImage
                                src={order.photo_urls[photoIndex]}
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
                          ) : (
                            <label className="cursor-pointer block">
                              <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center hover:border-blue-500 transition-colors">
                                {order.uploadingIndex === photoIndex ? (
                                  <Loader2 className="w-6 h-6 mb-1 animate-spin text-blue-500" />
                                ) : (
                                  <Upload className="w-6 h-6 mb-1 text-gray-400" />
                                )}
                                <p className="text-xs text-gray-600">Photo {photoIndex + 1}</p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(index, photoIndex, e.target.files[0])}
                                disabled={order.uploadingIndex !== null}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.template_id && (
                    <KeychainVisualEditor
                      numPhotos={requiredPhotos}
                      photoUrls={order.photo_urls}
                      backgroundColor={order.background_color}
                      onBackgroundColorChange={(color) => updateOrder(index, "background_color", color)}
                      backgroundImage={order.background_image}
                      onBackgroundImageChange={(url) => updateOrder(index, "background_image", url)}
                      photoBorderWidth={order.photo_border_width}
                      onPhotoBorderWidthChange={() => {}}
                      photoBorderColor={order.photo_border_color}
                      onPhotoBorderColorChange={() => {}}
                      photoMargin={order.photo_margin}
                      onPhotoMarginChange={() => {}}
                      orientation={order.orientation}
                      widthInches={order.width_inches}
                      heightInches={order.height_inches}
                      photoLayout={order.photo_layout}
                      onPhotoLayoutChange={() => {}}
                    />
                  )}

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