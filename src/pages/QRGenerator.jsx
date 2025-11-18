import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, QrCode, Upload, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

export default function QRGenerator() {
  const [qrData, setQrData] = useState('https://example.com');
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [qrSize, setQrSize] = useState(512);
  const [logoSize, setLogoSize] = useState(25);
  const [errorCorrection, setErrorCorrection] = useState('H');
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [generatedQR, setGeneratedQR] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);
  const { toast } = useToast();

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setLogoUrl(file_url);
        setLogoFile(file);
        toast({ title: 'Logo uploaded successfully' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload logo' });
      }
    }
  };

  const generateQRCode = async () => {
    if (!qrData.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter URL or text' });
      return;
    }

    setIsGenerating(true);
    try {
      // Using QR Server API - free and no API key required
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}&ecc=${errorCorrection}&color=${qrColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = qrSize;
      canvas.height = qrSize;
      
      // Load QR code image
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = async () => {
        // Draw QR code
        ctx.drawImage(qrImage, 0, 0, qrSize, qrSize);
        
        // If logo exists, overlay it
        if (logoUrl) {
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          
          logo.onload = () => {
            const logoPixelSize = (qrSize * logoSize) / 100;
            const logoX = (qrSize - logoPixelSize) / 2;
            const logoY = (qrSize - logoPixelSize) / 2;
            
            // Draw white background circle/square for logo
            ctx.fillStyle = bgColor;
            ctx.fillRect(logoX - 10, logoY - 10, logoPixelSize + 20, logoPixelSize + 20);
            
            // Draw logo
            ctx.drawImage(logo, logoX, logoY, logoPixelSize, logoPixelSize);
            
            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL('image/png');
            setGeneratedQR(dataUrl);
            setIsGenerating(false);
          };
          
          logo.onerror = () => {
            // If logo fails to load, just show QR code without logo
            const dataUrl = canvas.toDataURL('image/png');
            setGeneratedQR(dataUrl);
            setIsGenerating(false);
          };
          
          logo.src = logoUrl;
        } else {
          // No logo, just use the QR code
          const dataUrl = canvas.toDataURL('image/png');
          setGeneratedQR(dataUrl);
          setIsGenerating(false);
        }
      };
      
      qrImage.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate QR code' });
        setIsGenerating(false);
      };
      
      qrImage.src = qrApiUrl;
    } catch (error) {
      console.error('QR generation error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate QR code' });
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!generatedQR) return;
    
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = generatedQR;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <QrCode className="w-8 h-8" />
            QR Code Generator
          </h1>
          <p className="text-muted-foreground mt-1">Create custom branded QR codes with logos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL/Text Input */}
              <div className="space-y-2">
                <Label htmlFor="qr-data">URL or Text *</Label>
                <Input
                  id="qr-data"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Brand Logo (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  {logoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoUrl('');
                        setLogoFile(null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {logoUrl && (
                  <div className="mt-2">
                    <img src={logoUrl} alt="Logo preview" className="w-20 h-20 object-contain border rounded" />
                  </div>
                )}
              </div>

              {/* QR Size */}
              <div className="space-y-2">
                <Label>QR Code Size: {qrSize}px</Label>
                <Slider
                  value={[qrSize]}
                  onValueChange={(value) => setQrSize(value[0])}
                  min={256}
                  max={1024}
                  step={64}
                />
              </div>

              {/* Logo Size */}
              {logoUrl && (
                <div className="space-y-2">
                  <Label>Logo Size: {logoSize}%</Label>
                  <Slider
                    value={[logoSize]}
                    onValueChange={(value) => setLogoSize(value[0])}
                    min={10}
                    max={40}
                    step={5}
                  />
                </div>
              )}

              {/* Error Correction */}
              <div className="space-y-2">
                <Label>Error Correction Level</Label>
                <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Low (7%)</SelectItem>
                    <SelectItem value="M">Medium (15%)</SelectItem>
                    <SelectItem value="Q">Quartile (25%)</SelectItem>
                    <SelectItem value="H">High (30%) - Recommended for logos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Higher correction allows more logo coverage without breaking the QR code
                </p>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-color">QR Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="qr-color"
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bg-color">Background</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bg-color"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      placeholder="#FFFFFF"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateQRCode}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Right Panel - Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center min-h-[400px] bg-secondary/30 rounded-lg">
                {generatedQR ? (
                  <img
                    src={generatedQR}
                    alt="Generated QR Code"
                    className="max-w-full h-auto"
                    style={{ maxHeight: '500px' }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Your QR code will appear here</p>
                    <p className="text-sm mt-2">Configure settings and click Generate</p>
                  </div>
                )}
              </div>

              {generatedQR && (
                <div className="flex gap-2">
                  <Button onClick={downloadQRCode} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedQR(null)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hidden Canvas for QR Generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Best Results</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🎯 Logo Size</h4>
              <p className="text-muted-foreground">
                Keep logos between 20-30% of QR size. Too large may make the code unscannable.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🛡️ Error Correction</h4>
              <p className="text-muted-foreground">
                Use "High" correction level when adding logos to ensure scannability even with overlay.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎨 Contrast</h4>
              <p className="text-muted-foreground">
                Ensure good contrast between QR color and background for reliable scanning.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}