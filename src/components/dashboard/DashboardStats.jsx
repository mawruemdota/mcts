import React from 'react';
import { Briefcase, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DashboardStats({ user }) {

  // Dummy data for now. We will replace this with real data fetching logic.
  const stats = {
    active_tasks: 5,
    monthly_revenue: 12500.00,
    pending_approval: 2,
    completed_today: 8,
    overdue_tasks: 1,
  };

  const StatCard = ({ icon: Icon, label, value, currency = false, colorClass }) => (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-secondary`}>
        <Icon className={`w-5 h-5 ${colorClass || 'text-primary'}`} />
      </div>
      <div>
        <div className="text-sm text-muted-foreground hidden sm:block">{label}</div>
        <div className="text-base font-bold text-foreground">
          {currency && '₱'}{typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );

  return (
    <div className="hidden md:flex items-center gap-6">
        <StatCard icon={Briefcase} label="Active Tasks" value={stats.active_tasks} colorClass="text-blue-500" />
        <StatCard icon={DollarSign} label="This Month" value={stats.monthly_revenue} currency colorClass="text-green-500" />
        <StatCard icon={Clock} label="Pending" value={stats.pending_approval} colorClass="text-orange-500" />
    </div>
  );
}