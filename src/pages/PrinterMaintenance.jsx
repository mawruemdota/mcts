
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Printer as PrinterEntity, User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash, Wrench, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format, isToday } from 'date-fns';

const PrinterForm = ({ onSubmitted, printer, team, user }) => {
    const [formData, setFormData] = useState(printer || {
        name: '',
        assigned_to: ''
    });
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.assigned_to) {
            toast({ variant: "destructive", title: "Error", description: "All fields are required." });
            return;
        }

        try {
            if (printer?.id) {
                await PrinterEntity.update(printer.id, formData);
                toast({ title: "Success", description: "Printer updated." });
            } else {
                await PrinterEntity.create(formData);
                toast({ title: "Success", description: "Printer added." });
            }
            onSubmitted();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save printer." });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
            <div className="space-y-2">
                <Label htmlFor="name">Printer Name/Model</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="assignTo">Person In Charge</Label>
                <Select value={formData.assigned_to} onValueChange={value => setFormData({...formData, assigned_to: value})}>
                    <SelectTrigger id="assignTo">
                        <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                        {team.map(member => (
                            <SelectItem key={member.id} value={member.email}>
                                {member.nickname || member.full_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit">{printer ? "Update" : "Add"} Printer</Button>
        </form>
    );
};

export default function PrinterMaintenancePage() {
    const [printers, setPrinters] = useState([]);
    const [team, setTeam] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPrinter, setEditingPrinter] = useState(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [currentUser, printersData, teamData] = await Promise.all([
                User.me(),
                PrinterEntity.list(),
                User.list()
            ]);
            setUser(currentUser);
            setPrinters(printersData.sort((a,b) => a.name.localeCompare(b.name)));
            setTeam(teamData);
        } catch (error) {
            console.error("Failed to load data", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load data." });
        }
        setIsLoading(false);
    }, [toast]);
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleMarkAsCleaned = async (printerId) => {
        try {
            await PrinterEntity.update(printerId, { last_cleaned_date: new Date().toISOString().split('T')[0] });
            toast({ description: "Printer marked as cleaned for today." });
            loadData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    const handleDelete = async (id) => {
        try {
            await PrinterEntity.delete(id);
            toast({ description: "Printer removed." });
            loadData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove printer.' });
        }
    };
    
    const handleEdit = (printer) => {
        setEditingPrinter(printer);
        setShowForm(true);
    };

    const onFormSubmitted = () => {
        setShowForm(false);
        setEditingPrinter(null);
        loadData();
    };
    
    const userMap = useMemo(() => {
        const map = new Map();
        team.forEach(member => map.set(member.email, member.nickname || member.full_name));
        return map;
    }, [team]);

    return (
        <div className="p-4 md:p-8 bg-background min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Wrench/> Printer Maintenance</h1>
                        <p className="text-muted-foreground">Daily printer cleaning checklist.</p>
                    </div>
                    {user?.role === 'admin' && (
                        <Dialog open={showForm} onOpenChange={setShowForm}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingPrinter(null)}>
                                    <Plus className="w-4 h-4 mr-2" />Add Printer
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="dialog-content">
                                <DialogHeader>
                                    <DialogTitle className="text-card-foreground">
                                        {editingPrinter ? "Edit" : "Add"} Printer
                                    </DialogTitle>
                                </DialogHeader>
                                <PrinterForm onSubmitted={onFormSubmitted} printer={editingPrinter} team={team} user={user} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <Card className="bg-card border-border">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Printer</TableHead>
                                    <TableHead>In Charge</TableHead>
                                    <TableHead>Status (Today)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow> :
                                printers.length > 0 ? printers.map(p => {
                                    const cleanedToday = p.last_cleaned_date && isToday(new Date(p.last_cleaned_date));
                                    const canClean = p.assigned_to === user?.email;

                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{userMap.get(p.assigned_to) || p.assigned_to}</TableCell>
                                            <TableCell>
                                                {cleanedToday ? (
                                                    <span className="flex items-center gap-2 text-green-500"><CheckCircle className="w-4 h-4"/> Cleaned</span>
                                                ) : (
                                                    <span className="flex items-center gap-2 text-yellow-500"><AlertCircle className="w-4 h-4"/> Pending</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                {canClean && !cleanedToday && (
                                                    <Button size="sm" onClick={() => handleMarkAsCleaned(p.id)}>Mark as Cleaned</Button>
                                                )}
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit className="w-4 h-4"/></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash className="w-4 h-4"/></Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : <TableRow><TableCell colSpan={4} className="text-center h-24">No printers configured.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
