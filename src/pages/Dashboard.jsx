import React, { useState, useEffect, useCallback } from 'react';
import { Job, User, Reminder, InventoryItem } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductionQueue from '../components/dashboard/ProductionQueue';
import InventoryAlerts from '../components/dashboard/InventoryAlerts';
import RemindersSummary from '../components/dashboard/RemindersSummary';
import DashboardCalendar from '../components/dashboard/DashboardCalendar';
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get filter from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const filter = urlParams.get('filter') || 'all';

  const loadUser = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Could not verify user. Please check your connection and refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background min-h-screen w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Production Queue */}
        <div className="lg:col-span-2">
          <ProductionQueue user={user} initialFilter={filter} />
        </div>

        {/* Sidebar with Calendar, Reminders and Alerts */}
        <div className="space-y-6">
          <DashboardCalendar user={user} />
          <RemindersSummary user={user} />
          <InventoryAlerts user={user} />
        </div>
      </div>
    </div>
  );
}