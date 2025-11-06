
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SocialMediaExecution, ExecutionTask, Client, User, Reminder } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Users, Loader2, Trash2, Edit, Calendar as CalendarIcon, Link, ListChecks, MoreVertical, ChevronDown, ChevronRight, Save, ExternalLink, X, User as UserIcon, Search, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow, isToday, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const ExecutionForm = ({ execution, clients, team, onSubmitted, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        client_id: '',
        client_name: '',
        social_links: [''],
        assignee_email: '',
        asset_links: ['']
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (execution) {
            setFormData({
                title: execution.title || '',
                client_id: execution.client_id || '',
                client_name: execution.client_name || '',
                social_links: execution.social_links?.length > 0 ? execution.social_links : [''],
                assignee_email: execution.assignee_email || '',
                asset_links: execution.asset_links?.length > 0 ? execution.asset_links : ['']
            });
        } else {
            setFormData({
                title: '',
                client_id: '',
                client_name: '',
                social_links: [''],
                assignee_email: '',
                asset_links: ['']
            });
        }
    }, [execution]);

    const addSocialLink = () => {
        setFormData(prev => ({ ...prev, social_links: [...prev.social_links, ''] }));
    };

    const removeSocialLink = (index) => {
        setFormData(prev => ({
            ...prev,
            social_links: prev.social_links.filter((_, i) => i !== index)
        }));
    };

    const updateSocialLink = (index, value) => {
        setFormData(prev => ({
            ...prev,
            social_links: prev.social_links.map((link, i) => i === index ? value : link)
        }));
    };

    const addAssetLink = () => {
        setFormData(prev => ({ ...prev, asset_links: [...prev.asset_links, ''] }));
    };

    const removeAssetLink = (index) => {
        setFormData(prev => ({
            ...prev,
            asset_links: prev.asset_links.filter((_, i) => i !== index)
        }));
    };

    const updateAssetLink = (index, value) => {
        setFormData(prev => ({
            ...prev,
            asset_links: prev.asset_links.map((link, i) => i === index ? value : link)
        }));
    };

    const handleClientChange = (clientId) => {
        const selectedClient = clients.find(c => c.id === clientId);
        setFormData(prev => ({
            ...prev,
            client_id: clientId,
            client_name: selectedClient?.client_name || ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const dataToSubmit = {
            ...formData,
            social_links: formData.social_links.filter(link => link.trim() !== ''),
            asset_links: formData.asset_links.filter(link => link.trim() !== '')
        };

        try {
            if (execution?.id) {
                await SocialMediaExecution.update(execution.id, dataToSubmit);
                toast({ title: 'Success', description: 'Execution updated.' });
            } else {
                if (!dataToSubmit.client_id) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Please select a client.' });
                    setIsSubmitting(false);
                    return;
                }
                await SocialMediaExecution.create(dataToSubmit);
                toast({ title: 'Success', description: 'New execution created.' });
            }
            onSubmitted();
        } catch (error) {
            console.error("Failed to save execution:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save execution.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="executionTitle">Title</Label>
                <Input
                    id="executionTitle"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="clientSelect">Client</Label>
                <Select value={formData.client_id} onValueChange={handleClientChange}>
                    <SelectTrigger id="clientSelect">
                        <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                                {client.client_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="assigneeSelect">Assignee</Label>
                <Select value={formData.assignee_email} onValueChange={(value) => setFormData(prev => ({ ...prev, assignee_email: value }))}>
                    <SelectTrigger id="assigneeSelect">
                        <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        {team.map(member => (
                            <SelectItem key={member.email} value={member.email}>
                                {member.nickname || member.full_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Social Media Links</Label>
                {formData.social_links.map((link, index) => (
                    <div key={index} className="flex gap-2 items-center">
                        <Input
                            value={link}
                            onChange={(e) => updateSocialLink(index, e.target.value)}
                            placeholder="https://facebook.com/page or https://instagram.com/account"
                        />
                        {formData.social_links.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addSocialLink}>
                    <Plus className="w-4 h-4 mr-2" /> Add Social Link
                </Button>
            </div>

            <div className="space-y-2">
                <Label>Asset Links</Label>
                {formData.asset_links.map((link, index) => (
                    <div key={index} className="flex gap-2 items-center">
                        <Input
                            value={link}
                            onChange={(e) => updateAssetLink(index, e.target.value)}
                            placeholder="https://drive.google.com/... or other asset link"
                        />
                        {formData.asset_links.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAssetLink(index)}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addAssetLink}>
                    <Plus className="w-4 h-4 mr-2" /> Add Asset Link
                </Button>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {execution ? 'Update Execution' : 'Create Execution'}
                </Button>
            </div>
        </form>
    );
};

const TaskForm = ({ task, execution, onSubmitted, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        due_date: null,
        type: 'Post',
        content_brief: '',
        status: 'In Progress',
        related_reminder_id: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (task) {
            setFormData({
                name: task.name || '',
                due_date: task.due_date ? new Date(task.due_date) : null,
                type: task.type || 'Post',
                content_brief: task.content_brief || '',
                status: task.status || 'In Progress',
                related_reminder_id: task.related_reminder_id || null,
            });
        } else {
            setFormData(prev => ({
                ...prev,
                related_reminder_id: null, // Ensure new tasks don't inherit old reminder IDs
            }));
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const currentDueDate = formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null;

        try {
            const dataToSubmit = {
                ...formData,
                execution_id: execution.id,
                due_date: currentDueDate,
                is_completed: task?.is_completed || false,
                related_reminder_id: formData.related_reminder_id,
            };

            let updatedTask = null;
            if (task) {
                await ExecutionTask.update(task.id, dataToSubmit);
                updatedTask = { ...task, ...dataToSubmit };
                toast({ title: 'Task Updated', description: `"${formData.name}" has been updated.` });
            } else {
                updatedTask = await ExecutionTask.create(dataToSubmit);
                toast({ title: 'Task Added', description: `"${formData.name}" has been added.` });
            }

            if (currentDueDate && execution.assignee_email) {
                const reminderData = {
                    user_email: execution.assignee_email,
                    title: `Task Deadline: ${formData.name}`,
                    description: `For social media execution: "${execution.title}"`,
                    deadline: new Date(currentDueDate).toISOString(),
                    reminder_type: 'task_related',
                    related_job_id: updatedTask.id
                };

                if (formData.related_reminder_id) {
                    await Reminder.update(formData.related_reminder_id, reminderData);
                } else {
                    const newReminder = await Reminder.create(reminderData);
                    if (!task || !task.related_reminder_id) { // Only update if it's a new task or an existing task that didn't have a reminder
                        await ExecutionTask.update(updatedTask.id, { related_reminder_id: newReminder.id });
                    }
                }
            } else if (!currentDueDate && formData.related_reminder_id) {
                await Reminder.delete(formData.related_reminder_id);
                await ExecutionTask.update(updatedTask.id, { related_reminder_id: null });
            }

            onSubmitted();
        } catch (error) {
            console.error("Error saving task:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the task or update reminder.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                    id="taskName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="dueDate"
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.due_date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.due_date ? format(formData.due_date, 'PPP') : 'Select date'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={formData.due_date}
                            onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label htmlFor="taskType">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger id="taskType">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Post">Post</SelectItem>
                        <SelectItem value="Story">Story</SelectItem>
                        <SelectItem value="Reel">Reel</SelectItem>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="taskStatus">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger id="taskStatus">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                        <SelectItem value="Waiting for Client">Waiting for Client</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="For Posting">For Posting</SelectItem>
                        <SelectItem value="Posted">Posted</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="contentBrief">Content Brief</Label>
                <Textarea
                    id="contentBrief"
                    value={formData.content_brief}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_brief: e.target.value }))}
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {task ? 'Update Task' : 'Add Task'}
                </Button>
            </div>
        </form>
    );
};

const ExecutionTaskCard = ({ task, team, onSelect, onToggle, onDelete }) => {
    const assignee = team.find(t => t.email === task.parentExecution?.assignee_email);
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !task.is_completed;
    const isDueToday = task.due_date && isToday(new Date(task.due_date)) && !task.is_completed;
    const isUrgent = isOverdue || isDueToday;

    const getStatusColor = (status) => {
        const colors = {
            'Pending Approval': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
            'Waiting for Client': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
            'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
            'For Posting': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
            'Posted': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
            'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    return (
        <Card 
            className={cn(
                "bg-card border-border hover:shadow-md transition-shadow duration-200 cursor-pointer",
                isUrgent && !task.is_completed && "bg-red-900/20 border-red-500/50 hover:bg-red-900/30"
            )} 
            onClick={() => onSelect(task)}
        >
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Checkbox
                            id={`task-complete-${task.id}`}
                            checked={task.is_completed}
                            onCheckedChange={(checked) => onToggle(task.id, checked)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Label 
                            htmlFor={`task-complete-${task.id}`} 
                            className={cn(
                                "font-medium hover:underline flex-1 truncate cursor-pointer",
                                task.is_completed && 'line-through text-muted-foreground',
                                isUrgent && !task.is_completed && "text-red-300"
                            )}
                        >
                            {task.name}
                        </Label>
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-7 w-7 flex-shrink-0">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(task); }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(task); }} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Task
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground ml-6">
                    {task.parentExecution && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-foreground truncate max-w-[120px]">{task.parentExecution.title}</span>
                        </div>
                    )}
                    {task.parentExecution?.client_name && (
                        <div className="flex items-center gap-1">
                            <span className="truncate max-w-[120px]">{task.parentExecution.client_name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[80px]">
                            {assignee ? assignee.nickname || assignee.full_name : 'Unassigned'}
                        </span>
                    </div>
                    {task.due_date && (
                        <div className={cn(
                            "flex items-center gap-1",
                            isUrgent && !task.is_completed && "text-red-400 font-bold"
                        )}>
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>
                                {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                            </span>
                        </div>
                    )}
                    <Badge className={getStatusColor(task.status)} variant="secondary">
                        {task.status}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
};

const TaskTypeSection = ({ taskType, tasks, team, onTaskClick, onTaskToggle, onDeleteTask }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-8 w-8"
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                        <CardTitle className="text-lg capitalize">{taskType} Tasks ({tasks.length})</CardTitle>
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="space-y-3">
                    {tasks.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">No {taskType.toLowerCase()} tasks yet.</p>
                    ) : (
                        tasks.map(task => (
                            <ExecutionTaskCard
                                key={task.id}
                                task={task}
                                team={team}
                                onSelect={onTaskClick}
                                onToggle={onTaskToggle}
                                onDelete={onDeleteTask}
                            />
                        ))
                    )}
                </CardContent>
            )}
        </Card>
    );
};

export default function SocialMediaExecutions({ clients, team }) {
    const [executions, setExecutions] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExecution, setEditingExecution] = useState(null);
    const [deletingTask, setDeletingTask] = useState(null); // Changed from deletingExecution
    const [showTaskFormDialog, setShowTaskFormDialog] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedExecutionForTask, setSelectedExecutionForTask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');
    const { toast } = useToast();

    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const executionsData = await SocialMediaExecution.list('-created_date');
            setExecutions(executionsData);

            const tasksData = await ExecutionTask.list('-due_date');
            setAllTasks(tasksData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load executions and tasks.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const handleFormSubmitted = () => {
        setIsFormOpen(false);
        setEditingExecution(null);
        loadAllData();
    };

    const handleAddExecution = () => {
        setEditingExecution(null); // Ensure we're creating a new one
        setIsFormOpen(true);
    };

    // This function will be called from ExecutionTaskCard's dropdown menu
    const handleDeleteTaskConfirmed = async () => {
        if (!deletingTask) return;
        try {
            // Try to delete the related reminder if it exists, but don't fail if it doesn't
            if (deletingTask.related_reminder_id) {
                try {
                    await Reminder.delete(deletingTask.related_reminder_id);
                } catch (reminderError) {
                    // Log the error but continue with task deletion
                    console.warn('Could not delete reminder (may not exist):', reminderError);
                }
            }
            
            // Delete the task
            await ExecutionTask.delete(deletingTask.id);
            toast({ title: "Success", description: "Task deleted." });
            setDeletingTask(null);
            loadAllData();
        } catch (error) {
            console.error("Error deleting task:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task.' });
        }
    };

    const handleTaskToggle = async (taskId, isCompleted) => {
        try {
            await ExecutionTask.update(taskId, { is_completed: isCompleted });
            toast({ title: "Task Status Updated", description: "Task completion status changed." });
            loadAllData();
        } catch (error) {
            console.error("Error updating task status:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task status.' });
        }
    };

    const handleTaskClick = (task) => {
        setEditingTask(task);
        setSelectedExecutionForTask(executions.find(e => e.id === task.execution_id));
        setShowTaskFormDialog(true);
    };

    const handleTaskFormSubmit = () => {
        setShowTaskFormDialog(false);
        setEditingTask(null);
        setSelectedExecutionForTask(null);
        loadAllData();
    };

    const handleTaskFormCancel = () => {
        setShowTaskFormDialog(false);
        setEditingTask(null);
        setSelectedExecutionForTask(null);
    };

    // Create execution map for enrichment
    const executionMap = useMemo(() => {
        return new Map(executions.map(exec => [exec.id, exec]));
    }, [executions]);

    // Filter tasks
    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            const parentExecution = executionMap.get(task.execution_id);
            if (!parentExecution) return false; // Task without a parent execution should not be shown

            const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 parentExecution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 parentExecution.client_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAssignee = assigneeFilter === 'all' || parentExecution.assignee_email === assigneeFilter;
            const matchesClient = clientFilter === 'all' || parentExecution.client_name === clientFilter;
            
            return matchesSearch && matchesAssignee && matchesClient;
        });
    }, [allTasks, executionMap, searchTerm, assigneeFilter, clientFilter]);

    // Group tasks by type with enriched parent execution data
    const tasksByTaskType = useMemo(() => {
        const grouped = {};
        filteredTasks.forEach(task => {
            const parentExecution = executionMap.get(task.execution_id);
            if (parentExecution) { // Ensure parent execution exists before grouping
                if (!grouped[task.type]) {
                    grouped[task.type] = [];
                }
                // Enrich task with its parent execution details
                grouped[task.type].push({ ...task, parentExecution });
            }
        });
        return grouped;
    }, [filteredTasks, executionMap]);

    // Get unique clients for filter
    const uniqueClients = useMemo(() => {
        return [...new Set(executions.map(e => e.client_name))].sort();
    }, [executions]);

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header with filters and search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-2">
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleAddExecution}><Plus className="mr-2 h-4 w-4" /> New Execution</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Create New Execution</DialogTitle></DialogHeader>
                            <ExecutionForm
                                execution={editingExecution}
                                clients={clients}
                                team={team}
                                onSubmitted={handleFormSubmitted}
                                onCancel={() => { setIsFormOpen(false); setEditingExecution(null); }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search tasks, executions, or clients..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by client" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {uniqueClients.map(client => (
                            <SelectItem key={client} value={client}>{client}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Team Members</SelectItem>
                        {team.map(member => (
                            <SelectItem key={member.email} value={member.email}>
                                {member.nickname || member.full_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Task Type sections */}
            {Object.keys(tasksByTaskType).length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                    <ListChecks className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No Tasks Found</h3>
                    <p className="text-muted-foreground mt-2">
                        {allTasks.length === 0 
                            ? "Get started by creating your first social media execution plan."
                            : "Try adjusting your filters or search term."
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(tasksByTaskType)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([taskType, tasksOfType]) => (
                            <TaskTypeSection
                                key={taskType}
                                taskType={taskType}
                                tasks={tasksOfType}
                                team={team}
                                onTaskClick={handleTaskClick}
                                onTaskToggle={handleTaskToggle}
                                onDeleteTask={setDeletingTask}
                            />
                        ))}
                </div>
            )}
            
            {/* Task Form Dialog */}
            {showTaskFormDialog && (
                <Dialog open={showTaskFormDialog} onOpenChange={setShowTaskFormDialog}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingTask ? 'Edit' : 'Add New'} Task</DialogTitle>
                        </DialogHeader>
                        {selectedExecutionForTask && (
                          <TaskForm
                              task={editingTask}
                              execution={selectedExecutionForTask}
                              onSubmitted={handleTaskFormSubmit}
                              onCancel={handleTaskFormCancel}
                          />
                        )}
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation AlertDialog */}
            {deletingTask && (
                <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the task "{deletingTask?.name}" and its associated reminder. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTaskConfirmed}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}
