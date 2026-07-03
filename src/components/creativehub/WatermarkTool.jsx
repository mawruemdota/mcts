import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";

const POSITIONS = [
  { value: "top_left", label: "Upper Left" },
  { value: "top_right", label: "Upper Right" },
  { value: "bottom_left", label: "Lower Left" },
  { value: "bottom_right", label: "Lower Right" },
];

export default function WatermarkTool() {
  const [baseImage, setBaseImage] = useState(null);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [position, setPosition] = useState("bottom_right");
  const [resultUrl, setResultUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);

  const loadImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleBaseImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = await loadImage(file);
    setBaseImage(img);
    setResultUrl(null);
  };

  const handleWatermarkChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = await loadImage(file);
    setWatermarkImage(img);
    setResultUrl(null);
  };

  const generateWatermarkedImage = () => {
    if (!baseImage || !watermarkImage) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0);

    const margin = Math.round(baseImage.width * 0.03);
    const wmWidth = Math.round(baseImage.width * 0.2);
    const wmHeight = Math.round(wmWidth * (watermarkImage.height / watermarkImage.width));

    let x, y;
    switch (position) {
      case "top_left":
        x = margin; y = margin;
        break;
      case "top_right":
        x = baseImage.width - wmWidth - margin; y = margin;
        break;
      case "bottom_left":
        x = margin; y = baseImage.height - wmHeight - margin;
        break;
      case "bottom_right":
      default:
        x = baseImage.width - wmWidth - margin; y = baseImage.height - wmHeight - margin;
        break;
    }

    ctx.globalAlpha = 0.85;
    ctx.drawImage(watermarkImage, x, y, wmWidth, wmHeight);
    ctx.globalAlpha = 1;

    setResultUrl(canvas.toDataURL("image/png"));
    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "watermarked-image.png";
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watermark Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Image to Watermark</Label>
            <Input type="file" accept="image/*" onChange={handleBaseImageChange} />
          </div>
          <div className="space-y-2">
            <Label>Watermark Image (e.g. logo)</Label>
            <Input type="file" accept="image/*" onChange={handleWatermarkChange} />
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label>Watermark Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={generateWatermarkedImage} disabled={!baseImage || !watermarkImage || isProcessing}>
          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
          Apply Watermark
        </Button>

        <canvas ref={canvasRef} className="hidden" />

        {resultUrl && (
          <div className="space-y-3 pt-2 border-t">
            <img src={resultUrl} alt="Watermarked preview" className="max-w-full max-h-96 rounded-lg border" />
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}