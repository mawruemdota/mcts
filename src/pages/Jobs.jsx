
import React, { useState, useEffect, useCallback } from "react";
import { Job, User, JobUpdate } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  LayoutGrid,
  Rows,
  Filter,
  Eye,
  Edit,
  Clock,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isToday, isPast, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import JobsKanban from "../components/jobs/JobsKanban";
import JobsTable from "../components/jobs/JobsTable";
import JobFilters from "../components/jobs/JobFilters";
import JobDetails from "../components/jobs/JobDetails";
import NewTaskModal from "@/components/jobs/NewTaskModal";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    jobType: 'all',
    assignee: 'all',
    priority: 'all'
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobsData, userData, teamData] = await Promise.all([
        Job.list("-created_date", 100),
        User.me(),
        User.list()
      ]);

      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setUser(userData);
      setTeam(Array.isArray(teamData) ? teamData : []);
    } catch (error) {
      console.error("Error loading tasks data:", error);
      setJobs([]);
      setTeam([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTaskCreated = () => {
    setShowNewTaskModal(false);
    loadData();
  };
  
  const handleJobUpdate = async (jobId, updateData) => {
    try {
      // If moving to 'in_production', set approval info
      if (updateData.status === 'in_production' && !updateData.approved_by) {
        updateData.approved_by = user?.email;
        updateData.approved_date = new Date().toISOString();
      }

      await Job.update(jobId, updateData);

      const jobsArray = Array.isArray(jobs) ? jobs : [];
      const job = jobsArray.find(j => j.id === jobId);

      await JobUpdate.create({
        job_id: jobId,
        update_type: 'status_change',
        old_status: job?.status,
        new_status: updateData.status,
        message: `Status updated to ${updateData.status}${updateData.approved_by ? ` (Approved by: ${user?.nickname || user?.full_name})` : ''}`,
        updated_by: user?.email
      });

      loadData();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to archive this task? It can be restored from the Archive page.")) {
      try {
        await Job.update(jobId, { status: 'archived' });
        loadData();
      } catch (error) {
        console.error("Error archiving task:", error);
      }
    }
  };

  const filteredJobs = (Array.isArray(jobs) ? jobs : []).filter(job => {
    if (job?.status === 'archived') return false; // Exclude archived jobs from default view

    const matchesSearch = (job?.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job?.job_type || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status === 'all' || job?.status === filters.status;
    const matchesJobType = filters.jobType === 'all' || job?.job_type === filters.jobType;
    
    // Handle single assignee
    const matchesAssignee = filters.assignee === 'all' || 
                           (filters.assignee === 'unassigned' ? !job?.assigned_to : job?.assigned_to === filters.assignee);
    const matchesMyAssignee = assigneeFilter === 'assigned_to_me' ? job?.assigned_to === user?.email : true;

    return matchesSearch && matchesStatus && matchesJobType && matchesAssignee && matchesMyAssignee;
  });

  // New function to get assignee's nickname or full name
  const getAssigneeName = (email) => {
    if (!email) return 'Unassigned';
    const teamArray = Array.isArray(team) ? team : [];
    const member = teamArray.find(m => m.email === email);
    return member?.nickname || member?.full_name || email.split('@')[0];
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Tasks</h1>
              <p className="text-muted-foreground">Manage and track all client tasks.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by title, client..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2"/>
                Filters
              </Button>
              <div className="flex items-center bg-muted p-1 rounded-lg">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('table')}
                  className="h-8 w-8"
                >
                  <Rows className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('kanban')}
                  className="h-8 w-8"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={() => setShowNewTaskModal(true)}><Plus className="w-4 h-4 mr-2"/> New Task</Button>
            </div>
          </div>
          {showFilters && <div className="mt-4"><JobFilters filters={filters} setFilters={setFilters} jobs={jobs || []} user={user} /></div>}
        </header>
        <main className="flex-1 overflow-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          ) : viewMode === 'table' ? (
            <JobsTable jobs={filteredJobs} onJobUpdate={handleJobUpdate} onJobSelect={setSelectedJob} onJobDelete={handleDeleteJob} user={user} team={team || []} />
          ) : (
            <JobsKanban jobs={filteredJobs} onJobUpdate={handleJobUpdate} onJobSelect={setSelectedJob} onJobDelete={handleDeleteJob} user={user} team={team || []} />
          )}
        </main>
      </div>

      {selectedJob && (
        <JobDetails
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleJobUpdate}
          onDelete={handleDeleteJob}
          user={user}
        />
      )}
      {showNewTaskModal && <NewTaskModal isOpen={showNewTaskModal} onClose={() => setShowNewTaskModal(false)} onTaskCreated={handleTaskCreated} />}
    </div>
  );
}
