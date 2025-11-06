import React, { useState, useEffect } from 'react';
import { ContentPlan, ContentPlanItem, User } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Palette, Loader2, Image as ImageIcon } from 'lucide-react';

export default function PublicContentView() {
    const [plan, setPlan] = useState(null);
    const [items, setItems] = useState([]);
    const [team, setTeam] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const planId = urlParams.get('plan_id');

                if (!planId) {
                    setError('No content plan specified.');
                    setIsLoading(false);
                    return;
                }

                const [planData, itemsData, teamData] = await Promise.all([
                    ContentPlan.get(planId),
                    ContentPlanItem.filter({ plan_id: planId }, 'item_date'),
                    User.list()
                ]);
                
                if (!planData) {
                     setError('Content plan not found.');
                     setIsLoading(false);
                     return;
                }

                setPlan(planData);
                setItems(itemsData);
                setTeam(teamData);
            } catch (err) {
                setError('Failed to load content plan.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getAssigneeName = (email) => {
        if (!email) return 'N/A';
        const member = team.find(t => t.email === email);
        return member?.nickname || member?.full_name || email.split('@')[0];
    };
    
    const getApprovalBadge = (status) => {
        switch (status) {
            case 'Approved': return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
            case 'Rejected': return <Badge variant="destructive">{status}</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Palette className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">{plan.name}</h1>
                    </div>
                    <p className="text-slate-500">Public content preview. Last updated: {format(new Date(), 'MMMM d, yyyy')}</p>
                </header>
                
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <Table>
                        <TableHeader className="bg-slate-100">
                            <TableRow>
                                <TableHead className="w-[80px]">Photo</TableHead>
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead className="w-[120px]">Type</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Content</TableHead>
                                <TableHead className="w-[140px]">Approval</TableHead>
                                <TableHead className="w-[150px]">Assignee</TableHead>
                                <TableHead>Link</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {item.photo_url ? (
                                            <a href={item.photo_url} target="_blank" rel="noopener noreferrer">
                                                <img src={item.photo_url} alt={item.name} className="h-12 w-12 object-cover rounded-md hover:opacity-80 transition-opacity" />
                                            </a>
                                        ) : (
                                            <div className="h-12 w-12 flex items-center justify-center bg-slate-100 rounded-md">
                                                <ImageIcon className="w-5 h-5 text-slate-400" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700">{item.item_date ? format(new Date(item.item_date), 'MMM d, yyyy') : 'TBD'}</TableCell>
                                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                    <TableCell className="font-semibold text-slate-800">{item.name}</TableCell>
                                    <TableCell className="text-slate-600 max-w-xs truncate">{item.content}</TableCell>
                                    <TableCell>{getApprovalBadge(item.approval)}</TableCell>
                                    <TableCell className="text-slate-600">{getAssigneeName(item.assignee)}</TableCell>
                                    <TableCell>
                                        {item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Link</a> : 'No link'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {items.length === 0 && (
                        <div className="p-8 text-center text-slate-500">No content items in this plan yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}