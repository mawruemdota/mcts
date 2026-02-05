import React from "react";
import { Label } from "@/components/ui/label";
import OptimizedImage from "@/components/ui/OptimizedImage";

export default function KeychainVisualEditor({ numPhotos, photoUrls, backgroundColor, onBackgroundColorChange }) {
  const renderPhotoSlots = () => {
    const slots = [];
    for (let i = 0; i < numPhotos; i++) {
      slots.push(
        <div
          key={i}
          className="w-full aspect-[4/3] bg-gray-400 rounded-lg overflow-hidden flex items-center justify-center"
        >
          {photoUrls[i] ? (
            <OptimizedImage
              src={photoUrls[i]}
              alt={`Photo ${i + 1}`}
              className="w-full h-full"
              objectFit="contain"
            />
          ) : (
            <span className="text-white text-sm">Photo {i + 1}</span>
          )}
        </div>
      );
    }
    return slots;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Preview</Label>
        <div
          className="border-4 border-black rounded-lg p-4 space-y-3"
          style={{ backgroundColor: backgroundColor }}
        >
          {renderPhotoSlots()}
        </div>
      </div>
      <div>
        <Label>Background Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="w-12 h-12 rounded border cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">{backgroundColor}</span>
        </div>
      </div>
    </div>
  );
}