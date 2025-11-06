import React, { useState, useEffect } from 'react';
import { Reminder, User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X, Repeat } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function QuickReminderModal({ isOpen, onClose, user, onReminderCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: null,
        user_email: user?.email || '',
        is_recurring: false,
        recurrence_type: 'daily'
    });
    const [team, setTeam] = useState([]);
    const { toast } = useToast();

    useEffect(() => {
        const loadTeam = async () => {
            if (user?.role === 'admin') {
                try {
                    const teamData = await User.list();
                    setTeam(teamData);
                } catch (error) {
                    console.error('Failed to load team:', error);
                }
            }
        };
        if (isOpen) {
            loadTeam();
            // Reset form when modal opens
            setFormData({
                title: '',
                description: '',
                deadline: null,
                user_email: user?.email || '',
                is_recurring: false,
                recurrence_type: 'daily'
            });
        }
    }, [isOpen, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const reminderData = {
                title: formData.title,
                description: formData.description,
                user_email: formData.user_email,
                deadline: formData.deadline ? formData.deadline.toISOString() : null,
                is_recurring: formData.is_recurring,
                recurrence_type: formData.is_recurring ? formData.recurrence_type : null
            };

            await Reminder.create(reminderData);
            toast({ 
                title: "Success", 
                description: `${formData.is_recurring ? 'Recurring r' : 'R'}eminder created.` 
            });
            
            if (onReminderCreated) onReminderCreated();
            onClose();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to create reminder." });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="dialog-content bg-slate-900 border-slate-700 text-white">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-white text-xl">New Reminder</DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-white">Title</Label>
                        <Input 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            required
                            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-white">Description</Label>
                        <Textarea 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                            rows={3}
                        />
                    </div>
                    
                    {user?.role === 'admin' && (
                        <div className="space-y-2">
                            <Label className="text-white">Assign To</Label>
                            <Select 
                                value={formData.user_email} 
                                onValueChange={value => setFormData({...formData, user_email: value})}
                            >
                                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value={user.email} className="text-white hover:bg-slate-700">
                                        {user.nickname || user.full_name} (Me)
                                    </SelectItem>
                                    {team.filter(member => member.id !== user.id).map(member => (
                                        <SelectItem key={member.id} value={member.email} className="text-white hover:bg-slate-700">
                                            {member.nickname || member.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label className="text-white">Deadline</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.deadline ? format(formData.deadline, 'PPP') : 'Pick a date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                                <Calendar
                                    mode="single"
                                    selected={formData.deadline}
                                    onSelect={(date) => setFormData({...formData, deadline: date})}
                                    initialFocus
                                    className="text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="recurring" 
                                checked={formData.is_recurring}
                                onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
                            />
                            <Label htmlFor="recurring" className="text-white flex items-center gap-2">
                                <Repeat className="w-4 h-4" />
                                Make this a recurring reminder
                            </Label>
                        </div>

                        {formData.is_recurring && (
                            <div className="pl-6">
                                <div className="space-y-2">
                                    <Label className="text-white">Frequency</Label>
                                    <Select 
                                        value={formData.recurrence_type} 
                                        onValueChange={value => setFormData({...formData, recurrence_type: value})}
                                    >
                                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700">
                                            <SelectItem value="daily" className="text-white hover:bg-slate-700">Daily</SelectItem>
                                            <SelectItem value="weekly" className="text-white hover:bg-slate-700">Weekly</SelectItem>
                                            <SelectItem value="monthly" className="text-white hover:bg-slate-700">Monthly</SelectItem>
                                            <SelectItem value="yearly" className="text-white hover:bg-slate-700">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Create Reminder
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}