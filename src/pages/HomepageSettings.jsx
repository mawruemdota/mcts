import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, Trash2, Plus, Image as ImageIcon, ArrowUp, ArrowDown, Phone, Mail, MapPin, Facebook, Instagram, Save, RefreshCw, ExternalLink, Video, Link2 } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HomepageSettings() {
  const [homepageContent, setHomepageContent] = useState(null);
  const [originalHomepageContent, setOriginalHomepageContent] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [notableClients, setNotableClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const defaultServices = [
    {
      title: 'digital printing',
      description: 'High-quality tarpaulins, stickers, banners, and large format printing for all your business needs.',
      image_url: '',
      icon_name: 'Printer',
      icon_color: 'bg-blue-500',
      order: 0
    },
    {
      title: 'business cards & ids',
      description: 'Professional business cards, calling cards, and employee ID printing with quick turnaround.',
      image_url: '',
      icon_name: 'CreditCard',
      icon_color: 'bg-blue-500',
      order: 1
    },
    {
      title: 'promotional materials',
      description: 'Eye-catching flyers, brochures, invitations, and marketing materials to boost your brand.',
      image_url: '',
      icon_name: 'FileText',
      icon_color: 'bg-blue-500',
      order: 2
    },
    {
      title: 'creative design',
      description: 'Expert graphic design services, social media content creation, and brand identity development.',
      image_url: '',
      icon_name: 'Palette',
      icon_color: 'bg-pink-500',
      order: 3
    },
    {
      title: 'creative tech solutions',
      description: 'Cutting-edge augmented reality solutions to make your marketing campaigns truly interactive.',
      image_url: '',
      icon_name: 'Sparkles',
      icon_color: 'bg-orange-500',
      order: 4
    },
    {
      title: 'rush orders',
      description: 'Need it fast? We offer rush services to meet your urgent deadlines without compromising quality.',
      image_url: '',
      icon_name: 'Zap',
      icon_color: 'bg-red-500',
      order: 5
    }
  ];

  const iconOptions = [
    'Printer', 'CreditCard', 'FileText', 'Palette', 'Sparkles', 'Zap', 
    'Package', 'Image', 'Mail', 'Phone', 'Camera', 'Video', 'Music'
  ];

  const colorOptions = [
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-pink-500', label: 'Pink' },
    { value: 'bg-orange-500', label: 'Orange' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-yellow-500', label: 'Yellow' },
    { value: 'bg-indigo-500', label: 'Indigo' }
  ];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contentData, galleryData, clientsData] = await Promise.all([
        base44.entities.HomePageContent.list(),
        base44.entities.GalleryImage.list(),
        base44.entities.NotableClient.list()
      ]);
      
      if (contentData.length > 0) {
        const content = contentData[0];
        // Ensure homepage_services exists and has 6 items
        if (!content.homepage_services || content.homepage_services.length === 0) {
          content.homepage_services = defaultServices;
        }
        // Ensure custom_social_links exists
        if (!content.custom_social_links) {
          content.custom_social_links = [];
        }
        setHomepageContent(content);
        setOriginalHomepageContent(content);
      } else {
        // Create default entry
        const defaultContent = await base44.entities.HomePageContent.create({
          hero_title: 'your ideas to impact',
          hero_subtitle: 'From creative design to printable outputs, kami ang bahala sa inyo!',
          hero_background_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/6e687ce1e_bg.png',
          pattern_background_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/ad1abef0a_pattern2.png',
          main_logo_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a7205f4bc/7aad79b47_logo3.png',
          services_section_title: 'Designed to help you with your creative needs',
          services_section_subtitle: 'basta creative execution, pagusapan natin',
          homepage_services: defaultServices,
          contact_phone: '0977 827 0150',
          contact_email: 'marasigancts@gmail.com',
          contact_location: 'Dasmarinas, Cavite',
          facebook_url: 'https://facebook.com/marasigancts',
          instagram_url: 'https://www.instagram.com/marasigancts',
          tiktok_url: '',
          custom_social_links: [],
          company_description: 'Professional printing and design solutions for businesses of all sizes.'
        });
        setHomepageContent(defaultContent);
        setOriginalHomepageContent(defaultContent);
      }
      
      setGalleryImages(galleryData.sort((a, b) => a.order - b.order));
      setNotableClients(clientsData.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load homepage settings.' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (homepageContent && originalHomepageContent) {
      const hasChanges = JSON.stringify(homepageContent) !== JSON.stringify(originalHomepageContent);
      setHasUnsavedChanges(hasChanges);
    }
  }, [homepageContent, originalHomepageContent]);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setHomepageContent(prev => ({ ...prev, [field]: file_url }));
      toast({ title: 'Success', description: 'Image uploaded! Click "Save Changes" to apply.' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload image.' });
    }
    setUploadingField(null);
  };

  const uploadServiceImage = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingField(`service-${index}`);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newServices = [...homepageContent.homepage_services];
      newServices[index].image_url = file_url;
      setHomepageContent(prev => ({ ...prev, homepage_services: newServices }));
      toast({ title: 'Success', description: 'Service image uploaded! Click "Save Changes" to apply.' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload image.' });
    }
    setUploadingField(null);
  };

  const updateServiceField = (index, field, value) => {
    const newServices = [...homepageContent.homepage_services];
    newServices[index][field] = value;
    setHomepageContent(prev => ({ ...prev, homepage_services: newServices }));
  };

  const addCustomSocialLink = () => {
    const currentLinks = homepageContent.custom_social_links || [];
    setHomepageContent(prev => ({
      ...prev,
      custom_social_links: [...currentLinks, { name: '', url: '' }]
    }));
  };

  const updateCustomSocialLink = (index, field, value) => {
    const newLinks = [...(homepageContent.custom_social_links || [])];
    newLinks[index][field] = value;
    setHomepageContent(prev => ({ ...prev, custom_social_links: newLinks }));
  };

  const removeCustomSocialLink = (index) => {
    const newLinks = (homepageContent.custom_social_links || []).filter((_, i) => i !== index);
    setHomepageContent(prev => ({ ...prev, custom_social_links: newLinks }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await base44.entities.HomePageContent.update(homepageContent.id, homepageContent);
      setOriginalHomepageContent(homepageContent);
      setHasUnsavedChanges(false);
      toast({ title: 'Success', description: 'All changes saved successfully!' });
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes.' });
    }
    setIsSaving(false);
  };

  const handleDiscardChanges = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
      setHomepageContent({ ...originalHomepageContent });
      toast({ title: 'Changes Discarded', description: 'All unsaved changes have been reverted.' });
    }
  };

  const addGalleryImage = async () => {
    try {
      const newImage = await base44.entities.GalleryImage.create({
        image_url: '',
        caption: '',
        order: galleryImages.length,
        is_active: true
      });
      setGalleryImages([...galleryImages, newImage]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add gallery image.' });
    }
  };

  const uploadGalleryImage = async (imageId, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.GalleryImage.update(imageId, { image_url: file_url });
      setGalleryImages(prev => prev.map(img => img.id === imageId ? { ...img, image_url: file_url } : img));
      toast({ title: 'Success', description: 'Gallery image uploaded!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload image.' });
    }
  };

  const updateGalleryImage = async (imageId, field, value) => {
    try {
      await base44.entities.GalleryImage.update(imageId, { [field]: value });
      setGalleryImages(prev => prev.map(img => img.id === imageId ? { ...img, [field]: value } : img));
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const deleteGalleryImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await base44.entities.GalleryImage.delete(imageId);
      setGalleryImages(prev => prev.filter(img => img.id !== imageId));
      toast({ title: 'Success', description: 'Image deleted.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete image.' });
    }
  };

  const moveGalleryImage = async (imageId, direction) => {
    const currentIndex = galleryImages.findIndex(img => img.id === imageId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === galleryImages.length - 1)
    ) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newImages = [...galleryImages];
    [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];

    try {
      await Promise.all(
        newImages.map((img, idx) => 
          base44.entities.GalleryImage.update(img.id, { order: idx })
        )
      );
      setGalleryImages(newImages.map((img, idx) => ({ ...img, order: idx })));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reorder images.' });
    }
  };

  // Notable Clients Functions
  const addNotableClient = async () => {
    try {
      const newClient = await base44.entities.NotableClient.create({
        client_name: '',
        logo_url: '',
        website_url: '',
        order: notableClients.length,
        is_active: true
      });
      setNotableClients([...notableClients, newClient]);
      toast({ title: 'Success', description: 'New client slot added. Upload a logo to complete.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add client.' });
    }
  };

  const uploadClientLogo = async (clientId, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.NotableClient.update(clientId, { logo_url: file_url });
      setNotableClients(prev => prev.map(client => client.id === clientId ? { ...client, logo_url: file_url } : client));
      toast({ title: 'Success', description: 'Client logo uploaded!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload logo.' });
    }
  };

  const updateNotableClient = async (clientId, field, value) => {
    try {
      await base44.entities.NotableClient.update(clientId, { [field]: value });
      setNotableClients(prev => prev.map(client => client.id === clientId ? { ...client, [field]: value } : client));
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const deleteNotableClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    
    try {
      await base44.entities.NotableClient.delete(clientId);
      setNotableClients(prev => prev.filter(client => client.id !== clientId));
      toast({ title: 'Success', description: 'Client deleted.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete client.' });
    }
  };

  const moveNotableClient = async (clientId, direction) => {
    const currentIndex = notableClients.findIndex(client => client.id === clientId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === notableClients.length - 1)
    ) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newClients = [...notableClients];
    [newClients[currentIndex], newClients[newIndex]] = [newClients[newIndex], newClients[currentIndex]];

    try {
      await Promise.all(
        newClients.map((client, idx) => 
          base44.entities.NotableClient.update(client.id, { order: idx })
        )
      );
      setNotableClients(newClients.map((client, idx) => ({ ...client, order: idx })));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reorder clients.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Homepage Settings</h1>
            <p className="text-muted-foreground mt-1">Manage images, content, and contact information for the public homepage</p>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleDiscardChanges}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Discard
              </Button>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {hasUnsavedChanges && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              You have unsaved changes. Click "Save Changes" to apply them to the homepage.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="services">Services (6 Cards)</TabsTrigger>
            <TabsTrigger value="clients">Notable Clients</TabsTrigger>
            <TabsTrigger value="gallery">Gallery Carousel</TabsTrigger>
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Main Logo */}
            <Card>
              <CardHeader>
                <CardTitle>Main Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Logo</Label>
                  {homepageContent?.main_logo_url && (
                    <div className="mt-2 p-4 bg-secondary rounded-lg inline-block">
                      <OptimizedImage
                        src={homepageContent.main_logo_url}
                        alt="Main Logo"
                        className="h-16 w-auto"
                        objectFit="contain"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="logo-upload">Upload New Logo</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'main_logo_url')}
                    disabled={uploadingField === 'main_logo_url'}
                  />
                  {uploadingField === 'main_logo_url' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hero_title">Hero Title</Label>
                  <Input
                    id="hero_title"
                    value={homepageContent?.hero_title || ''}
                    onChange={(e) => setHomepageContent(prev => ({ ...prev, hero_title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                  <Textarea
                    id="hero_subtitle"
                    value={homepageContent?.hero_subtitle || ''}
                    onChange={(e) => setHomepageContent(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Current Hero Background</Label>
                  {homepageContent?.hero_background_url && (
                    <div className="mt-2 relative h-40 rounded-lg overflow-hidden">
                      <OptimizedImage
                        src={homepageContent.hero_background_url}
                        alt="Hero Background"
                        className="w-full h-full"
                        objectFit="cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="hero-bg-upload">Upload New Hero Background</Label>
                  <Input
                    id="hero-bg-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'hero_background_url')}
                    disabled={uploadingField === 'hero_background_url'}
                  />
                  {uploadingField === 'hero_background_url' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pattern Background */}
            <Card>
              <CardHeader>
                <CardTitle>Pattern Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Pattern</Label>
                  {homepageContent?.pattern_background_url && (
                    <div className="mt-2 relative h-40 rounded-lg overflow-hidden">
                      <OptimizedImage
                        src={homepageContent.pattern_background_url}
                        alt="Pattern Background"
                        className="w-full h-full"
                        objectFit="cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="pattern-upload">Upload New Pattern</Label>
                  <Input
                    id="pattern-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'pattern_background_url')}
                    disabled={uploadingField === 'pattern_background_url'}
                  />
                  {uploadingField === 'pattern_background_url' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Services Section Heading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="services_section_title">Section Title</Label>
                  <Input
                    id="services_section_title"
                    value={homepageContent?.services_section_title || ''}
                    onChange={(e) => setHomepageContent(prev => ({ ...prev, services_section_title: e.target.value }))}
                    placeholder="e.g., Designed to help you with your creative needs"
                  />
                </div>
                <div>
                  <Label htmlFor="services_section_subtitle">Section Subtitle</Label>
                  <Input
                    id="services_section_subtitle"
                    value={homepageContent?.services_section_subtitle || ''}
                    onChange={(e) => setHomepageContent(prev => ({ ...prev, services_section_subtitle: e.target.value }))}
                    placeholder="e.g., basta creative execution, pagusapan natin"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Homepage Service Cards</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure the 6 service cards displayed on your homepage. Each card can have a background image or use an icon with a colored background.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {homepageContent?.homepage_services?.map((service, index) => (
                    <Card key={index} className="bg-secondary/30">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-2 mb-4">
                          <Badge variant="outline" className="text-lg">Card {index + 1}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground">Card Preview</Label>
                            {service.image_url ? (
                              <OptimizedImage
                                src={service.image_url}
                                alt={service.title}
                                className="w-full h-48 rounded-lg"
                                objectFit="cover"
                              />
                            ) : (
                              <div className={`w-full h-48 ${service.icon_color} rounded-lg flex items-center justify-center`}>
                                <div className="text-white text-6xl">
                                  {service.icon_name}
                                </div>
                              </div>
                            )}
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => uploadServiceImage(e, index)}
                              disabled={uploadingField === `service-${index}`}
                            />
                            {uploadingField === `service-${index}` && (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">Uploading...</span>
                              </div>
                            )}
                            {service.image_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => updateServiceField(index, 'image_url', '')}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Image
                              </Button>
                            )}
                          </div>
                          <div className="md:col-span-2 space-y-4">
                            <div>
                              <Label>Card Title</Label>
                              <Input
                                value={service.title || ''}
                                onChange={(e) => updateServiceField(index, 'title', e.target.value)}
                                placeholder="e.g., digital printing"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Lowercase recommended for consistency
                              </p>
                            </div>
                            <div>
                              <Label>Card Description</Label>
                              <Textarea
                                value={service.description || ''}
                                onChange={(e) => updateServiceField(index, 'description', e.target.value)}
                                rows={3}
                                placeholder="Brief description for the card..."
                              />
                            </div>
                            {!service.image_url && (
                              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                <div>
                                  <Label>Icon</Label>
                                  <Select 
                                    value={service.icon_name} 
                                    onValueChange={(value) => updateServiceField(index, 'icon_name', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {iconOptions.map(icon => (
                                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Icon Background Color</Label>
                                  <Select 
                                    value={service.icon_color} 
                                    onValueChange={(value) => updateServiceField(index, 'icon_color', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {colorOptions.map(color => (
                                        <SelectItem key={color.value} value={color.value}>
                                          <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded ${color.value}`}></div>
                                            {color.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Notable Clients</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add client logos that will be displayed on the homepage
                  </p>
                </div>
                <Button onClick={addNotableClient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notableClients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No clients added yet. Click "Add Client" to get started.</p>
                    </div>
                  ) : (
                    notableClients.map((client, index) => (
                      <Card key={client.id}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-2">
                              {client.logo_url ? (
                                <OptimizedImage
                                  src={client.logo_url}
                                  alt={client.client_name || 'Client logo'}
                                  className="w-full h-24 rounded-lg border-2 border-gray-200"
                                  objectFit="contain"
                                />
                              ) : (
                                <div className="w-full h-24 bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) uploadClientLogo(client.id, file);
                                }}
                                className="mt-2"
                              />
                            </div>
                            <div className="col-span-8 space-y-3">
                              <div>
                                <Label>Client Name *</Label>
                                <Input
                                  value={client.client_name || ''}
                                  onChange={(e) => updateNotableClient(client.id, 'client_name', e.target.value)}
                                  placeholder="Company name..."
                                />
                              </div>
                              <div>
                                <Label>Website URL (Optional)</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="url"
                                    value={client.website_url || ''}
                                    onChange={(e) => updateNotableClient(client.id, 'website_url', e.target.value)}
                                    placeholder="https://example.com"
                                  />
                                  {client.website_url && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => window.open(client.website_url, '_blank')}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`active-${client.id}`}
                                  checked={client.is_active}
                                  onCheckedChange={(checked) => updateNotableClient(client.id, 'is_active', checked)}
                                />
                                <Label htmlFor={`active-${client.id}`} className="cursor-pointer">
                                  Display on homepage
                                </Label>
                              </div>
                            </div>
                            <div className="col-span-2 flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => moveNotableClient(client.id, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => moveNotableClient(client.id, 'down')}
                                disabled={index === notableClients.length - 1}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => deleteNotableClient(client.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gallery Images</CardTitle>
                <Button onClick={addGalleryImage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {galleryImages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No gallery images yet. Click "Add Image" to get started.</p>
                    </div>
                  ) : (
                    galleryImages.map((image, index) => (
                      <Card key={image.id}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-3">
                              {image.image_url ? (
                                <OptimizedImage
                                  src={image.image_url}
                                  alt={image.caption || 'Gallery image'}
                                  className="w-full h-32 rounded-lg"
                                  objectFit="cover"
                                />
                              ) : (
                                <div className="w-full h-32 bg-secondary rounded-lg flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) uploadGalleryImage(image.id, file);
                                }}
                                className="mt-2"
                              />
                            </div>
                            <div className="col-span-7 space-y-3">
                              <div>
                                <Label>Caption</Label>
                                <Input
                                  value={image.caption || ''}
                                  onChange={(e) => updateGalleryImage(image.id, 'caption', e.target.value)}
                                  placeholder="Image caption..."
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`active-${image.id}`}
                                  checked={image.is_active}
                                  onCheckedChange={(checked) => updateGalleryImage(image.id, 'is_active', checked)}
                                />
                                <Label htmlFor={`active-${image.id}`} className="cursor-pointer">
                                  Display on homepage
                                </Label>
                              </div>
                            </div>
                            <div className="col-span-2 flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => moveGalleryImage(image.id, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => moveGalleryImage(image.id, 'down')}
                                disabled={index === galleryImages.length - 1}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => deleteGalleryImage(image.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="contact_phone"
                      value={homepageContent?.contact_phone || ''}
                      onChange={(e) => setHomepageContent(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="e.g., 0977 827 0150"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={homepageContent?.contact_email || ''}
                      onChange={(e) => setHomepageContent(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="e.g., marasigancts@gmail.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location/Address
                  </Label>
                  <Input
                    id="contact_location"
                    value={homepageContent?.contact_location || ''}
                    onChange={(e) => setHomepageContent(prev => ({ ...prev, contact_location: e.target.value }))}
                    placeholder="e.g., Dasmarinas, Cavite"
                  />
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Social Media Links</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url" className="flex items-center gap-2">
                      <Facebook className="w-4 h-4" />
                      Facebook Page URL
                    </Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={homepageContent?.facebook_url || ''}
                      onChange={(e) => setHomepageContent(prev => ({ ...prev, facebook_url: e.target.value }))}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_url" className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram Profile URL
                    </Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={homepageContent?.instagram_url || ''}
                      onChange={(e) => setHomepageContent(prev => ({ ...prev, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      TikTok Profile URL
                    </Label>
                    <Input
                      id="tiktok_url"
                      type="url"
                      value={homepageContent?.tiktok_url || ''}
                      onChange={(e) => setHomepageContent(prev => ({ ...prev, tiktok_url: e.target.value }))}
                      placeholder="https://tiktok.com/@yourprofile"
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Custom Links</h3>
                      <p className="text-sm text-muted-foreground">Add custom social media or other links</p>
                    </div>
                    <Button onClick={addCustomSocialLink} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Link
                    </Button>
                  </div>

                  {(homepageContent?.custom_social_links || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-lg">
                      <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No custom links yet. Click "Add Link" to create one.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(homepageContent.custom_social_links || []).map((link, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-secondary/30 rounded-lg">
                          <div className="col-span-5 space-y-2">
                            <Label className="text-xs">Link Name</Label>
                            <Input
                              value={link.name || ''}
                              onChange={(e) => updateCustomSocialLink(index, 'name', e.target.value)}
                              placeholder="e.g., LinkedIn, WhatsApp"
                            />
                          </div>
                          <div className="col-span-6 space-y-2">
                            <Label className="text-xs">URL</Label>
                            <Input
                              type="url"
                              value={link.url || ''}
                              onChange={(e) => updateCustomSocialLink(index, 'url', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="col-span-1 flex items-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCustomSocialLink(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-6 space-y-2">
                  <Label htmlFor="company_description">Company Description (Footer)</Label>
                  <Textarea
                    id="company_description"
                    value={homepageContent?.company_description || ''}
                    onChange={(e) => setHomepageContent(prev => ({ ...prev, company_description: e.target.value }))}
                    rows={3}
                    placeholder="Brief description for the footer section..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {hasUnsavedChanges && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button 
              onClick={handleSaveChanges} 
              disabled={isSaving}
              size="lg"
              className="shadow-2xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}