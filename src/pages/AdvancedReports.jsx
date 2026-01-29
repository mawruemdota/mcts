import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Filter, TrendingUp, DollarSign, Clock, Package } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import DailyReportsList from '@/components/reports/DailyReportsList';

export default function AdvancedReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientsData = await base44.entities.Client.list();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const [jobs, invoices, deliveries] = await Promise.all([
        base44.entities.Job.list(),
        base44.entities.Invoice.list(),
        base44.entities.DeliveryForm.list()
      ]);

      // Filter by date range
      const filteredJobs = jobs.filter(job => {
        const jobDate = new Date(job.created_date);
        return jobDate >= new Date(dateRange.start) && jobDate <= new Date(dateRange.end);
      });

      const filteredInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.issue_date);
        return invDate >= new Date(dateRange.start) && invDate <= new Date(dateRange.end);
      });

      // Apply client filter
      const clientFilteredJobs = selectedClient === 'all' 
        ? filteredJobs 
        : filteredJobs.filter(j => j.client_id === selectedClient);

      const clientFilteredInvoices = selectedClient === 'all'
        ? filteredInvoices
        : filteredInvoices.filter(i => i.client_id === selectedClient);

      // Apply status filter
      const statusFilteredJobs = selectedStatus === 'all'
        ? clientFilteredJobs
        : clientFilteredJobs.filter(j => j.status === selectedStatus);

      // Calculate financial metrics
      const totalRevenue = clientFilteredInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      const outstandingPayments = clientFilteredInvoices
        .filter(inv => ['unpaid', 'billed', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      const averageInvoiceValue = clientFilteredInvoices.length > 0
        ? totalRevenue / clientFilteredInvoices.filter(inv => inv.status === 'paid').length
        : 0;

      // Calculate operational metrics
      const completedJobs = statusFilteredJobs.filter(j => j.status === 'completed').length;
      const totalJobs = statusFilteredJobs.length;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      const avgCompletionTime = calculateAvgCompletionTime(statusFilteredJobs);
      const deliveryCount = deliveries.filter(d => {
        const delDate = new Date(d.created_date);
        return delDate >= new Date(dateRange.start) && delDate <= new Date(dateRange.end);
      }).length;

      // Job status breakdown
      const statusBreakdown = statusFilteredJobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {});

      // Client revenue breakdown
      const clientRevenue = clientFilteredInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((acc, inv) => {
          const client = inv.client_name || 'Unknown';
          acc[client] = (acc[client] || 0) + (inv.amount || 0);
          return acc;
        }, {});

      setReportData({
        financial: {
          totalRevenue,
          outstandingPayments,
          averageInvoiceValue,
          invoiceCount: clientFilteredInvoices.length,
          paidInvoices: clientFilteredInvoices.filter(inv => inv.status === 'paid').length
        },
        operational: {
          totalJobs,
          completedJobs,
          completionRate,
          avgCompletionTime,
          deliveryCount,
          statusBreakdown
        },
        clientRevenue,
        jobs: statusFilteredJobs,
        invoices: clientFilteredInvoices
      });

      toast({ title: 'Report generated successfully' });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ variant: 'destructive', title: 'Failed to generate report' });
    }
    setIsLoading(false);
  };

  const calculateAvgCompletionTime = (jobs) => {
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.completion_date && j.created_date);
    if (completedJobs.length === 0) return 0;

    const totalTime = completedJobs.reduce((sum, job) => {
      const start = new Date(job.created_date);
      const end = new Date(job.completion_date);
      return sum + (end - start) / (1000 * 60 * 60 * 24); // days
    }, 0);

    return (totalTime / completedJobs.length).toFixed(1);
  };

  const downloadCSV = (data, filename) => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadFinancialCSV = () => {
    if (!reportData) return;
    const data = reportData.invoices.map(inv => ({
      invoice_number: inv.invoice_number,
      client: inv.client_name,
      amount: inv.amount,
      status: inv.status,
      issue_date: inv.issue_date,
      due_date: inv.due_date
    }));
    downloadCSV(data, 'financial_report');
  };

  const downloadOperationalCSV = () => {
    if (!reportData) return;
    const data = reportData.jobs.map(job => ({
      job_id: job.job_id,
      title: job.title,
      client: job.client_name,
      status: job.status,
      created: format(new Date(job.created_date), 'yyyy-MM-dd'),
      deadline: job.deadline,
      completed: job.completion_date ? format(new Date(job.completion_date), 'yyyy-MM-dd') : ''
    }));
    downloadCSV(data, 'operational_report');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Reports</h1>
        <p className="text-muted-foreground mt-1">Generate comprehensive financial and operational reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="finalized">Finalized</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="quality_check">Quality Check</SelectItem>
                  <SelectItem value="ready_pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generateReport} disabled={isLoading} className="mt-4">
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <Tabs defaultValue="financial" className="space-y-4">
          <TabsList>
            <TabsTrigger value="financial">Financial Summary</TabsTrigger>
            <TabsTrigger value="operational">Operational Metrics</TabsTrigger>
            <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
            <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₱{reportData.financial.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-2xl font-bold">₱{reportData.financial.outstandingPayments.toLocaleString()}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Invoice Value</p>
                      <p className="text-2xl font-bold">₱{reportData.financial.averageInvoiceValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Invoices</p>
                      <p className="text-2xl font-bold">{reportData.financial.paidInvoices} / {reportData.financial.invoiceCount}</p>
                    </div>
                    <FileText className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Invoice Details</CardTitle>
                <Button onClick={downloadFinancialCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Invoice #</th>
                        <th className="text-left py-2">Client</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Issue Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.invoices.map(inv => (
                        <tr key={inv.id} className="border-b">
                          <td className="py-2">{inv.invoice_number}</td>
                          <td className="py-2">{inv.client_name}</td>
                          <td className="py-2 text-right">₱{inv.amount?.toLocaleString()}</td>
                          <td className="py-2">
                            <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="py-2">{format(new Date(inv.issue_date), 'MMM dd, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operational" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Jobs</p>
                      <p className="text-2xl font-bold">{reportData.operational.totalJobs}</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">{reportData.operational.completionRate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Completion Time</p>
                      <p className="text-2xl font-bold">{reportData.operational.avgCompletionTime} days</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Deliveries</p>
                      <p className="text-2xl font-bold">{reportData.operational.deliveryCount}</p>
                    </div>
                    <Package className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(reportData.operational.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Job Details</CardTitle>
                <Button onClick={downloadOperationalCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Job ID</th>
                        <th className="text-left py-2">Title</th>
                        <th className="text-left py-2">Client</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.jobs.map(job => (
                        <tr key={job.id} className="border-b">
                          <td className="py-2">{job.job_id}</td>
                          <td className="py-2">{job.title}</td>
                          <td className="py-2">{job.client_name}</td>
                          <td className="py-2">
                            <Badge variant="outline">{job.status.replace('_', ' ')}</Badge>
                          </td>
                          <td className="py-2">{format(new Date(job.created_date), 'MMM dd, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(reportData.clientRevenue)
                    .sort(([, a], [, b]) => b - a)
                    .map(([client, revenue]) => (
                      <div key={client} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{client}</span>
                        <span className="text-lg font-bold">₱{revenue.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <DailyReportsList />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}