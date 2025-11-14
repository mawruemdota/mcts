import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { createPageUrl } from '@/utils';
import {
  Plus,
  Loader2,
  Upload,
  Trash2,
  Edit,
  Eye,
  QrCode,
  Copy,
  ExternalLink,
  Download,
  Box,
  Image as ImageIcon,
  BarChart3,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';

export default function ARStickerManager() {
  const [arStickers, setArStickers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSticker, setEditingSticker] = useState(null);
  const [uploadingMarker, setUploadingMarker] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    marker_image_url: '',
    ar_model_url: '',
    model_scale: 1,
    model_position_x: 0,
    model_position_y: 0,
    model_position_z: 0,
    model_rotation_x: 0,
    model_rotation_y: 0,
    model_rotation_z: 0,
    animation_name: '',
    loop_animation: true,
    auto_rotate: false,
    is_active: true
  });

  useEffect(() => {
    loadARStickers();
  }, []);

  const loadARStickers = async () => {
    setIsLoading(true);
    try {
      const stickers = await base44.entities.ARStickerContent.list('-created_date');
      setArStickers(stickers);
    } catch (error) {
      console.error('Error loading AR stickers:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load AR stickers.' });
    }
    setIsLoading(false);
  };

  const handleMarkerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload an image file.' });
      return;
    }

    setUploadingMarker(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, marker_image_url: file_url }));
      toast({ title: 'Success', description: 'Marker image uploaded!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload marker image.' });
    }
    setUploadingMarker(false);
  };

  const handleModelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['.glb', '.gltf'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload a .glb or .gltf file.' });
      return;
    }

    setUploadingModel(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, ar_model_url: file_url }));
      toast({ title: 'Success', description: '3D model uploaded!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload 3D model.' });
    }
    setUploadingModel(false);
  };

  const generateQRCode = async (stickerId) => {
    setGeneratingQR(true);
    try {
      const viewerUrl = `${window.location.origin}${createPageUrl('ARViewer')}?id=${stickerId}`;
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(viewerUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert data URL to Blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `qr-${stickerId}.png`, { type: 'image/png' });

      // Upload QR code
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Update sticker with QR code URL
      await base44.entities.ARStickerContent.update(stickerId, { qr_code_url: file_url });
      
      toast({ title: 'Success', description: 'QR code generated!' });
      loadARStickers();
    } catch (error) {
      console.error('QR generation error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate QR code.' });
    }
    setGeneratingQR(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.marker_image_url || !formData.ar_model_url) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }

    try {
      if (editingSticker) {
        await base44.entities.ARStickerContent.update(editingSticker.id, formData);
        toast({ title: 'Success', description: 'AR sticker updated!' });
      } else {
        const newSticker = await base44.entities.ARStickerContent.create(formData);
        toast({ title: 'Success', description: 'AR sticker created!' });
        
        // Auto-generate QR code for new sticker
        await generateQRCode(newSticker.id);
      }
      
      resetForm();
      setShowCreateDialog(false);
      setEditingSticker(null);
      loadARStickers();
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save AR sticker.' });
    }
  };

  const handleEdit = (sticker) => {
    setEditingSticker(sticker);
    setFormData({
      name: sticker.name || '',
      description: sticker.description || '',
      marker_image_url: sticker.marker_image_url || '',
      ar_model_url: sticker.ar_model_url || '',
      model_scale: sticker.model_scale || 1,
      model_position_x: sticker.model_position_x || 0,
      model_position_y: sticker.model_position_y || 0,
      model_position_z: sticker.model_position_z || 0,
      model_rotation_x: sticker.model_rotation_x || 0,
      model_rotation_y: sticker.model_rotation_y || 0,
      model_rotation_z: sticker.model_rotation_z || 0,
      animation_name: sticker.animation_name || '',
      loop_animation: sticker.loop_animation !== false,
      auto_rotate: sticker.auto_rotate || false,
      is_active: sticker.is_active !== false
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (stickerId) => {
    if (!window.confirm('Are you sure you want to delete this AR sticker?')) return;

    try {
      await base44.entities.ARStickerContent.delete(stickerId);
      toast({ title: 'Success', description: 'AR sticker deleted.' });
      loadARStickers();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete AR sticker.' });
    }
  };

  const copyViewerLink = (stickerId) => {
    const viewerUrl = `${window.location.origin}${createPageUrl('ARViewer')}?id=${stickerId}`;
    navigator.clipboard.writeText(viewerUrl);
    toast({ title: 'Copied!', description: 'Viewer link copied to clipboard.' });
  };

  const downloadQRCode = async (qrCodeUrl, stickerName) => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${stickerName.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to download QR code.' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      marker_image_url: '',
      ar_model_url: '',
      model_scale: 1,
      model_position_x: 0,
      model_position_y: 0,
      model_position_z: 0,
      model_rotation_x: 0,
      model_rotation_y: 0,
      model_rotation_z: 0,
      animation_name: '',
      loop_animation: true,
      auto_rotate: false,
      is_active: true
    });
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-blue-600" />
              AR Sticker Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage augmented reality experiences for physical stickers
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              resetForm();
              setEditingSticker(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create AR Sticker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSticker ? 'Edit' : 'Create'} AR Sticker</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., MCTS Logo AR"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the AR experience..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Marker Image * (.jpg, .png)
                      </Label>
                      {formData.marker_image_url && (
                        <div className="mt-2 mb-2">
                          <OptimizedImage
                            src={formData.marker_image_url}
                            alt="Marker"
                            className="w-full h-32 rounded-lg border-2 border-gray-200"
                            objectFit="contain"
                          />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleMarkerUpload}
                        disabled={uploadingMarker}
                      />
                      {uploadingMarker && (
                        <div className="flex items-center gap-2 mt-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Uploading marker...</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        This image will be printed on the physical sticker and used for AR tracking
                      </p>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        3D Model * (.glb, .gltf)
                      </Label>
                      {formData.ar_model_url && (
                        <div className="mt-2 mb-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800 flex items-center gap-2">
                            <Box className="w-4 h-4" />
                            Model uploaded successfully
                          </p>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept=".glb,.gltf"
                        onChange={handleModelUpload}
                        disabled={uploadingModel}
                      />
                      {uploadingModel && (
                        <div className="flex items-center gap-2 mt-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Uploading 3D model...</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a 3D model that will appear when the marker is detected
                      </p>
                    </div>
                  </div>

                  {/* Right Column - 3D Model Configuration */}
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        3D Model Configuration
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <Label>Scale: {formData.model_scale.toFixed(2)}</Label>
                          <Slider
                            value={[formData.model_scale]}
                            onValueChange={(value) => setFormData({ ...formData, model_scale: value[0] })}
                            min={0.1}
                            max={5}
                            step={0.1}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Position X</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.model_position_x}
                              onChange={(e) => setFormData({ ...formData, model_position_x: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Position Y</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.model_position_y}
                              onChange={(e) => setFormData({ ...formData, model_position_y: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Position Z</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.model_position_z}
                              onChange={(e) => setFormData({ ...formData, model_position_z: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Rotation X (°)</Label>
                            <Input
                              type="number"
                              step="5"
                              value={formData.model_rotation_x}
                              onChange={(e) => setFormData({ ...formData, model_rotation_x: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Rotation Y (°)</Label>
                            <Input
                              type="number"
                              step="5"
                              value={formData.model_rotation_y}
                              onChange={(e) => setFormData({ ...formData, model_rotation_y: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Rotation Z (°)</Label>
                            <Input
                              type="number"
                              step="5"
                              value={formData.model_rotation_z}
                              onChange={(e) => setFormData({ ...formData, model_rotation_z: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Animation Name (Optional)</Label>
                          <Input
                            value={formData.animation_name}
                            onChange={(e) => setFormData({ ...formData, animation_name: e.target.value })}
                            placeholder="e.g., Idle, Wave, Spin"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Leave empty if model has no animations
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="loop_animation"
                            checked={formData.loop_animation}
                            onCheckedChange={(checked) => setFormData({ ...formData, loop_animation: checked })}
                          />
                          <Label htmlFor="loop_animation" className="cursor-pointer">
                            Loop Animation
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="auto_rotate"
                            checked={formData.auto_rotate}
                            onCheckedChange={(checked) => setFormData({ ...formData, auto_rotate: checked })}
                          />
                          <Label htmlFor="auto_rotate" className="cursor-pointer">
                            Auto-Rotate Model
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                          />
                          <Label htmlFor="is_active" className="cursor-pointer">
                            Active (Visible to users)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                    setEditingSticker(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSticker ? 'Update' : 'Create'} AR Sticker
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* AR Stickers List */}
        <Card>
          <CardHeader>
            <CardTitle>Your AR Stickers ({arStickers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : arStickers.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No AR stickers yet. Create your first one!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marker</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>QR Code</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arStickers.map((sticker) => (
                      <TableRow key={sticker.id}>
                        <TableCell>
                          <OptimizedImage
                            src={sticker.marker_image_url}
                            alt={sticker.name}
                            className="w-16 h-16 rounded border"
                            objectFit="cover"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sticker.name}</p>
                            {sticker.description && (
                              <p className="text-sm text-muted-foreground">{sticker.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sticker.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                            {sticker.view_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sticker.qr_code_url ? (
                            <div className="flex items-center gap-2">
                              <OptimizedImage
                                src={sticker.qr_code_url}
                                alt="QR Code"
                                className="w-12 h-12 border rounded"
                                objectFit="contain"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadQRCode(sticker.qr_code_url, sticker.name)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateQRCode(sticker.id)}
                              disabled={generatingQR}
                            >
                              {generatingQR ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <QrCode className="w-4 h-4 mr-2" />
                                  Generate
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const url = `${createPageUrl('ARViewer')}?id=${sticker.id}`;
                                window.open(url, '_blank');
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyViewerLink(sticker.id)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(sticker)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(sticker.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}