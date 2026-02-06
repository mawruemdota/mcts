import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2 } from "lucide-react";

export default function KeychainVisualEditor({ 
  numPhotos, 
  photoUrls, 
  backgroundColor, 
  onBackgroundColorChange,
  backgroundImage,
  onBackgroundImageChange,
  photoBorderWidth,
  onPhotoBorderWidthChange,
  photoBorderColor,
  onPhotoBorderColorChange,
  photoMargin,
  onPhotoMarginChange,
  orientation,
  widthInches,
  heightInches,
  photoLayout,
  onPhotoLayoutChange
}) {
  const [uploadingBg, setUploadingBg] = useState(false);
  const [backgroundType, setBackgroundType] = useState(backgroundImage ? "image" : "color");

  const handleBgUpload = async (file) => {
    if (!file) return;
    setUploadingBg(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onBackgroundImageChange?.(result.file_url);
      setBackgroundType("image");
    } catch (error) {
      console.error("Background upload error:", error);
    }
    setUploadingBg(false);
  };

  const getGridLayout = () => {
    if (photoLayout === "vertical") {
      // Top to bottom (single column)
      return "grid-cols-1";
    }
    
    // Left to right (horizontal)
    if (numPhotos === 1) return "grid-cols-1";
    if (numPhotos === 2) return "grid-cols-2";
    if (numPhotos === 3) return "grid-cols-3";
    if (numPhotos === 4) return "grid-cols-2";
    if (numPhotos === 6) return "grid-cols-3";
    return "grid-cols-2";
  };

  const getPhotoAspectRatio = () => {
    if (orientation === "landscape") {
      return "aspect-[4/3]";
    }
    return "aspect-[3/4]";
  };

  const getPreviewDimensions = () => {
    const baseScale = 80;
    let width = (widthInches || 1) * baseScale;
    let height = (heightInches || 3) * baseScale;
    
    // If landscape, rotate the display
    if (orientation === "landscape") {
      return { 
        width: `${height}px`, 
        height: `${width}px`,
        transform: "rotate(90deg)"
      };
    }
    
    return { width: `${width}px`, height: `${height}px` };
  };

  const renderPhotoSlots = () => {
    const slots = [];
    const aspectRatio = getPhotoAspectRatio();
    
    for (let i = 0; i < numPhotos; i++) {
      slots.push(
        <div
          key={i}
          className={`${aspectRatio} bg-gray-400 rounded-lg overflow-hidden flex items-center justify-center`}
          style={{
            border: photoBorderWidth > 0 ? `${photoBorderWidth}px solid ${photoBorderColor || "#000000"}` : "none"
          }}
        >
          {photoUrls[i] ? (
            <OptimizedImage
              src={photoUrls[i]}
              alt={`Photo ${i + 1}`}
              className="w-full h-full"
              objectFit="cover"
            />
          ) : (
            <span className="text-white text-sm">Photo {i + 1}</span>
          )}
        </div>
      );
    }
    return slots;
  };

  const previewStyle = {
    ...(backgroundType === "image" && backgroundImage 
      ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { backgroundColor: backgroundColor }
    )
  };

  return (
    <div className="space-y-4">

      <div>
        <Label>Preview</Label>
        <div className="flex justify-center">
          <div
            className="border-4 border-black rounded-lg overflow-hidden"
            style={{
              ...previewStyle,
              ...getPreviewDimensions()
            }}
          >
            <div 
              className={`grid ${getGridLayout()} h-full w-full`}
              style={{ gap: `${photoMargin || 4}px`, padding: `${photoMargin || 4}px` }}
            >
              {renderPhotoSlots()}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={backgroundType} onValueChange={setBackgroundType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="color">Background Color</TabsTrigger>
          <TabsTrigger value="image">Background Image</TabsTrigger>
        </TabsList>
        
        <TabsContent value="color" className="space-y-2">
          <Label>Pick a Color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={backgroundColor || "#FFFFFF"}
              onChange={(e) => {
                onBackgroundColorChange?.(e.target.value);
                setBackgroundType("color");
                onBackgroundImageChange?.(null);
              }}
              className="w-12 h-12 rounded border cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">{backgroundColor || "#FFFFFF"}</span>
          </div>
        </TabsContent>
        
        <TabsContent value="image" className="space-y-2">
          <Label>Upload Background Image</Label>
          {backgroundImage ? (
            <div className="space-y-2">
              <OptimizedImage
                src={backgroundImage}
                alt="Background"
                className="w-full h-32 rounded border"
                objectFit="cover"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onBackgroundImageChange?.(null);
                  setBackgroundType("color");
                }}
              >
                Remove Image
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                {uploadingBg ? (
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                ) : (
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                )}
                <p className="text-sm text-gray-600">
                  {uploadingBg ? "Uploading..." : "Click to upload background"}
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleBgUpload(e.target.files[0])}
                disabled={uploadingBg}
              />
            </label>
          )}
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div>
          <Label>Photo Layout</Label>
          <Select value={photoLayout || "horizontal"} onValueChange={onPhotoLayoutChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Left to Right</SelectItem>
              <SelectItem value="vertical">Top to Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Photo Margin: {photoMargin || 4}px</Label>
            <Slider
              value={[photoMargin || 4]}
              onValueChange={(values) => onPhotoMarginChange?.(values[0])}
              min={0}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Border Width: {photoBorderWidth || 0}px</Label>
            <Slider
              value={[photoBorderWidth || 0]}
              onValueChange={(values) => onPhotoBorderWidthChange?.(values[0])}
              min={0}
              max={10}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Border Color</Label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={photoBorderColor || "#000000"}
                onChange={(e) => onPhotoBorderColorChange?.(e.target.value)}
                className="w-12 h-12 rounded border cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{photoBorderColor || "#000000"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}