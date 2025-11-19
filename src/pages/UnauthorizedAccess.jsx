import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserX, Home, LogOut } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import OptimizedImage from "@/components/ui/OptimizedImage";

export default function UnauthorizedAccessPage() {
  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = createPageUrl("Home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <OptimizedImage
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/b878ac35a_bg.png"
        alt="Background"
        className="absolute inset-0 w-full h-full"
        objectFit="cover"
      />
      <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm"></div>
      
      <div className="max-w-md w-full mx-4 relative z-10">
        <Card className="bg-white rounded-xl shadow-2xl">
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserX className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Pending Authorization</h1>
              <p className="text-gray-600">
                Your account requires administrator approval before you can access this application. Please contact your administrator for assistance.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <a href={createPageUrl('Home')} className="w-full">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}