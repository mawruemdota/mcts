import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Briefcase,
  Palette,
  Bell,
  FileText,
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Calendar,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SummaryPage() {
  const [jobs, setJobs] = useState([]);
  const [creativeTasks, setCreativeTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [shopCashRecords, setShopCashRecords] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [
        jobsData,
        creativeTasksData,
        remindersData,
        invoicesData,
        quotationsData,
        shopCashData
      ] = await Promise.all([
        base44.entities.Job.filter({ status: { $ne: 'archived' } }, '-deadline', 20),
        base44.entities.CreativeTask.filter({ status: { $ne: 'done' } }, '-deadline', 20),
        base44.entities.Reminder.filter({ user_email: currentUser.email, status: 'pending' }, '-deadline', 20),
        base44.entities.Invoice.filter({ status: { $nin: ['archived', 'void'] } }, '-issue_date', 10),
        base44.entities.Quotation.filter({ status: 'pending_review' }, '-created_date', 10),
        currentUser.role === 'admin' ? base44.entities.ShopCashRecord.list('-date', 10) : []
      ]);

      setJobs(jobsData);
      setCreativeTasks(creativeTasksData);
      setReminders(remindersData);
      setInvoices(invoicesData);
      setQuotations(quotationsData);
      setShopCashRecords(shopCashData);
    } catch (error) {
      console.error('Error loading summary data:', error);
      toast({ variant: 'destructive', title: 'Error loading data' });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-gray-100 text-gray-800';
      case 'finalized': return 'bg-blue-100 text-blue-800';
      case 'in_production': return 'bg-purple-100 text-purple-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'for_checking': return 'bg-yellow-100 text-yellow-800';
      case 'quality_check': return 'bg-yellow-100 text-yellow-800';
      case 'ready_pickup': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDateBadge = (dateString) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return <Badge variant="destructive" className="text-xs">Today</Badge>;
      if (isTomorrow(date)) return <Badge className="bg-orange-100 text-orange-800 text-xs">Tomorrow</Badge>;
      if (isPast(date)) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
      return <Badge variant="outline" className="text-xs">{format(date, 'MMM dd')}</Badge>;
    } catch {
      return null;
    }
  };

  const urgentJobs = jobs.filter(j => j.is_rush || (j.deadline && isPast(parseISO(j.deadline))));
  const urgentCreativeTasks = creativeTasks.filter(t => t.priority === 'urgent' || (t.deadline && isPast(parseISO(t.deadline))));
  const todayReminders = reminders.filter(r => r.deadline && isToday(parseISO(r.deadline)));
  const pendingInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'billed');
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Summary</h1>
        <p className="text-muted-foreground mt-1">Quick overview of all your tasks and activities</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{jobs.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
            {urgentJobs.length > 0 && (
              <p className="text-xs text-red-500 mt-2">{urgentJobs.length} urgent</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Creative Tasks</p>
                <p className="text-2xl font-bold">{creativeTasks.length}</p>
              </div>
              <Palette className="w-8 h-8 text-purple-500" />
            </div>
            {urgentCreativeTasks.length > 0 && (
              <p className="text-xs text-orange-500 mt-2">{urgentCreativeTasks.length} high priority</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reminders</p>
                <p className="text-2xl font-bold">{reminders.length}</p>
              </div>
              <Bell className="w-8 h-8 text-yellow-500" />
            </div>
            {todayReminders.length > 0 && (
              <p className="text-xs text-yellow-600 mt-2">{todayReminders.length} due today</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Invoices</p>
                <p className="text-2xl font-bold">₱{totalPendingAmount.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{pendingInvoices.length} invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Recent Jobs
            </CardTitle>
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active jobs</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {jobs.slice(0, 5).map(job => (
                  <div key={job.id} className="flex items-start justify-between p-2 bg-secondary rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.client_name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {getDateBadge(job.deadline)}
                      <Badge className={getTaskStatusColor(job.status)} variant="secondary">
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creative Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-500" />
              Creative Tasks
            </CardTitle>
            <Link to={createPageUrl('Creatives')}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {creativeTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No creative tasks</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {creativeTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-start justify-between p-2 bg-secondary rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{task.client_name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {getDateBadge(task.deadline)}
                      <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              Upcoming Reminders
            </CardTitle>
            <Link to={createPageUrl('Reminders')}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No reminders</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {reminders.slice(0, 5).map(reminder => (
                  <div key={reminder.id} className="flex items-start justify-between p-2 bg-secondary rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{reminder.title}</p>
                      {reminder.description && (
                        <p className="text-xs text-muted-foreground truncate">{reminder.description}</p>
                      )}
                    </div>
                    <div className="ml-2">
                      {getDateBadge(reminder.deadline)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forms Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Forms & Quotations
            </CardTitle>
            <Link to={createPageUrl('Forms')}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium">Pending Quotations</p>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{quotations.length}</Badge>
              </div>

              <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium">Unpaid Invoices</p>
                  <p className="text-xs text-muted-foreground">Total: ₱{totalPendingAmount.toFixed(2)}</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800">{pendingInvoices.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Cash (Admin Only) */}
        {user?.role === 'admin' && shopCashRecords.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-green-500" />
                Recent Shop Cash
              </CardTitle>
              <Link to={createPageUrl('ShopCash')}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {shopCashRecords.slice(0, 5).map(record => (
                  <div key={record.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{record.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.date ? format(parseISO(record.date), 'MMM dd, yyyy') : 'No date'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {record.type === 'income' ? '+' : '-'}₱{record.amount?.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {record.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}