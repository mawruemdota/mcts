
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from "@/entities/all";

export default function JobFilters({ filters, setFilters, jobs, user }) {
  const [team, setTeam] = useState([]);
  
  useEffect(() => {
    const fetchTeam = async () => {
        const users = await User.list();
        setTeam(users);
    };
    fetchTeam();
  }, []);

  const jobTypes = [...new Set(jobs.map(job => job.job_type).filter(Boolean))];
  const assignees = [...new Set(jobs.map(job => job.assigned_to).filter(Boolean))];

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                {/* Removed "approved" (Design Approved) and "finalized" (Ready for Production) as per changes */}
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="quality_check">Quality Check</SelectItem>
                <SelectItem value="ready_pickup">Ready for Pickup</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Task Type</Label>
            <Select value={filters.jobType} onValueChange={(value) => updateFilter('jobType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {jobTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Other'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
            <Select value={filters.assignee} onValueChange={(value) => updateFilter('assignee', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                 <SelectItem value={user?.email}>Assigned to Me</SelectItem>
                {team.map(member => (
                  <SelectItem key={member.id} value={member.email}>
                    {member.nickname || member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
            <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="rush">Rush Orders</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due_today">Due Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
