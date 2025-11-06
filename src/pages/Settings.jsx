import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Brush, Users, Info } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";


export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('dark');
    const { toast } = useToast();

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = await User.me();
            setUser(currentUser);
        };
        fetchUser();

        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
    }, []);

    const handleThemeChange = (isDark) => {
        const newTheme = isDark ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
        toast({ title: "Theme Changed", description: `Switched to ${newTheme} mode.` });
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="p-8">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-destructive">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">You do not have permission to view this page. Please contact an administrator.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-8 bg-background min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">App Settings</h1>
                    <p className="text-muted-foreground">Manage application-wide settings and preferences.</p>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground"><Brush className="w-5 h-5"/> Appearance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode" className="text-foreground">Dark Mode</Label>
                            <Switch
                                id="dark-mode"
                                checked={theme === 'dark'}
                                onCheckedChange={handleThemeChange}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Toggle between light and dark themes for the application.</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground"><Users className="w-5 h-5"/> User & Role Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">User roles and permissions are managed centrally. As an admin, you can invite new users and assign them roles like 'admin' or 'user'.</p>
                        <div className="flex items-start p-4 bg-secondary rounded-lg">
                           <Info className="w-5 h-5 text-blue-400 mr-3 mt-1 flex-shrink-0" />
                           <div>
                             <h4 className="font-semibold text-foreground">How to Manage Roles</h4>
                             <p className="text-muted-foreground text-sm">
                               To set a user as an Admin, go to your application's main dashboard, navigate to the **Data** tab, select the **User** entity, find the user record, and change their `role` field to "admin".
                             </p>
                           </div>
                        </div>
                         <Link to={createPageUrl("Team")}>
                           <Button>Manage Team Members</Button>
                         </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}