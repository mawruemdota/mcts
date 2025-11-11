import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { createPageUrl } from '@/utils';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Home,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';

export default function OrderTrackingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('order_number');
  const [order, setOrder] = useState(null);
  const [job, setJob] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [homepageContent, setHomepageContent] = useState(null);

  React.useEffect(() => {
    const loadContent = async () => {
      try {
        const contentData = await base44.entities.HomePageContent.list();
        if (contentData.length > 0) {
          setHomepageContent(contentData[0]);
        }
      } catch (error) {
        console.error('Error loading content:', error);
      }
    };
    loadContent();
  }, []);

  const heroBackground = homepageContent?.hero_background_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/6e687ce1e_bg.png';

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setError('');
    setOrder(null);
    setJob(null);

    try {
      let orders = [];

      if (searchType === 'order_number') {
        orders = await base44.entities.Order.filter({ order_number: searchQuery.trim() });
      } else {
        orders = await base44.entities.Order.filter({ client_phone: searchQuery.trim() });
      }

      if (orders.length === 0) {
        setError('No order found. Please check your order number or phone number and try again.');
      } else {
        const foundOrder = orders[0];
        setOrder(foundOrder);

        if (foundOrder.converted_job_id) {
          try {
            const jobData = await base44.entities.Job.get(foundOrder.converted_job_id);
            setJob(jobData);
          } catch (jobError) {
            console.error('Error fetching job:', jobError);
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
    }

    setIsSearching(false);
  };

  const getOrderStatusInfo = (status) => {
    const statusMap = {
      'new': { label: 'Order Received', color: 'bg-blue-100 text-blue-800', icon: ClipboardList },
      'reviewing': { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'approved': { label: 'Order Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'converted_to_job': { label: 'In Production', color: 'bg-purple-100 text-purple-800', icon: Package },
      'rejected': { label: 'Order Rejected', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Package };
  };

  const getJobStatusInfo = (status) => {
    const statusMap = {
      'pending_approval': { label: 'Awaiting Approval', color: 'bg-yellow-100 text-yellow-800', step: 1 },
      'finalized': { label: 'Finalized', color: 'bg-blue-100 text-blue-800', step: 2 },
      'in_production': { label: 'In Production', color: 'bg-purple-100 text-purple-800', step: 3 },
      'quality_check': { label: 'Quality Check', color: 'bg-indigo-100 text-indigo-800', step: 4 },
      'ready_pickup': { label: 'Ready for Pickup', color: 'bg-green-100 text-green-800', step: 5 },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-800', step: 6 },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800', step: 0 }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', step: 0 };
  };

  const jobStatuses = [
    { key: 'pending_approval', label: 'Approval', icon: Clock },
    { key: 'finalized', label: 'Finalized', icon: CheckCircle2 },
    { key: 'in_production', label: 'Production', icon: Package },
    { key: 'quality_check', label: 'Quality Check', icon: CheckCircle2 },
    { key: 'ready_pickup', label: 'Ready', icon: CheckCircle2 },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 }
  ];

  return (
    <div className="relative min-h-screen">
      {/* Fixed Background */}
      <OptimizedImage
        src={heroBackground}
        alt="Background"
        className="fixed inset-0 w-full h-full"
        objectFit="cover"
      />
      <div className="fixed inset-0 bg-[#2053E6] opacity-30"></div>

      {/* Scrollable Content */}
      <div className="relative z-10 min-h-screen overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Track Your Order</h1>
            <p className="text-white/90">Enter your order number or phone number to check your order status</p>
          </div>

          {/* Search Card */}
          <Card className="mb-6 shadow-2xl">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={searchType === 'order_number' ? 'default' : 'outline'}
                    onClick={() => setSearchType('order_number')}
                    className="flex-1"
                  >
                    Order Number
                  </Button>
                  <Button
                    type="button"
                    variant={searchType === 'phone' ? 'default' : 'outline'}
                    onClick={() => setSearchType('phone')}
                    className="flex-1"
                  >
                    Phone Number
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder={searchType === 'order_number' ? 'Enter your order number (e.g., ORD-2025-...)' : 'Enter your phone number'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-12 text-lg" disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Order Summary Card */}
              <Card className="shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Order Details</CardTitle>
                    {(() => {
                      const statusInfo = getOrderStatusInfo(order.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-4 h-4 mr-2" />
                          {statusInfo.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Order Number</Label>
                      <p className="font-semibold text-lg">{order.order_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Order Date</Label>
                      <p className="font-semibold">{format(new Date(order.created_date), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Client Name</Label>
                      <p className="font-semibold">{order.client_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Contact Number</Label>
                      <p className="font-semibold">{order.client_phone}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm text-gray-500 mb-3 block">Order Items</Label>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">₱{(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">₱{order.total_amount?.toFixed(2)}</span>
                  </div>

                  {order.special_instructions && (
                    <div className="border-t pt-4">
                      <Label className="text-sm text-gray-500">Special Instructions</Label>
                      <p className="text-gray-700 mt-1">{order.special_instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Progress Card */}
              {job ? (
                <Card className="shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Production Status</CardTitle>
                    <p className="text-sm text-gray-600">Your order has been converted to a production task</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Task ID</Label>
                        <p className="font-semibold">{job.job_id}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Deadline</Label>
                        <p className="font-semibold">{format(new Date(job.deadline), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>

                    {/* Progress Timeline */}
                    <div className="border-t pt-6">
                      <Label className="text-sm text-gray-500 mb-4 block">Progress Timeline</Label>
                      <div className="relative">
                        {jobStatuses.map((status, index) => {
                          const currentStep = getJobStatusInfo(job.status).step;
                          const isCompleted = currentStep > index + 1;
                          const isCurrent = currentStep === index + 1;
                          const StatusIcon = status.icon;

                          return (
                            <div key={status.key} className="flex items-center mb-6 last:mb-0">
                              <div className="relative">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                    isCompleted
                                      ? 'bg-green-500 border-green-500'
                                      : isCurrent
                                      ? 'bg-blue-500 border-blue-500 animate-pulse'
                                      : 'bg-gray-200 border-gray-300'
                                  }`}
                                >
                                  <StatusIcon
                                    className={`w-5 h-5 ${
                                      isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                                    }`}
                                  />
                                </div>
                                {index < jobStatuses.length - 1 && (
                                  <div
                                    className={`absolute left-1/2 top-10 w-0.5 h-8 -ml-px ${
                                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                                  />
                                )}
                              </div>
                              <div className="ml-4">
                                <p
                                  className={`font-semibold ${
                                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                                  }`}
                                >
                                  {status.label}
                                </p>
                                {isCurrent && (
                                  <Badge className="mt-1 bg-blue-100 text-blue-800">Current Stage</Badge>
                                )}
                                {isCompleted && (
                                  <p className="text-xs text-green-600 mt-1">✓ Completed</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {job.status === 'ready_pickup' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Great news! Your order is ready for pickup. Please contact us to arrange collection.
                        </AlertDescription>
                      </Alert>
                    )}

                    {job.status === 'completed' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Your order has been completed! Thank you for choosing MCTS.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ) : order.status === 'new' || order.status === 'reviewing' ? (
                <Card className="shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Order Under Review</h3>
                    <p className="text-gray-600 mb-4">
                      Our team is currently reviewing your order. We'll contact you shortly to confirm the details and start production.
                    </p>
                    <Badge className="bg-blue-100 text-blue-800">Estimated response: Within 24 hours</Badge>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <a href={createPageUrl('ClientOrderForm')} className="flex-1">
              <Button variant="outline" className="w-full bg-white hover:bg-gray-100">
                <Package className="w-4 h-4 mr-2" />
                Place New Order
              </Button>
            </a>
            <a href={createPageUrl('Home')} className="flex-1">
              <Button variant="outline" className="w-full bg-white hover:bg-gray-100">
                <Home className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}