import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Phone, User, Calendar, Image as ImageIcon, FileText, ExternalLink, Search, Filter, Ruler } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createPageUrl } from "@/utils";
import KeychainVisualEditor from "@/components/keychain/KeychainVisualEditor";

export default function KeychainOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStatus, setEditingStatus] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  const statusColors = {
    new: "bg-blue-100 text-blue-800",
    for_approval: "bg-yellow-100 text-yellow-800",
    for_payment: "bg-purple-100 text-purple-800",
    ongoing: "bg-orange-100 text-orange-800",
    done: "bg-green-100 text-green-800"
  };

  const keychainTypeLabels = {
    "1_photo_same_b2b": "1 Photo (Same B2B)",
    "2_photos_different_b2b": "2 Photos (Different B2B)",
    "3_photos_same_b2b": "3 Photos (Same B2B)",
    "6_photos_different_b2b": "6 Photos (Different B2B)"
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.KeychainOrder.list("-created_date");
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.contact_number?.includes(searchQuery)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await base44.entities.KeychainOrder.update(orderId, { status: newStatus });
      toast({
        title: "Status updated",
        description: `Order status changed to ${newStatus.replace(/_/g, ' ')}`
      });
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;

    try {
      await base44.entities.KeychainOrder.update(selectedOrder.id, {
        admin_notes: adminNotes
      });
      toast({
        title: "Notes saved",
        description: "Admin notes updated successfully"
      });
      loadOrders();
      setSelectedOrder({ ...selectedOrder, admin_notes: adminNotes });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    }
  };

  const handleUpdateItem = async (itemIndex) => {
    if (!selectedOrder || !editingItem) return;

    try {
      const updatedOrders = [...selectedOrder.orders];
      updatedOrders[itemIndex] = editingItem;

      await base44.entities.KeychainOrder.update(selectedOrder.id, {
        orders: updatedOrders
      });

      toast({
        title: "Item updated",
        description: "Keychain item updated successfully"
      });
      
      loadOrders();
      setSelectedOrder({ ...selectedOrder, orders: updatedOrders });
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      });
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setEditingStatus(order.status);
    setAdminNotes(order.admin_notes || "");
  };

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Keychain Orders</h1>
        <p className="text-muted-foreground">Manage customer keychain photo orders</p>
        <div className="mt-4">
          <a
            href={createPageUrl("KeychainPhotoForm")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            View Public Form
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {["new", "for_approval", "for_payment", "ongoing", "done"].map(status => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{getStatusCount(status)}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {status.replace(/_/g, ' ')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="for_approval">For Approval</SelectItem>
                  <SelectItem value="for_payment">For Payment</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map(order => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {order.client_name}
                      </h3>
                      <Badge className={statusColors[order.status]}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {order.contact_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(order.created_date), "MMM d, yyyy h:mm a")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {order.orders?.length || 0} keychain{order.orders?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => openOrderDetails(order)}>
                    View Details
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {order.orders?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">
                        {keychainTypeLabels[item.keychain_type]}
                      </p>
                      {item.keychain_size && (
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          {item.keychain_size}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {item.photo_urls?.slice(0, 3).map((url, pIdx) => (
                          <OptimizedImage
                            key={pIdx}
                            src={url}
                            alt={`Photo ${pIdx + 1}`}
                            className="w-16 h-16 rounded border"
                            objectFit="cover"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Order Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Client Name</Label>
                  <p className="font-medium">{selectedOrder.client_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Number</Label>
                  <p className="font-medium">{selectedOrder.contact_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.created_date), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Select
                    value={editingStatus}
                    onValueChange={(value) => {
                      setEditingStatus(value);
                      handleUpdateStatus(selectedOrder.id, value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="for_approval">For Approval</SelectItem>
                      <SelectItem value="for_payment">For Payment</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={3}
                />
                <Button onClick={handleSaveNotes} className="mt-2" size="sm">
                  Save Notes
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Keychain Orders ({selectedOrder.orders?.length || 0})
                </h3>
                <div className="space-y-4">
                  {selectedOrder.orders?.map((item, idx) => (
                    <Card key={idx}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Keychain {idx + 1}: {keychainTypeLabels[item.keychain_type]}
                          </CardTitle>
                          {item.keychain_size && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Ruler className="w-3 h-3" />
                              {item.keychain_size}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
                          Edit
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <KeychainVisualEditor
                          numPhotos={item.num_photos || item.photo_urls?.length || 0}
                          photoUrls={item.photo_urls || []}
                          backgroundColor={item.background_color || "#FFFFFF"}
                          onBackgroundColorChange={() => {}}
                        />
                        
                        <div>
                          <Label className="mb-2 block">Photos ({item.photo_urls?.length || 0})</Label>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {item.photo_urls?.map((url, pIdx) => (
                              <a
                                key={pIdx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative"
                              >
                                <OptimizedImage
                                  src={url}
                                  alt={`Photo ${pIdx + 1}`}
                                  className="w-full h-32 rounded-lg border group-hover:opacity-75 transition-opacity"
                                  objectFit="cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ImageIcon className="w-8 h-8 text-white drop-shadow-lg" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                        {item.notes && (
                          <div>
                            <Label className="mb-1 block flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Client Notes
                            </Label>
                            <p className="text-sm bg-gray-50 p-3 rounded-lg">{item.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Keychain Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Keychain Size</Label>
                <Input
                  value={editingItem.keychain_size || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, keychain_size: e.target.value })}
                  placeholder="e.g., 1x3 inches"
                />
              </div>
              <div>
                <Label>Number of Photos</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingItem.num_photos || editingItem.photo_urls?.length || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, num_photos: parseInt(e.target.value) || 1 })}
                />
              </div>
              <KeychainVisualEditor
                numPhotos={editingItem.num_photos || editingItem.photo_urls?.length || 0}
                photoUrls={editingItem.photo_urls || []}
                backgroundColor={editingItem.background_color || "#FFFFFF"}
                onBackgroundColorChange={(color) => setEditingItem({ ...editingItem, background_color: color })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  const itemIndex = selectedOrder.orders.findIndex(o => o === selectedOrder.orders.find((_, i) => selectedOrder.orders[i] === editingItem));
                  handleUpdateItem(itemIndex);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}