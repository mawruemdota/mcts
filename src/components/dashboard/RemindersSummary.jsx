import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Bell, ListChecks, CalendarIcon, Briefcase, Printer as PrinterIcon, ChevronRight, Check, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, formatDistanceToNow, isToday, isPast, isBefore, startOfDay } from 'date-fns';
import { Reminder, Printer as PrinterEntity } from '@/entities/all';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const ReminderCard = ({ reminder, printer, onComplete, onEdit, onDelete, showActions = true }) => {
  const isOverdue = reminder.deadline && isPast(new Date(reminder.deadline)) && !isToday(new Date(reminder.deadline));
  const isDueToday = reminder.deadline && isToday(new Date(reminder.deadline));

  let statusText = reminder.deadline ? `Due ${format(new Date(reminder.deadline), "PPp")}` : "No deadline";
  let statusColor = "text-muted-foreground";

  if (isDueToday) {
    statusText = `Due today at ${format(new Date(reminder.deadline), "p")}`;
    statusColor = "text-blue-500";
  }
  if (isOverdue) {
    statusText = `Overdue since ${format(new Date(reminder.deadline), "PP")}`;
    statusColor = "text-destructive";
  }

  const reminderType = reminder.reminder_type || 'general';
  const reminderTypeConfig = {
    general: { icon: Bell, color: 'text-gray-500' },
    task_related: { icon: Briefcase, color: 'text-blue-500' },
    printer_maintenance: { icon: PrinterIcon, color: 'text-green-500' },
  };
  const Icon = reminderTypeConfig[reminderType]?.icon || Bell;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={cn("w-4 h-4 mt-1", reminderTypeConfig[reminderType]?.color)} />
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{reminder.title}</h4>
              {reminder.description && <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>}
              {printer && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last cleaned: {printer.last_cleaned_date ? format(new Date(printer.last_cleaned_date), "MMM d") : "Never"}
                </p>
              )}
              <p className={cn("text-sm mt-2", statusColor)}>{statusText}</p>
            </div>
          </div>
          {showActions && (
            <div className="flex items-center gap-1 ml-4">
              {reminder.reminder_type === 'printer_maintenance' ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onComplete(reminder)}
                  className="h-8"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Done
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(reminder)} className="h-8 w-8">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(reminder.id)} className="h-8 w-8">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onComplete(reminder)}
                    className="h-8"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Done
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function RemindersSummary({ user }) {
  const [reminders, setReminders] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReminder, setEditingReminder] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();

  const resetPrinterReminders = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayStart = startOfDay(new Date());
      
      // Get all printer maintenance reminders
      const printerReminders = await Reminder.filter({ 
        reminder_type: 'printer_maintenance',
        status: 'pending' // Only reset pending reminders
      });

      // Reset reminders that are from previous days to today
      for (const reminder of printerReminders) {
        if (!reminder.deadline) continue;
        
        const reminderDate = startOfDay(new Date(reminder.deadline));
        if (isBefore(reminderDate, todayStart)) {
          // Reset the deadline to today at 8 AM and mark as not completed today
          const newDeadline = new Date();
          newDeadline.setHours(8, 0, 0, 0);
          
          await Reminder.update(reminder.id, {
            deadline: newDeadline.toISOString(),
            maintenance_completed_today: false // Ensure it's active for today
          });
        }
      }
    } catch (error) {
      console.error('Error resetting printer reminders:', error);
    }
  }, []);

  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      // Reset printer reminders first
      await resetPrinterReminders();
      
      const [remindersData, printersData] = await Promise.all([
        Reminder.list('-deadline'), // Fetch all and filter client-side
        PrinterEntity.list()
      ]);
      
      setReminders(remindersData);
      setPrinters(printersData);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load reminders.' });
    }
    setIsLoading(false);
  }, [toast, resetPrinterReminders]);

  useEffect(() => {
    if(user?.email) {
      loadReminders();
    } else {
      setIsLoading(false);
    }
  }, [user?.email, loadReminders]);

  const handleCompleteReminder = async (reminder) => {
    try {
      if (reminder.reminder_type === 'printer_maintenance') {
        // Update the printer's last cleaned date
        if (reminder.related_printer_id) {
          await PrinterEntity.update(reminder.related_printer_id, { 
            last_cleaned_date: new Date().toISOString().split('T')[0] 
          });
        }
        
        // Mark as completed for today
        await Reminder.update(reminder.id, {
          maintenance_completed_today: true,
          last_maintenance_date: new Date().toISOString(),
        });
        
        toast({ title: 'Printer Maintenance Completed', description: 'Maintenance logged for today.' });
      } else {
        // For general reminders, just mark as completed
        await Reminder.update(reminder.id, { status: 'completed' });
        toast({ title: 'Reminder Completed', description: 'Reminder marked as completed.' });
      }
      loadReminders();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete reminder.' });
    }
  };

  const handleEditReminder = (rem) => {
    setEditingReminder(rem);
    setShowEditForm(true);
  };

  const handleDeleteReminder = async (remId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await Reminder.delete(remId);
        toast({ title: 'Reminder Deleted', description: 'Reminder has been deleted.' });
        loadReminders();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete reminder.' });
      }
    }
  };

  const handleUpdateReminder = async (reminderData) => {
    try {
      await Reminder.update(editingReminder.id, reminderData);
      toast({ title: 'Success', description: 'Reminder updated successfully.' });
      setShowEditForm(false);
      setEditingReminder(null);
      loadReminders();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update reminder.' });
    }
  };

  // Filter reminders for dashboard
  const pendingReminders = reminders.filter(r => {
    // General reminders for the user that are pending
    if (r.reminder_type === 'general' && r.user_email === user?.email && r.status === 'pending') {
      return true;
    }
    
    // Printer maintenance for printers assigned to the user
    if (r.reminder_type === 'printer_maintenance') {
      const printer = printers.find(p => p.id === r.related_printer_id);
      // Only show if assigned to user AND not completed today
      if (printer?.assigned_to === user?.email && r.maintenance_completed_today !== true) {
        return true;
      }
    }
    
    return false;
  });

  // De-duplicate printer reminders for the dashboard view
  const uniquePendingReminders = Array.from(new Map(pendingReminders.map(r => 
    [r.reminder_type === 'printer_maintenance' ? r.related_printer_id : r.id, r]
  )).values());


  return (
    <Card className="bg-card border-border w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          My Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : uniquePendingReminders.length > 0 ? (
          <div className="space-y-3">
            {uniquePendingReminders.slice(0, 3).map(reminder => {
              const printer = printers.find(p => p.id === reminder.related_printer_id);
              return (
                <ReminderCard 
                  key={reminder.id} 
                  reminder={reminder} 
                  printer={printer}
                  onComplete={handleCompleteReminder}
                  onEdit={handleEditReminder}
                  onDelete={handleDeleteReminder}
                  showActions={true}
                />
              );
            })}
            {uniquePendingReminders.length > 3 && (
              <Link to={createPageUrl('Reminders')}>
                <Button variant="ghost" size="sm" className="w-full">
                  View All ({uniquePendingReminders.length}) <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No pending reminders. All caught up!</p>
        )}
      </CardContent>

      {/* Edit Reminder Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
          </DialogHeader>
          {editingReminder && (
            <ReminderEditForm 
              reminder={editingReminder} 
              onSubmit={handleUpdateReminder}
              onCancel={() => setShowEditForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const ReminderEditForm = ({ reminder, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: reminder.title || '',
    description: reminder.description || '',
    deadline: reminder.deadline ? new Date(reminder.deadline) : null,
    reminder_type: reminder.reminder_type || 'general'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      deadline: formData.deadline ? formData.deadline.toISOString() : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input 
          value={formData.title} 
          onChange={e => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Deadline</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.deadline ? format(formData.deadline, 'PPP') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.deadline}
              onSelect={(date) => setFormData({...formData, deadline: date})}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Reminder Type</label>
        <Select
          value={formData.reminder_type}
          onValueChange={(value) => setFormData({ ...formData, reminder_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="task_related">Task-related</SelectItem>
            <SelectItem value="printer_maintenance">Printer Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Reminder</Button>
      </div>
    </form>
  );
};