import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  AlertTriangle,
  AlertCircle,
  ShoppingCart,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InventoryRequest, User } from "@/entities/all";
import { useToast } from "@/components/ui/use-toast";

export default function InventoryAlerts({ inventory = [], user }) {
  const [inventoryRequests, setInventoryRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState({});
  const { toast } = useToast();

  const loadInventoryRequests = useCallback(async () => {
    if (user?.email) {
      try {
        const [requests, allUsers] = await Promise.all([
          InventoryRequest.filter({
            assignee: user.email,
            status: { $in: ['pending', 'approved'] }
          }, '-created_date', 5),
          User.list()
        ]);
        
        setInventoryRequests(requests);
        
        // Create a map of email to user data for quick lookup
        const usersMap = {};
        allUsers.forEach(u => {
          usersMap[u.email] = u;
        });
        setUsers(usersMap);
      } catch (error) {
        console.error('Error loading inventory requests:', error);
        setInventoryRequests([]);
      }
    }
    setIsLoading(false);
  }, [user?.email]);

  React.useEffect(() => {
    loadInventoryRequests();
  }, [loadInventoryRequests]);

  const handleApproveRequest = async (requestId) => {
    try {
      await InventoryRequest.update(requestId, { status: 'approved' });
      toast({ title: "Success", description: "Request approved successfully." });
      loadInventoryRequests(); // Reload data
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to approve request." });
    }
  };

  const alertItems = inventory.filter((item) =>
    item.status === 'low' || item.status === 'critical' || item.status === 'out_of_stock'
  ).slice(0, 6);

  const getStatusColor = (status) => {
    const colors = {
      low: "bg-yellow-100 text-yellow-800 border-yellow-200",
      critical: "bg-red-100 text-red-800 border-red-200",
      out_of_stock: "bg-gray-100 text-gray-800 border-gray-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-blue-100 text-blue-800 border-blue-200"
    };
    return colors[status] || colors.low;
  };

  const getStatusIcon = (status) => {
    if (status === 'out_of_stock') return AlertCircle;
    return AlertTriangle;
  };

  const getUserNickname = (email) => {
    const userData = users[email];
    return userData?.nickname || userData?.full_name || email?.split('@')[0];
  };

  const hasAlerts = alertItems.length > 0 || inventoryRequests.length > 0;

  return (
    <Card className="border-none shadow-md w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="w-4 h-4" />
          Inventory Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {!hasAlerts ?
          <div className="text-center py-6 text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All inventory levels are good!</p>
          </div> :

          <div className="space-y-3">
            {/* Inventory Stock Alerts */}
            {alertItems.length > 0 &&
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Low Stock</h4>
                {alertItems.map((item) => {
                  const StatusIcon = getStatusIcon(item.status);
                  return (
                    <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-3 h-3 ${item.status === 'critical' || item.status === 'out_of_stock' ?
                              'text-red-500' :
                              'text-yellow-500'}`
                          } />
                          <span className="font-medium text-gray-900 text-sm">
                            {item.item_name}
                          </span>
                        </div>
                        <Badge className={`${getStatusColor(item.status)} border capitalize text-xs`}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span>Current: {item.current_quantity} {item.unit}</span>
                        {item.status !== 'out_of_stock' &&
                          <>
                            <span className="text-gray-400 mx-2">•</span>
                            <span>Min: {item.minimum_threshold} {item.unit}</span>
                          </>
                        }
                      </div>
                    </div>);

                })}
              </div>
            }

            {/* Inventory Purchase Requests */}
            {inventoryRequests.length > 0 &&
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Assigned Requests</h4>
                {inventoryRequests.map((request) =>
                  <div key={request.id} className="p-3 hover:bg-gray-50 transition-colors rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-3 h-3 text-blue-500" />
                        <span className="text-slate-300 text-sm font-medium">
                          {request.item_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(request.status)} border capitalize text-xs`}>
                          {request.status}
                        </Badge>
                        {request.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleApproveRequest(request.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <span>Qty: {request.quantity} {request.unit}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span>By: {getUserNickname(request.requested_by)}</span>
                    </div>
                  </div>
                )}
              </div>
            }

            {hasAlerts &&
              <div className="pt-2 border-t">
                <Link to={createPageUrl('Inventory')}>
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View All Inventory
                  </Button>
                </Link>
              </div>
            }
          </div>
        }
      </CardContent>
    </Card>);

}