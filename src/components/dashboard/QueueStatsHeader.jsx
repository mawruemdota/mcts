import React, { useState, useEffect, useCallback } from 'react';
import { Job } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";
import { LayoutGrid, Clock, Zap, CheckCircle2, Package, CheckCheck } from 'lucide-react';

const statusConfig = {
  all: { icon: LayoutGrid, label: "All", color: "text-blue-500", bgColor: "bg-blue-500" },
  pending_approval: { icon: Clock, label: "Pending", color: "text-orange-500", bgColor: "bg-orange-500" },
  in_production: { icon: Zap, label: "Ongoing", color: "text-red-500", bgColor: "bg-red-500" },
  quality_check: { icon: CheckCircle2, label: "QC", color: "text-sky-500", bgColor: "bg-sky-500" },
  ready_pickup: { icon: Package, label: "Pickup", color: "text-blue-500", bgColor: "bg-blue-500" },
  completed: { icon: CheckCheck, label: "Done", color: "text-green-500", bgColor: "bg-green-500" }
};

const StatusButton = ({ status, count, isActive, onClick }) => {
  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={() => onClick(status)}
      className={`flex items-center gap-2 ${isActive ? `${config.bgColor} text-white hover:opacity-90` : `hover:bg-secondary ${config.color}`}`}
    >
      <Icon className="w-4 h-4" />
      <Badge variant="secondary" className={`${isActive ? 'bg-white/20' : 'bg-background'} text-inherit`}>
        {count}
      </Badge>
    </Button>
  );
};

export default function QueueStatsHeader() {
  const [jobStats, setJobStats] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadJobStats = useCallback(async () => {
    try {
      const jobs = await Job.list('-created_date', 100);
      const activeJobs = jobs.filter(job => job.status !== 'archived' && job.status !== 'cancelled');
      
      const stats = {
        all: activeJobs.length,
        pending_approval: activeJobs.filter(j => j.status === 'pending_approval').length,
        in_production: activeJobs.filter(j => j.status === 'in_production').length,
        quality_check: activeJobs.filter(j => j.status === 'quality_check').length,
        ready_pickup: activeJobs.filter(j => j.status === 'ready_pickup').length,
        completed: activeJobs.filter(j => j.status === 'completed').length
      };
      
      setJobStats(stats);
    } catch (error) {
      console.error('Error loading job stats:', error);
      toast({
        variant: "destructive",
        title: "Could not load queue stats",
        description: "There was a network problem. Some stats may not be up to date.",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadJobStats();
  }, [loadJobStats]);

  const handleFilterClick = (status) => {
    setActiveFilter(status);
    const filterParam = status === 'all' ? '' : `?filter=${status}`;
    navigate(createPageUrl(`Dashboard${filterParam}`));
  };

  return (
    <div className="hidden lg:flex items-center gap-2">
      {Object.keys(statusConfig).map((status) => (
        <StatusButton
          key={status}
          status={status}
          count={jobStats[status] || 0}
          isActive={activeFilter === status}
          onClick={handleFilterClick}
        />
      ))}
    </div>
  );
}