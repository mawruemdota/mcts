
import React, { useState, useEffect, useRef } from 'react';
import { Client, CaptionTemplate, GeneratedCaption, User } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Upload, 
  Copy, 
  Check, 
  Plus, 
  Image as ImageIcon, 
  Loader2, 
  Trash2,
  Edit,
  Save
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { InvokeLLM, UploadFile } from '@/integrations/Core';

const TemplateManager = ({ onTemplateCreated }) => {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    template_name: '',
    template_content: '',
    category: 'general',
    variables: [],
    description: '',
    sample_captions: ['', '', ''] // Added
  });
  const { toast } = useToast();

  const loadTemplates = async () => {
    const data = await CaptionTemplate.list();
    setTemplates(data);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out empty sample captions
      const filteredSampleCaptions = formData.sample_captions.filter(caption => caption.trim() !== '');
      
      const dataToSubmit = {
        ...formData,
        sample_captions: filteredSampleCaptions
      };

      if (editingTemplate) {
        await CaptionTemplate.update(editingTemplate.id, dataToSubmit);
        toast({ title: 'Success', description: 'Template updated successfully.' });
      } else {
        await CaptionTemplate.create(dataToSubmit);
        toast({ title: 'Success', description: 'Template created successfully.' });
      }
      setShowForm(false);
      setEditingTemplate(null);
      setFormData({
        template_name: '',
        template_content: '',
        category: 'general',
        variables: [],
        description: '',
        sample_captions: ['', '', ''] // Reset with empty array
      });
      loadTemplates();
      if (onTemplateCreated) onTemplateCreated();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save template.' });
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      ...template,
      sample_captions: [
        template.sample_captions?.[0] || '',
        template.sample_captions?.[1] || '',
        template.sample_captions?.[2] || ''
      ]
    });
    setShowForm(true);
  };

  const handleSampleCaptionChange = (index, value) => {
    const newSampleCaptions = [...formData.sample_captions];
    newSampleCaptions[index] = value;
    setFormData(prev => ({ ...prev, sample_captions: newSampleCaptions }));
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await CaptionTemplate.delete(templateId);
        toast({ title: 'Success', description: 'Template deleted.' });
        loadTemplates();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete template.' });
      }
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-foreground">Caption Templates</CardTitle>
          <Dialog open={showForm} onOpenChange={(open) => { 
            setShowForm(open); 
            if (!open) { 
              setEditingTemplate(null); 
              setFormData({
                template_name: '',
                template_content: '',
                category: 'general',
                variables: [],
                description: '',
                sample_captions: ['', '', '']
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-content max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  {editingTemplate ? 'Edit' : 'Create'} Caption Template
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={formData.template_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                      placeholder="e.g., Product Launch Template"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="informational">Informational</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Template Content</Label>
                  <Textarea
                    value={formData.template_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                    placeholder="Enter your template content. Use variables in double curly braces for dynamic content."
                    rows={4} // Reduced rows
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use double curly braces for variables like product_name, discount, call_to_action
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="When to use this template"
                  />
                </div>
                
                {/* Sample Captions Section */}
                <div className="space-y-2">
                  <Label>Sample Captions (Optional - for AI reference)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Provide up to 3 example captions that demonstrate the style and tone you want
                  </p>
                  {formData.sample_captions.map((caption, index) => (
                    <div key={index} className="space-y-1">
                      <Label className="text-xs">Sample Caption {index + 1}</Label>
                      <Textarea
                        value={caption}
                        onChange={(e) => handleSampleCaptionChange(index, e.target.value)}
                        placeholder={`Example caption ${index + 1}...`}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {templates.map(template => (
            <Card key={template.id} className="bg-secondary border-border">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{template.template_name}</h4>
                      <Badge variant="outline" className="capitalize">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description}
                    </p>
                    <div className="text-xs text-muted-foreground bg-background p-2 rounded border mb-2">
                      {template.template_content.substring(0, 100)}...
                    </div>
                    {template.sample_captions && template.sample_captions.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Sample Captions:</strong> {template.sample_captions.length} provided
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet. Create your first template!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CaptionGenerator = ({ clients }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [variations, setVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const loadTemplates = async () => {
    const data = await CaptionTemplate.list();
    setTemplates(data);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setPhotoUrl(file_url);
      setPhotoFile(file);
      toast({ title: 'Success', description: 'Photo uploaded successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload photo.' });
    }
    setIsUploading(false);
  };

  const generateCaption = async () => {
    if (!selectedClient) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a client.' });
      return;
    }

    setIsGenerating(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      const template = templates.find(t => t.id === selectedTemplate);
      
      let prompt = `You are a professional social media caption writer. Create engaging captions for ${client?.client_name || 'the business'}.`;
      
      if (photoUrl) {
        prompt += ` IMPORTANT: First, carefully analyze the uploaded image and describe what you see in detail. Then incorporate these visual elements naturally into your captions. Make sure the captions directly relate to what's shown in the image.`;
      }
      
      if (template) {
        prompt += ` Use this template structure as inspiration: "${template.template_content}". `;
        prompt += `Template category: ${template.category}. `;
        
        if (template.sample_captions && template.sample_captions.length > 0) {
          prompt += ` Here are sample captions that demonstrate the desired style and tone: `;
          template.sample_captions.forEach((sample, index) => {
            prompt += `${index + 1}. "${sample}" `;
          });
          prompt += `Use these examples as reference for writing style, tone, and structure. `;
        }
      }
      
      if (customPrompt) {
        prompt += ` Additional context and requirements: ${customPrompt}. `;
      }
      
      prompt += ` Generate 3 different caption variations:
      1. SHORT (1-2 sentences): Quick, punchy, and attention-grabbing
      2. MEDIUM (3-4 sentences): More detailed with context and engagement
      3. LONG (5+ sentences): Full storytelling with comprehensive details
      
      Each caption should:
      - Be engaging and appropriate for social media platforms
      - Include relevant hashtags where appropriate
      - Match the brand voice and tone
      - If an image is provided, directly reference and incorporate visual elements from the photo
      - Be ready to post without modification`;

      const files = photoUrl ? [photoUrl] : undefined;
      
      const response = await InvokeLLM({
        prompt: prompt,
        file_urls: files,
        response_json_schema: {
          type: "object",
          properties: {
            image_description: { 
              type: "string", 
              description: "Description of what's in the uploaded image (if provided)" 
            },
            short_caption: { type: "string" },
            medium_caption: { type: "string" },
            long_caption: { type: "string" }
          }
        }
      });

      const captions = [
        response.short_caption,
        response.medium_caption,
        response.long_caption
      ].filter(Boolean);

      setGeneratedCaption(captions[0] || '');
      setVariations(captions);

      // Save to database
      const user = await User.me();
      await GeneratedCaption.create({
        client_id: selectedClient,
        client_name: client?.client_name || '',
        template_id: selectedTemplate || null,
        custom_prompt: customPrompt,
        photo_url: photoUrl || null,
        generated_caption: captions[0] || '',
        variations: captions,
        created_by: user.email
      });

      toast({ 
        title: 'Success', 
        description: photoUrl ? 'Caption generated with image analysis!' : 'Caption generated successfully!' 
      });

      // Show image analysis if available
      if (response.image_description && photoUrl) {
        console.log('Image Analysis:', response.image_description);
      }

    } catch (error) {
      console.error('Caption generation error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate caption.' });
    }
    setIsGenerating(false);
  };

  const copyToClipboard = async (text, index = -1) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({ title: 'Copied!', description: 'Caption copied to clipboard.' });
      setTimeout(() => setCopiedIndex(-1), 2000);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to copy caption.' });
    }
  };

  const clearAll = () => {
    setSelectedTemplate('');
    setCustomPrompt('');
    setPhotoFile(null);
    setPhotoUrl('');
    setGeneratedCaption('');
    setVariations([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5" />
            AI Caption Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
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

          <div className="space-y-2">
            <Label>Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or create custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Template (Custom)</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name} - {template.category}
                    {template.sample_captions && template.sample_captions.length > 0 && ' ✨'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && templates.find(t => t.id === selectedTemplate)?.sample_captions?.length > 0 && (
              <p className="text-xs text-green-600">✨ This template includes sample captions for better AI reference</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Custom Prompt</Label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want the caption to be about, tone, specific details, etc."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Photo (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              🔍 AI will analyze the photo content and create captions that reference what's in the image
            </p>
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {photoUrl ? 'Change Photo' : 'Upload Photo for Analysis'}
              </Button>
              {photoUrl && (
                <div className="flex items-center gap-2">
                  <img src={photoUrl} alt="Uploaded" className="w-10 h-10 object-cover rounded" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPhotoUrl('');
                      setPhotoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateCaption}
              disabled={isGenerating || !selectedClient}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {photoUrl ? 'Analyze Photo & Generate' : 'Generate Caption'}
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Generated Captions</CardTitle>
        </CardHeader>
        <CardContent>
          {variations.length > 0 ? (
            <div className="space-y-4">
              {variations.map((caption, index) => (
                <div key={index} className="relative">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">
                      {index === 0 ? 'Short' : index === 1 ? 'Medium' : 'Long'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(caption, index)}
                      className="flex-shrink-0"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-secondary p-3 rounded border text-sm text-foreground whitespace-pre-wrap">
                    {caption}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Generated captions will appear here</p>
              <p className="text-xs">Select a client and click generate to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function CaptionMaker() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const clientData = await Client.list();
        setClients(clientData.sort((a, b) => a.client_name.localeCompare(b.client_name)));
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="tabs-list">
          <TabsTrigger value="generator" className="tabs-trigger">Caption Generator</TabsTrigger>
          <TabsTrigger value="templates" className="tabs-trigger">Template Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-6">
          <CaptionGenerator clients={clients} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
