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
  onPhotoLayoutChange,
  backToBack,
  backgroundColor2,
  onBackgroundColor2Change,
  backgroundImage2,
  onBackgroundImage2Change
}) {
  const [uploadingBg, setUploadingBg] = useState(false);
  const [backgroundType, setBackgroundType] = useState(backgroundImage ? "image" : "color");
  const [uploadingBg2, setUploadingBg2] = useState(false);
  const [backgroundType2, setBackgroundType2] = useState(backgroundImage2 ? "image" : "color");

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

  const handleBg2Upload = async (file) => {
    if (!file) return;
    setUploadingBg2(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onBackgroundImage2Change?.(result.file_url);
      setBackgroundType2("image");
    } catch (error) {
      console.error("Background upload error:", error);
    }
    setUploadingBg2(false);
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

  const renderPhotoSlots = (startIndex, count) => {
    const slots = [];
    
    for (let i = startIndex; i < startIndex + count; i++) {
      slots.push(
        <div
          key={i}
          className="bg-gray-400 rounded-lg overflow-hidden flex items-center justify-center w-full h-full"
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

  const previewStyle2 = {
    ...(backgroundType2 === "image" && backgroundImage2 
      ? { backgroundImage: `url(${backgroundImage2})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { backgroundColor: backgroundColor2 || backgroundColor }
    )
  };

  const isDifferentB2B = backToBack === "different";
  const photosPerSide = isDifferentB2B ? numPhotos / 2 : numPhotos;

  return (
    <div className="space-y-4">

      <div>
        <Label>Preview</Label>
        <div className={`flex justify-center gap-6 ${isDifferentB2B ? 'flex-col sm:flex-row' : ''}`}>
          {/* Side 1 */}
          <div className="flex flex-col items-center gap-2">
            {isDifferentB2B && <span className="text-sm font-medium text-muted-foreground">Side 1</span>}
            <div
              className="border-4 border-black rounded-lg overflow-hidden flex items-center justify-center"
              style={{
                ...previewStyle,
                ...getPreviewDimensions()
              }}
            >
              <div 
                className={`grid ${getGridLayout()} w-full h-full`}
                style={{ 
                  gap: `${photoMargin || 4}px`, 
                  padding: `${photoMargin || 4}px`,
                  gridAutoRows: '1fr'
                }}
              >
                {renderPhotoSlots(0, photosPerSide)}
              </div>
            </div>
          </div>

          {/* Side 2 (only for different b2b) */}
          {isDifferentB2B && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Side 2</span>
              <div
                className="border-4 border-black rounded-lg overflow-hidden flex items-center justify-center"
                style={{
                  ...previewStyle2,
                  ...getPreviewDimensions()
                }}
              >
                <div 
                  className={`grid ${getGridLayout()} w-full h-full`}
                  style={{ 
                    gap: `${photoMargin || 4}px`, 
                    padding: `${photoMargin || 4}px`,
                    gridAutoRows: '1fr'
                  }}
                >
                  {renderPhotoSlots(photosPerSide, photosPerSide)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side 1 Background */}
      <div>
        <Label className="text-base font-semibold">{isDifferentB2B ? "Side 1 Background" : "Background"}</Label>
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
      </div>

      {/* Side 2 Background (only for different b2b) */}
      {isDifferentB2B && (
        <div>
          <Label className="text-base font-semibold">Side 2 Background</Label>
          <Tabs value={backgroundType2} onValueChange={setBackgroundType2}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="color">Background Color</TabsTrigger>
              <TabsTrigger value="image">Background Image</TabsTrigger>
            </TabsList>
            
            <TabsContent value="color" className="space-y-2">
              <Label>Pick a Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={backgroundColor2 || backgroundColor || "#FFFFFF"}
                  onChange={(e) => {
                    onBackgroundColor2Change?.(e.target.value);
                    setBackgroundType2("color");
                    onBackgroundImage2Change?.(null);
                  }}
                  className="w-12 h-12 rounded border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{backgroundColor2 || backgroundColor || "#FFFFFF"}</span>
              </div>
            </TabsContent>
            
            <TabsContent value="image" className="space-y-2">
              <Label>Upload Background Image</Label>
              {backgroundImage2 ? (
                <div className="space-y-2">
                  <OptimizedImage
                    src={backgroundImage2}
                    alt="Background Side 2"
                    className="w-full h-32 rounded border"
                    objectFit="cover"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      onBackgroundImage2Change?.(null);
                      setBackgroundType2("color");
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    {uploadingBg2 ? (
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                    ) : (
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    )}
                    <p className="text-sm text-gray-600">
                      {uploadingBg2 ? "Uploading..." : "Click to upload background"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleBg2Upload(e.target.files[0])}
                    disabled={uploadingBg2}
                  />
                </label>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}


    </div>
  );
}