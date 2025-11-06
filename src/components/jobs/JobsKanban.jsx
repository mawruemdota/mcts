
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  Package,
  Receipt,
  ChevronDown,
  ChevronRight,
  Trash2
} from "lucide-react";
import { format, isToday, isPast, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUSES = [
  { key: 'pending_approval', title: 'Pending Approval', color: 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-700', textColor: 'text-gray-800 dark:text-gray-200' },
  { key: 'in_production', title: 'In Production', color: 'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-600', textColor: 'text-orange-900 dark:text-orange-100' },
  { key: 'quality_check', title: 'Quality Check', color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-700', textColor: 'text-blue-800 dark:text-blue-200' },
  { key: 'ready_pickup', title: 'Ready for Pickup', color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-700', textColor: 'text-yellow-800 dark:text-yellow-200' },
  { key: 'completed', title: 'Completed', color: 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-600', textColor: 'text-green-900 dark:text-green-100' }
];

export default function JobsKanban({ jobs, onJobUpdate, onJobSelect, onJobDelete, user, team }) {
  const [collapsedColumns, setCollapsedColumns] = useState({});

  const toggleColumnCollapse = (statusKey) => {
    setCollapsedColumns(prev => ({ ...prev, [statusKey]: !prev[statusKey] }));
  };

  const isUrgent = useCallback((job) => {
    if (!job.deadline) return false;
    const deadline = new Date(job.deadline);
    return isPast(deadline) || isToday(deadline) || job.is_rush;
  }, []);

  const getAssigneeName = (email) => {
    if (!email || typeof email !== 'string') return 'Unassigned';
    const member = team.find(m => m.email === email);
    return member?.nickname || member?.full_name || email.split('@')[0];
  };

  const getJobsByStatus = useCallback((status) => {
    if (status === 'finalized') {
        return jobs.filter(job => job.status === 'finalized' || job.status === 'approved')
          .sort((a, b) => (isUrgent(a) ? -1 : 1) - (isUrgent(b) ? -1 : 1) || new Date(a.deadline) - new Date(b.deadline));
    }
    return jobs.filter(job => job.status === status)
      .sort((a, b) => {
        const aUrgent = isUrgent(a);
        const bUrgent = isUrgent(b);
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;
        
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline);
        }
        return 0;
      });
  }, [jobs, isUrgent]);

  const getNextStatus = useCallback((currentStatus) => {
    if (currentStatus === 'approved') currentStatus = 'finalized';
    const statusIndex = STATUSES.findIndex(s => s.key === currentStatus);
    return statusIndex < STATUSES.length - 1 ? STATUSES[statusIndex + 1].key : null;
  }, []);

  const getPreviousStatus = useCallback((currentStatus) => {
    if (currentStatus === 'approved') currentStatus = 'finalized';
    const statusIndex = STATUSES.findIndex(s => s.key === currentStatus);
    return statusIndex > 0 ? STATUSES[statusIndex - 1].key : null;
  }, []);

  // Removed getJobTypeColor as it's no longer used

  // Auto-collapse empty columns
  useEffect(() => {
    const emptyColumns = {};
    STATUSES.forEach(status => {
      const statusJobs = getJobsByStatus(status.key);
      if (statusJobs.length === 0) {
        emptyColumns[status.key] = true;
      }
    });
    setCollapsedColumns(emptyColumns);
  }, [getJobsByStatus]);

  // JobCard component to encapsulate job rendering logic
  const JobCard = ({ job }) => (
    <Card
      key={job.id}
      className="bg-card hover:shadow-md transition-shadow cursor-pointer border-border"
      onClick={() => onJobSelect(job)}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm text-foreground leading-tight pr-2">{job.title || job.client_name}</p>
          <div className="flex-shrink-0 flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:bg-secondary"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onJobSelect(job);
                }}>
                  View Details
                </DropdownMenuItem>
                {getNextStatus(job.status) && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onJobUpdate(job.id, { status: getNextStatus(job.status) });
                  }}>
                    Move Forward
                  </DropdownMenuItem>
                )}
                {getPreviousStatus(job.status) && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onJobUpdate(job.id, { status: getPreviousStatus(job.status) });
                  }}>
                    Move Back
                  </DropdownMenuItem>
                )}
                {job.status === 'completed' && (
                  <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                    <Link to={createPageUrl(`CreateInvoice?jobId=${job.id}`)} className="flex items-center w-full">
                      <Receipt className="w-4 h-4 mr-2" />
                      Create Receipt
                    </Link>
                  </DropdownMenuItem>
                )}
                {onJobDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onJobDelete(job.id);
                    }}
                    className="text-red-600 focus:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Job
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
            <span>{job.client_name}</span>
            <div className="flex items-center gap-2">
                {job.assigned_to && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{getAssigneeName(job.assigned_to)}</span>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{job.deadline ? format(parseISO(job.deadline), "MMM d") : "No deadline"}</span>
                    {isUrgent(job) && <AlertTriangle className="w-3 h-3 text-red-500" />}
                  </div>
                )}
            </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {STATUSES.map((status) => {
        const statusJobs = getJobsByStatus(status.key);
        const isCollapsed = collapsedColumns[status.key];
        
        return (
          <div key={status.key} className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'}`}>
            <div className={`rounded-lg border ${status.color} p-3 h-full bg-card/40`}>
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer"
                onClick={() => toggleColumnCollapse(status.key)}
              >
                <div className="flex items-center gap-2">
                   {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                   {!isCollapsed && <h3 className={`font-semibold ${status.textColor}`}>{status.title}</h3>}
                </div>
                <Badge variant="secondary" className="bg-background text-foreground">
                  {statusJobs.length}
                </Badge>
              </div>

              {!isCollapsed && (
                <div className="space-y-3 h-[calc(100%-40px)] overflow-y-auto pr-1">
                  {statusJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                  
                  {statusJobs.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">No tasks</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
