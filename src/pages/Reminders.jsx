
import React, { useState, useEffect, useCallback } from 'react';
import { Reminder, User, Printer as PrinterEntity } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger }
  from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bell, ListChecks, CalendarIcon, Briefcase, Printer as PrinterIcon, Check, Edit, Trash2, Wrench } from 'lucide-react';
import { format, isPast, isToday, isBefore, startOfDay, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import QuickReminderModal from '../components/reminders/QuickReminderModal';
import PrinterScheduleForm from '../components/reminders/PrinterScheduleForm';

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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Reminder</Button>
      </div>
    </form>
  );
};

const GeneralReminderItem = ({ reminder, assignedUser, onToggle, onEdit, onDelete, isSelected, onSelect }) => {
  const isOverdue = reminder.deadline && isPast(new Date(reminder.deadline)) && !isToday(new Date(reminder.deadline));
  const isDueToday = reminder.deadline && isToday(new Date(reminder.deadline));
  const isCompleted = reminder.status === 'completed';

  let statusText = reminder.deadline ? `Due ${format(new Date(reminder.deadline), "PPp")}` : "No deadline";
  let statusColor = "text-muted-foreground";

  if (isCompleted) {
    statusText = "Completed";
    statusColor = "text-green-500";
  } else if (isDueToday) {
    statusText = `Due today at ${format(new Date(reminder.deadline), "p")}`;
    statusColor = "text-blue-500";
  } else if (isOverdue) {
    statusText = `Overdue since ${format(new Date(reminder.deadline), "PP")}`;
    statusColor = "text-destructive";
  }

  return (
    <Card className={cn("bg-card border-border", isCompleted && "bg-green-50 border-green-200", isSelected && "ring-2 ring-primary")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              id={`select-reminder-${reminder.id}`}
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <Checkbox
              id={`reminder-${reminder.id}`}
              checked={isCompleted}
              onCheckedChange={(checked) => onToggle(reminder.id, checked)}
              className="mt-1"
            />
            <Bell className={cn("w-4 h-4 mt-1", isCompleted ? "text-green-500" : "text-gray-500")} />
            <div className="flex-1">
              <label 
                htmlFor={`reminder-${reminder.id}`} 
                className={cn("font-medium text-foreground cursor-pointer", isCompleted && "line-through text-green-600")}
              >
                {reminder.title}
              </label>
              {reminder.description && <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>}
              <div className="flex items-center gap-2">
                <div className={cn("text-sm mt-2", statusColor)}>{statusText}</div>
                {assignedUser && (
                  <div className="text-sm mt-2 text-muted-foreground">
                    • For: {assignedUser.nickname || assignedUser.full_name}
                  </div>
                )}
              </div>
              {reminder.is_recurring && (
                <Badge variant="secondary" className="mt-1">Recurring: {reminder.recurrence_type}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button variant="ghost" size="icon" onClick={() => onEdit(reminder)} className="h-8 w-8">
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(reminder.id)} className="h-8 w-8">
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PrinterReminderItem = ({ reminder, printer, assignedUser, onComplete, onEdit }) => {
  const isDueToday = reminder.deadline && isToday(new Date(reminder.deadline));
  const isCompleted = reminder.maintenance_completed_today;

  return (
    <Card className={cn("bg-card border-border", isCompleted && "bg-green-50 border-green-200")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <PrinterIcon className={cn("w-4 h-4 mt-1", isCompleted ? "text-green-500" : "text-green-500")} />
            <div className="flex-1">
              <h4 className={cn("font-medium text-foreground", isCompleted && "line-through text-green-600")}>
                {reminder.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                Assigned to: {assignedUser ? (assignedUser.nickname || assignedUser.full_name) : 'Unassigned'}
              </p>
              <p className="text-sm text-muted-foreground">
                Last cleaned: {printer?.last_cleaned_date ? format(new Date(printer.last_cleaned_date), "PPP") : "Never"}
              </p>
              <div className={cn("text-sm mt-1", 
                isCompleted ? "text-green-500" : 
                isDueToday ? "text-blue-500" : "text-muted-foreground"
              )}>
                {isCompleted ? "Completed for today" : isDueToday ? "Due today" : format(new Date(reminder.deadline), "PPP")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
             <Button variant="ghost" size="icon" onClick={() => onEdit(printer)} className="h-8 w-8">
                <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={isCompleted ? "secondary" : "outline"}
              onClick={() => onComplete(reminder)}
              disabled={isCompleted}
              className="h-8"
            >
              <Check className="w-3 h-3 mr-1" />
              {isCompleted ? "Done" : "Mark as Done"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickReminder, setShowQuickReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPrinterForm, setShowPrinterForm] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [selectedReminders, setSelectedReminders] = useState(new Set());
  const { toast } = useToast();

  const resetPrinterReminders = async () => {
    try {
      const todayStart = startOfDay(new Date());

      // Get all printer maintenance reminders
      const printerReminders = await Reminder.filter({
        reminder_type: 'printer_maintenance'
      });

      for (const reminder of printerReminders) {
        if (!reminder.deadline) continue;

        const reminderDate = startOfDay(new Date(reminder.deadline));
        
        // If the reminder's deadline is in the past AND it was marked completed today,
        // it means the user already completed it, and we don't reset its deadline.
        // We only reset its `maintenance_completed_today` status for the *new* day.
        if (isBefore(reminderDate, todayStart)) {
          // Reset the deadline to today at 8 AM and set maintenance_completed_today to false
          const newDeadline = new Date();
          newDeadline.setHours(8, 0, 0, 0);

          await Reminder.update(reminder.id, {
            deadline: newDeadline.toISOString(),
            maintenance_completed_today: false // Reset for the new day
          });
        } else if (reminder.maintenance_completed_today && !isToday(new Date(reminder.last_maintenance_date || 0))) {
          // If it was completed today but not for the current day (e.g., user completed it early),
          // ensure its `maintenance_completed_today` flag is reset if the last completion was not today.
          await Reminder.update(reminder.id, {
            maintenance_completed_today: false
          });
        }
      }
    } catch (error) {
      console.error('Error resetting printer reminders:', error);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Reset printer reminders first
      await resetPrinterReminders();
      
      const [remindersData, printersData, userData, teamData] = await Promise.all([
        Reminder.list('-deadline'), // Show all reminders, not just pending
        PrinterEntity.list(),
        User.me(),
        User.list(),
      ]);
      setReminders(remindersData);
      setPrinters(printersData);
      setUser(userData);
      setTeam(teamData);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleReminder = async (id, isCompleted) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) {
        toast({ variant: 'destructive', title: 'Error', description: 'Reminder not found.' });
        return;
      }
      const newStatus = isCompleted ? 'completed' : 'pending';

      if (isCompleted && reminder.is_recurring && reminder.reminder_type === 'general') {
        // For recurring general reminders, reset the deadline instead of marking as completed
        let newDeadline = new Date(reminder.deadline);

        switch (reminder.recurrence_type) {
          case 'daily':
            newDeadline = addDays(newDeadline, 1);
            break;
          case 'weekly':
            newDeadline = addWeeks(newDeadline, 1);
            break;
          case 'monthly':
            newDeadline = addMonths(newDeadline, 1);
            break;
          case 'yearly':
            newDeadline = addYears(newDeadline, 1);
            break;
          default:
            newDeadline = addDays(newDeadline, 1);
            break;
        }

        await Reminder.update(id, { deadline: newDeadline.toISOString(), status: 'pending' });
        toast({ title: 'Success', description: `Recurring reminder reset to ${format(newDeadline, 'PPP')}.` });
      } else {
        await Reminder.update(id, { status: newStatus });
        toast({ title: 'Success', description: `Reminder marked as ${newStatus}.` });
      }

      loadData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update reminder.' });
    }
  };

  const handleCompletePrinterMaintenance = async (reminder) => {
    try {
      // Mark maintenance as completed for today
      await Reminder.update(reminder.id, {
        maintenance_completed_today: true,
        last_maintenance_date: new Date().toISOString()
      });

      // Update the printer's last cleaned date
      if (reminder.related_printer_id) {
        await PrinterEntity.update(reminder.related_printer_id, {
          last_cleaned_date: new Date().toISOString().split('T')[0]
        });
      }

      toast({ title: 'Printer Maintenance Completed', description: 'Maintenance logged successfully.' });
      loadData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete maintenance.' });
    }
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setShowEditForm(true);
  };

  const handleDeleteReminder = async (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await Reminder.delete(reminderId);
        toast({ title: 'Reminder Deleted', description: 'Reminder has been deleted.' });
        loadData();
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
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update reminder.' });
    }
  };

  const handleEditPrinter = (printer) => {
    setEditingPrinter(printer);
    setShowPrinterForm(true);
  };

  const handlePrinterFormSubmit = async (printerData) => {
    try {
      if (editingPrinter) {
        // Update existing printer
        await PrinterEntity.update(editingPrinter.id, {
          name: printerData.name,
          assigned_to: printerData.assigned_to,
        });

        const associatedReminder = reminders.find(r => r.related_printer_id === editingPrinter.id);
        if (associatedReminder) {
          await Reminder.update(associatedReminder.id, {
            title: `Maintenance for ${printerData.name}`,
            user_email: printerData.assigned_to,
          });
        }
        toast({ title: 'Success', description: 'Printer schedule updated.' });
      } else {
        // Create new printer and reminder
        const newPrinter = await PrinterEntity.create({
          name: printerData.name,
          assigned_to: printerData.assigned_to,
        });

        const newDeadline = new Date();
        newDeadline.setHours(8, 0, 0, 0);

        await Reminder.create({
          user_email: newPrinter.assigned_to,
          title: `Maintenance for ${newPrinter.name}`,
          description: `Daily cleaning task for ${newPrinter.name}.`,
          deadline: newDeadline.toISOString(),
          status: 'pending',
          reminder_type: 'printer_maintenance',
          related_printer_id: newPrinter.id,
          maintenance_completed_today: false // Initialize
        });
        toast({ title: 'Success', description: 'New printer schedule created.' });
      }
      setShowPrinterForm(false);
      setEditingPrinter(null);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save printer schedule.' });
    }
  };

  const handleSelectReminder = (reminderId) => {
    setSelectedReminders(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(reminderId)) {
        newSelection.delete(reminderId);
      } else {
        newSelection.add(reminderId);
      }
      return newSelection;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedReminders.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedReminders.size} reminders?`)) {
      try {
        await Promise.all(
          Array.from(selectedReminders).map(id => Reminder.delete(id))
        );
        toast({ title: 'Success', description: `${selectedReminders.size} reminders deleted.` });
        setSelectedReminders(new Set());
        loadData();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete reminders.' });
      }
    }
  };


  const generalReminders = reminders.filter(r => r.reminder_type !== 'printer_maintenance');
  const printerReminders = reminders.filter(r => r.reminder_type === 'printer_maintenance');

  // De-duplicate printer reminders, showing only one per printer
  const uniquePrinterReminders = Array.from(new Map(printerReminders.map(r => [r.related_printer_id, r])).values());

  return (
    <>
      <div className="p-4 md:p-8 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reminders</h1>
              <p className="text-muted-foreground mt-1">Stay on top of your tasks and maintenance schedules.</p>
            </div>
            <Button onClick={() => setShowQuickReminder(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Reminder
            </Button>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">
                <Bell className="w-4 h-4 mr-2" />
                General ({generalReminders.length})
              </TabsTrigger>
              <TabsTrigger value="printer">
                <Wrench className="w-4 h-4 mr-2" />
                Printer Maintenance ({uniquePrinterReminders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <div className="flex justify-end mb-4">
                {selectedReminders.size > 0 && (
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedReminders.size})
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-center text-muted-foreground">Loading...</p>
                ) : generalReminders.length === 0 ? (
                  <div className="text-center py-12">
                    <ListChecks className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No General Reminders</h3>
                    <p className="text-muted-foreground mt-2">You have no general reminders.</p>
                  </div>
                ) : (
                  generalReminders.map(reminder => {
                    const assignedUser = team.find(u => u.email === reminder.user_email);
                    return (
                      <GeneralReminderItem
                        key={reminder.id}
                        reminder={reminder}
                        assignedUser={assignedUser}
                        onToggle={handleToggleReminder}
                        onEdit={handleEditReminder}
                        onDelete={handleDeleteReminder}
                        isSelected={selectedReminders.has(reminder.id)}
                        onSelect={() => handleSelectReminder(reminder.id)}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="printer" className="mt-6">
              <div className="flex justify-end mb-4">
                <Button onClick={() => { setEditingPrinter(null); setShowPrinterForm(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> New Printer Schedule
                </Button>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-center text-muted-foreground">Loading...</p>
                ) : uniquePrinterReminders.length === 0 ? (
                  <div className="text-center py-12">
                    <PrinterIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No Printer Maintenance</h3>
                    <p className="text-muted-foreground mt-2">All printer maintenance is up to date.</p>
                  </div>
                ) : (
                  uniquePrinterReminders.map(reminder => {
                    const printer = printers.find(p => p.id === reminder.related_printer_id);
                    const assignedUser = team.find(u => u.email === printer?.assigned_to);
                    return (
                      <PrinterReminderItem
                        key={reminder.id}
                        reminder={reminder}
                        printer={printer}
                        assignedUser={assignedUser}
                        onComplete={handleCompletePrinterMaintenance}
                        onEdit={handleEditPrinter}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showQuickReminder && (
        <QuickReminderModal
          isOpen={showQuickReminder}
          onClose={() => setShowQuickReminder(false)}
          user={user}
          onReminderCreated={loadData}
        />
      )}

      {/* General Edit Reminder Dialog */}
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

      {/* Printer Schedule Form Dialog */}
      <Dialog open={showPrinterForm} onOpenChange={setShowPrinterForm}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle>{editingPrinter ? 'Edit' : 'New'} Printer Schedule</DialogTitle>
          </DialogHeader>
          <PrinterScheduleForm
            printer={editingPrinter}
            users={team}
            onSubmit={handlePrinterFormSubmit}
            onCancel={() => setShowPrinterForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
