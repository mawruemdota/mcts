
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal,
  Eye,
  Calendar,
  AlertTriangle,
  Receipt,
  Trash2,
  User
} from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function JobsTable({ jobs, onJobUpdate, onJobSelect, user, team, onJobDelete }) {
  const getStatusColor = (status) => {
    const colors = {
      pending_approval: "bg-white text-gray-800 border-gray-300 dark:bg-white/90 dark:text-gray-900 dark:border-gray-400",
      in_production: "bg-orange-200 text-orange-900 border-orange-400 dark:bg-orange-800/40 dark:text-orange-100 dark:border-orange-600",
      quality_check: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700",
      ready_pickup: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700",
      completed: "bg-green-200 text-green-900 border-green-400 dark:bg-green-800/40 dark:text-green-100 dark:border-green-600",
      cancelled: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700"
    };
    return colors[status] || colors.pending_approval;
  };

  const getStatusDisplay = (status) => {
    const displays = {
      pending_approval: "Pending Approval",
      in_production: "In Production",
      quality_check: "Quality Check",
      ready_pickup: "Ready for Pickup",
      completed: "Completed",
      cancelled: "Cancelled"
    };
    return displays[status] || status;
  };

  const getRowColor = (status) => {
    const colors = {
      pending_approval: "bg-gray-50/50 dark:bg-gray-900/10",
      in_production: "bg-orange-100/50 dark:bg-orange-900/20",
      quality_check: "bg-blue-50/50 dark:bg-blue-900/10",
      ready_pickup: "bg-yellow-50/50 dark:bg-yellow-900/10",
      completed: "bg-green-100/50 dark:bg-green-900/20"
    };
    return colors[status] || 'bg-card';
  };

  const isUrgent = (job) => {
    if (!job.deadline) return false;
    const deadline = new Date(job.deadline);
    return isPast(deadline) || isToday(deadline) || job.is_rush;
  };

  const getAssigneeName = (email) => {
    if (!email || typeof email !== 'string') return 'Unassigned';
    const member = team.find(m => m.email === email);
    return member?.nickname || member?.full_name || email.split('@')[0];
  };

  const getUserPhoto = (email) => {
    if (!email) return null;
    const member = team.find(m => m.email === email);
    return member?.profile_picture_url;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b-border">
            <TableHead className="w-[250px]">Task Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const isUrgentFlag = isUrgent(job);
            const assigneePhoto = getUserPhoto(job.assigned_to);
            
            return (
              <TableRow 
                key={job.id}
                className={`hover:bg-secondary/50 cursor-pointer border-b-border ${getRowColor(job.status)} ${isUrgentFlag ? '!bg-red-500/10' : ''}`}
              >
                <TableCell className="font-medium" onClick={() => onJobSelect(job)}>
                  <p className="text-foreground truncate">{job.title}</p>
                  {job.approved_by && job.status !== 'pending_approval' && (
                    <p className="text-xs text-muted-foreground">Approved by: {getAssigneeName(job.approved_by)}</p>
                  )}
                </TableCell>
                
                <TableCell onClick={() => onJobSelect(job)}>
                  <p className="text-foreground">{job.client_name}</p>
                </TableCell>
                
                <TableCell onClick={() => onJobSelect(job)} className="text-foreground">
                  <div className="flex items-center gap-2">
                    {assigneePhoto ? (
                      <img src={assigneePhoto} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>{getAssigneeName(job.assigned_to)}</span>
                  </div>
                </TableCell>

                <TableCell onClick={() => onJobSelect(job)}>
                  {job.deadline ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className={isUrgent(job) ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        {format(new Date(job.deadline), "MMM d, yyyy")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No deadline</span>
                  )}
                </TableCell>

                <TableCell onClick={() => onJobSelect(job)}>
                  <Badge className={`${getStatusColor(job.status)} border`}>
                    {getStatusDisplay(job.status)}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
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
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {user?.role === 'admin' && job.status === 'pending_approval' && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onJobUpdate(job.id, { 
                            status: 'finalized', 
                            approved_by: user.email, 
                            approved_date: new Date().toISOString() 
                          });
                        }}>
                          Approve Task
                        </DropdownMenuItem>
                      )}
                      {job.status === 'completed' && (
                        <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                          <Link to={createPageUrl(`CreateInvoice?jobId=${job.id}`)}>
                            <Receipt className="w-4 h-4 mr-2" />
                            Create Receipt
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJobDelete(job.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {jobs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tasks found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
