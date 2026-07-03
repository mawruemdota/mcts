import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldAlert, Sparkles, ArrowLeft, ImageIcon, CalendarDays } from "lucide-react";
import WatermarkTool from "@/components/creativehub/WatermarkTool";
import PostCalendar from "@/components/creativehub/PostCalendar";

export default function CreativeHub() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const hasAccess = user && (user.role === "admin" || user.has_creative_hub_access);

  if (!hasAccess) {
    return (
      <div className="p-6 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground mb-2">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to access the Creative Hub. Contact an administrator if you need access.</p>
          <Link to={createPageUrl("Creatives")}>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Creatives</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              Creative Hub
            </h1>
            <p className="text-muted-foreground mt-1">Watermark images and schedule social media posts</p>
          </div>
          <Link to={createPageUrl("Creatives")}>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
        </div>

        <Tabs defaultValue="watermark" className="w-full">
          <TabsList className="tabs-list bg-secondary">
            <TabsTrigger value="watermark" className="tabs-trigger data-[state=active]:bg-background">
              <ImageIcon className="w-4 h-4 mr-2" />
              Watermark Tool
            </TabsTrigger>
            <TabsTrigger value="calendar" className="tabs-trigger data-[state=active]:bg-background">
              <CalendarDays className="w-4 h-4 mr-2" />
              Post Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watermark" className="mt-6">
            <WatermarkTool />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <PostCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}