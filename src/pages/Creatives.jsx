import React, { useState, useEffect, useCallback } from 'react';
import { User, Client } from '@/entities/all';
import { Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CaptionMaker from "../components/creatives/CaptionMaker";
import SocialMediaExecutions from "../components/creatives/SocialMediaExecutions";
import ImageGeneratorAI from "../components/creatives/ImageGeneratorAI";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function CreativesPage() {
    const [clients, setClients] = useState([]);
    const [team, setTeam] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [clientData, teamData] = await Promise.all([
                Client.list(),
                User.list()
            ]);
            setClients(clientData);
            setTeam(teamData);
        } catch (error) {
            console.error('Error loading data:', error);
            setClients([]);
            setTeam([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading creative tools...</p>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-8 py-4 md:py-8 bg-background min-h-screen">
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Palette className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Creative Hub</h1>
                            <p className="text-muted-foreground">Tools for content creation, captions, and AR experiences.</p>
                        </div>
                    </div>
                    <Link to={createPageUrl('ARStickerManager')}>
                        <Button variant="outline">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            AR Sticker Manager
                        </Button>
                    </Link>
                </div>

                <Tabs defaultValue="creative-tasks" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="creative-tasks">Creative Tasks</TabsTrigger>
                        <TabsTrigger value="caption-maker">Caption Maker</TabsTrigger>
                        <TabsTrigger value="image-generator">AI Image Gen</TabsTrigger>
                    </TabsList>

                    <TabsContent value="creative-tasks" className="mt-6">
                        <SocialMediaExecutions clients={clients} team={team} />
                    </TabsContent>

                    <TabsContent value="caption-maker" className="mt-6">
                        <CaptionMaker clients={clients} />
                    </TabsContent>

                    <TabsContent value="image-generator" className="mt-6">
                        <ImageGeneratorAI />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}