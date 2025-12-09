import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCheck, Plus, Loader2, Package, Edit, User as UserIcon, Calendar, Check, Truck, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isPast, isToday } from 'date-fns';
import CreateInvoiceModal from '@/pages/CreateInvoice';
import { notifyTaskStatusChange } from '@/components/utils/notificationService';
import { base44 } from '@/api/base44Client';

export default function ProductionQueue({ jobs, team, onUpdateJob, onArchive }) {
  const [search, setSearch] = useState('');
  const [selectedForInvoice, setSelectedForInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const filteredJobs = jobs.filter(job => {
    const searchLower = search.toLowerCase();
    return job.title?.toLowerCase().includes(searchLower) ||
           job.client_name?.toLowerCase().includes(searchLower) ||
           job.job_id?.toLowerCase().includes(searchLower);
  });

  const getUserName = (email) => {
    if (!email) return 'Unassigned';
    const member = team.find(m => m.email === email);
    return member?.nickname || member?.full_name || email.split('@')[0];
  };

  const getUserPhoto = (email) => {
    if (!email) return null;
    const member = team.find(m => m.email === email);
    return member?.profile_picture_url;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_approval: 'bg-gray-100 text-gray-800 border-gray-300',
      finalized: 'bg-blue-100 text-blue-800 border-blue-300',
      in_production: 'bg-orange-100 text-orange-800 border-orange-300',
      quality_check: 'bg-purple-100 text-purple-800 border-purple-300',
      ready_pickup: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      completed: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[status] || colors.pending_approval;
  };

  const getStatusDisplay = (status) => {
    const displays = {
      pending_approval: 'Pending Approval',
      finalized: 'Finalized',
      in_production: 'In Production',
      quality_check: 'Quality Check',
      ready_pickup: 'For Pickup',
      completed: 'Completed'
    };
    return displays[status] || status;
  };

  const isUrgent = (job) => {
    if (!job.deadline) return false;
    const deadline = new Date(job.deadline);
    return isPast(deadline) || isToday(deadline) || job.is_rush;
  };

  const groupedJobs = {
    pending_approval: filteredJobs.filter(j => j.status === 'pending_approval'),
    finalized: filteredJobs.filter(j => j.status === 'finalized'),
    in_production: filteredJobs.filter(j => j.status === 'in_production'),
    quality_check: filteredJobs.filter(j => j.status === 'quality_check'),
    ready_pickup: filteredJobs.filter(j => j.status === 'ready_pickup'),
    completed: filteredJobs.filter(j => j.status === 'completed')
  };

  const handleCreateInvoice = (job) => {
    setSelectedForInvoice(job);
    setShowInvoiceModal(true);
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Production Queue</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 gap-4 p-4">
              {Object.entries(groupedJobs).map(([status, statusJobs]) => (
                <div key={status} className="min-w-[250px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-foreground">
                      {getStatusDisplay(status)}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {statusJobs.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {statusJobs.map(job => {
                      const isCompleted = job.status === 'completed';
                      const assigneePhoto = getUserPhoto(job.assigned_to);
                      
                      return (
                        <Card
                          key={job.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${
                            isUrgent(job) ? 'border-red-500 border-2' : 'border-border'
                          }`}
                          onClick={() => onUpdateJob && onUpdateJob(job)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={`${getStatusColor(job.status)} text-xs border`}>
                                {getStatusDisplay(job.status)}
                              </Badge>
                              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                {job.status === 'ready_pickup' && (
                                  <Link to={createPageUrl(`CreateDeliveryForm?jobId=${job.id}`)}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                      title="Create Delivery Receipt"
                                    >
                                      <Truck className="w-3.5 h-3.5" />
                                    </Button>
                                  </Link>
                                )}
                                {isCompleted && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleCreateInvoice(job)}
                                      className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                      title="Create Invoice"
                                    >
                                      <Receipt className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onArchive(job)}
                                      className="h-7 w-7"
                                      title="Archive"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <h4 className="font-medium text-sm text-foreground mb-1 line-clamp-2">
                              {job.title}
                            </h4>
                            
                            <p className="text-xs text-muted-foreground mb-2">
                              {job.client_name}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                {assigneePhoto ? (
                                  <img src={assigneePhoto} alt="Profile" className="w-4 h-4 rounded-full object-cover" />
                                ) : (
                                  <UserIcon className="w-3 h-3" />
                                )}
                                <span className="truncate max-w-[100px]">{getUserName(job.assigned_to)}</span>
                              </div>
                              {job.deadline && (
                                <div className={`flex items-center gap-1 ${isUrgent(job) ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                  <Calendar className="w-3 h-3" />
                                  <span>{format(new Date(job.deadline), 'MMM d')}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {statusJobs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {showInvoiceModal && selectedForInvoice && (
        <CreateInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedForInvoice(null);
          }}
          jobId={selectedForInvoice.id}
        />
      )}
    </>
  );
}