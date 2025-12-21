import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function QRGenerator() {
  const [qrData, setQrData] = useState('https://marasigancreatives.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrStyle, setQrStyle] = useState('squares');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const qrRef = useRef(null);
  const { toast } = useToast();

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      toast({ title: 'Logo uploaded successfully' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Failed to upload logo' });
    }
    setIsUploading(false);
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'qr-code.png';
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = url;
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>QR Code Content *</Label>
            <Input
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              placeholder="Enter URL or text"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter any text, URL, or data you want to encode
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Foreground Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>QR Code Style</Label>
            <Select value={qrStyle} onValueChange={setQrStyle}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="squares">Squares</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Logo (Optional)</Label>
            <div className="mt-1 space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLogoUrl('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logoUrl && (
                <div className="border rounded-lg p-2 flex items-center justify-center bg-muted">
                  <img src={logoUrl} alt="Logo" className="max-h-16 max-w-full object-contain" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a square logo for best results
            </p>
          </div>

          <Button onClick={handleDownload} className="w-full" disabled={!qrData}>
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          {qrData ? (
            <div ref={qrRef} className="relative">
              <QRCodeSVG
                value={qrData}
                size={300}
                level="H"
                fgColor={fgColor}
                bgColor={bgColor}
                imageSettings={logoUrl ? {
                  src: logoUrl,
                  height: 60,
                  width: 60,
                  excavate: true,
                } : undefined}
                style={{
                  borderRadius: qrStyle === 'dots' ? '8px' : '0px'
                }}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">Enter content to generate QR code</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}