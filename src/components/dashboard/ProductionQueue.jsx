import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, User } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, UserCheck, Plus, Loader2, Package, Edit, User as UserIcon, Calendar, Check } from 'lucide-react';
import { formatDistanceToNow, isToday } from 'date-fns';
import JobDetails from '@/components/jobs/JobDetails';
import NewTaskModal from '@/components/jobs/NewTaskModal';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const statusConfig = {
  pending_approval: { label: 'Pending', color: 'bg-orange-500', headerColor: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200' },
  finalized: { label: 'On Hold', color: 'bg-indigo-500', headerColor: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200' },
  in_production: { label: 'Ongoing', color: 'bg-red-500', headerColor: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' },
  quality_check: { label: 'Quality Check', color: 'bg-sky-400', headerColor: 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200' },
  ready_pickup: { label: 'For Pickup', color: 'bg-blue-500', headerColor: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' },
  completed: { label: 'Completed', color: 'bg-green-500', headerColor: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500', headerColor: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' }
};

const statusOrder = ['pending_approval', 'finalized', 'in_production', 'quality_check', 'ready_pickup', 'completed'];

const getNextStatus = (currentStatus) => {
  const currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex >= 0 && currentIndex < statusOrder.length - 1) {
    return statusOrder[currentIndex + 1];
  }
  return null;
};

const JobCard = ({ job, onSelect, userMap, onArchive }) => {
  const isOverdue = job.deadline && new Date(job.deadline) < new Date();
  const isCompleted = job.status === 'completed';
  const assignee = userMap.get(job.assigned_to);
  
  // Determine if task is urgent (overdue or due today or rush order)
  const isDueToday = job.deadline && isToday(new Date(job.deadline));
  const isUrgent = isOverdue || isDueToday || job.is_rush;

  return (
    <Card className={cn(
      "bg-card border-border hover:shadow-md transition-shadow duration-200 cursor-pointer",
      isUrgent && !isCompleted && "bg-red-900/20 border-red-500/50 hover:bg-red-900/30"
    )} onClick={() => onSelect(job)}>
      <CardContent className="p-3">
        {/* Row 1: Title + Actions */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className={cn(
            "font-medium hover:underline truncate flex-1",
            isUrgent && !isCompleted ? "text-red-300" : "text-slate-100"
          )}>
            {job.title}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {isCompleted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onArchive(job)}
                className="h-7 w-7">
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Row 2: Client, Assignee, Due Date */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="truncate flex-1">
            {job.client_name}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
            <span className="truncate max-w-[80px]">
              {assignee ? assignee.nickname || assignee.full_name : 'Unassigned'}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-1 flex-shrink-0",
            isUrgent && !isCompleted && "text-red-400 font-bold"
          )}>
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {job.deadline ? formatDistanceToNow(new Date(job.deadline), { addSuffix: true }) : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProductionQueue({ user, initialFilter }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isNewTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [usersMap, setUsersMap] = useState(new Map());
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [allUsers, setAllUsers] = useState([]);
  const { toast } = useToast();

  const fetchJobsAndUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [jobData, userData] = await Promise.all([
        Job.list('-created_date', 100),
        User.list()
      ]);
      setJobs(jobData);
      setAllUsers(userData);
      const userMap = new Map();
      userData.forEach((u) => userMap.set(u.email, u));
      setUsersMap(userMap);
    } catch (error) {
      console.error("Failed to fetch jobs or users:", error);
      toast({
        variant: "destructive",
        title: "Failed to load tasks",
        description: "There was a network problem. Please check your connection and refresh.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJobsAndUsers();
  }, [fetchJobsAndUsers]);

  useEffect(() => {
    if (initialFilter !== undefined) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  const handleArchiveJob = useCallback(async (job) => {
    await Job.update(job.id, { status: 'archived' });
    fetchJobsAndUsers();
  }, [fetchJobsAndUsers]);
  
  const handleUpdate = useCallback(async (jobId, updateData) => {
    await Job.update(jobId, updateData);
    fetchJobsAndUsers();
  }, [fetchJobsAndUsers]);

  const handleDelete = useCallback(async (jobId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await Job.delete(jobId);
      setSelectedJob(null);
      fetchJobsAndUsers();
      toast({
        title: "Success",
        description: "Order deleted.",
        duration: 3000
      });
    }
  }, [fetchJobsAndUsers, toast]);

  const handleJobSelect = useCallback((job) => {
    if (selectedJob?.id === job.id) {
      return;
    }
    
    setSelectedJob(null);
    
    setTimeout(() => {
      setSelectedJob(job);
    }, 100);
  }, [selectedJob]);

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        if (job.status === 'cancelled' || job.status === 'archived') {
          return false;
        }
        if (filter === 'all') return true;
        return job.status === filter;
      })
      .filter((job) => {
        if (!searchQuery) return true;
        const lowerCaseQuery = searchQuery.toLowerCase();
        const assignee = usersMap.get(job.assigned_to);
        return (
          job.title?.toLowerCase().includes(lowerCaseQuery) ||
          job.client_name?.toLowerCase().includes(lowerCaseQuery) ||
          job.id?.slice(-6).toLowerCase().includes(lowerCaseQuery) ||
          assignee?.nickname?.toLowerCase().includes(lowerCaseQuery)
        );
      })
      .filter((job) => {
        if (showMyTasks && user?.email) {
          return job.assigned_to === user.email;
        }
        if (assigneeFilter === 'all') return true;
        if (assigneeFilter === 'unassigned') return !job.assigned_to;
        return job.assigned_to === assigneeFilter;
      });
  }, [jobs, filter, searchQuery, showMyTasks, assigneeFilter, user, usersMap]);

  const groupedJobs = useMemo(() => {
    const grouped = {};
    statusOrder.forEach((status) => {
      grouped[status] = filteredJobs.filter((job) => job.status === status);
    });
    return grouped;
  }, [filteredJobs]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const job = jobs.find(j => j.id === draggableId);
    if (!job) return;

    const newStatus = destination.droppableId;
    if (job.status === newStatus) return;

    const originalJobs = jobs;
    setJobs(prevJobs => prevJobs.map(j => j.id === draggableId ? { ...j, status: newStatus } : j));

    Job.update(draggableId, { status: newStatus })
        .then(() => {
            toast({
                title: "Task Updated",
                description: `Moved to "${statusConfig[newStatus]?.label}".`,
                duration: 3000
            });
        })
        .catch((error) => {
            console.error("Failed to update job status:", error);
            setJobs(originalJobs);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not move the task. Please try again.",
                duration: 3000
            });
        });
  };

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading Production Queue...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-auto flex-grow sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Switch
                id="my-tasks"
                checked={showMyTasks}
                onCheckedChange={setShowMyTasks}
              />
              <Label htmlFor="my-tasks" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                My Tasks Only
              </Label>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Label className="text-sm font-medium">Assignee:</Label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {allUsers.map(userOption => (
                    <SelectItem key={userOption.id} value={userOption.email}>
                      {userOption.nickname || userOption.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No active tasks in the queue.' : `No tasks with status "${statusConfig[filter]?.label}".`}
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="space-y-4">
                {statusOrder.map((status) => {
                  const statusJobs = groupedJobs[status];
                  if (statusJobs.length === 0 && filter !== 'all') return null;

                  return (
                    <Droppable key={status} droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "space-y-2 p-2 rounded-lg transition-colors",
                            snapshot.isDraggingOver ? "bg-secondary" : ""
                          )}
                        >
                          <div className={cn(
                            "px-3 py-2 rounded-lg flex items-center justify-between",
                            statusConfig[status].headerColor
                          )}>
                            <h3 className="font-semibold text-sm">
                              {statusConfig[status]?.label} ({statusJobs.length})
                            </h3>
                          </div>
                          <div className="space-y-1 min-h-[10px]">
                            {statusJobs.map((job, index) => (
                              <Draggable key={job.id} draggableId={job.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(snapshot.isDragging && "opacity-80 shadow-lg")}
                                  >
                                    <JobCard
                                      job={job}
                                      onSelect={handleJobSelect}
                                      onArchive={handleArchiveJob}
                                      userMap={usersMap}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {selectedJob && (
        <JobDetails
          key={selectedJob.id}
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          user={user}
        />
      )}

      {isNewTaskModalOpen && (
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setNewTaskModalOpen(false)}
          onTaskCreated={() => {
            setNewTaskModalOpen(false);
            fetchJobsAndUsers();
          }}
          user={user}
        />
      )}
    </>
  );
}