import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Package, Phone, User, Calendar, FileText, ExternalLink, 
  Search, Filter, Ruler, Eye, RefreshCw, Copy, Link2 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createPageUrl } from "@/utils";
import KeychainVisualEditor from "@/components/keychain/KeychainVisualEditor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const KeychainOrdersManager = ({ orders, isLoading, onRefresh }) => {
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStatus, setEditingStatus] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  const publicFormUrl = `${window.location.origin}${createPageUrl('KeychainPhotoForm')}`;

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

  React.useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

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
      const { KeychainOrder } = await import('@/entities/all');
      await KeychainOrder.update(orderId, { status: newStatus });
      toast({
        title: "Status updated",
        description: `Order status changed to ${newStatus.replace(/_/g, ' ')}`
      });
      onRefresh();
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
      const { KeychainOrder } = await import('@/entities/all');
      await KeychainOrder.update(selectedOrder.id, {
        admin_notes: adminNotes
      });
      toast({
        title: "Notes saved",
        description: "Admin notes updated successfully"
      });
      onRefresh();
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
      const { KeychainOrder } = await import('@/entities/all');
      const updatedOrders = [...selectedOrder.orders];
      updatedOrders[itemIndex] = editingItem;

      await KeychainOrder.update(selectedOrder.id, {
        orders: updatedOrders
      });

      toast({
        title: "Item updated",
        description: "Keychain item updated successfully"
      });
      
      onRefresh();
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicFormUrl);
    toast({ title: 'Link Copied!', description: 'The keychain order form link has been copied to your clipboard.' });
  };

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Public Form Link Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Link2 className="w-5 h-5" />
            Keychain Order Form Link
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Share this link with your clients so they can submit keychain orders with photos
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={publicFormUrl}
              readOnly
              className="bg-white dark:bg-gray-900 font-mono text-sm"
            />
            <Button onClick={handleCopyLink} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <a href={publicFormUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

      {/* Filters */}
      <Card>
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
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Keychain Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No orders found. Share the order form link with your clients!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.client_name}</TableCell>
                      <TableCell>{order.contact_number}</TableCell>
                      <TableCell>{order.orders?.length || 0} keychain{order.orders?.length !== 1 ? 's' : ''}</TableCell>
                      <TableCell>{format(new Date(order.created_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => openOrderDetails(order)} 
                          variant="ghost" 
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
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
                          backgroundImage={item.background_image}
                          onBackgroundImageChange={() => {}}
                          photoBorderWidth={item.photo_border_width || 0}
                          onPhotoBorderWidthChange={() => {}}
                          photoBorderColor={item.photo_border_color || "#000000"}
                          onPhotoBorderColorChange={() => {}}
                          templateSize={item.template_size || "medium"}
                          onTemplateSizeChange={() => {}}
                          photoMargin={item.photo_margin || 4}
                          onPhotoMarginChange={() => {}}
                        />
                        
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

      {/* Edit Item Dialog */}
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
                backgroundImage={editingItem.background_image}
                onBackgroundImageChange={(url) => setEditingItem({ ...editingItem, background_image: url })}
                photoBorderWidth={editingItem.photo_border_width || 0}
                onPhotoBorderWidthChange={(width) => setEditingItem({ ...editingItem, photo_border_width: width })}
                photoBorderColor={editingItem.photo_border_color || "#000000"}
                onPhotoBorderColorChange={(color) => setEditingItem({ ...editingItem, photo_border_color: color })}
                templateSize={editingItem.template_size || "medium"}
                onTemplateSizeChange={(size) => setEditingItem({ ...editingItem, template_size: size })}
                photoMargin={editingItem.photo_margin || 4}
                onPhotoMarginChange={(margin) => setEditingItem({ ...editingItem, photo_margin: margin })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  const itemIndex = selectedOrder.orders.findIndex(o => o === editingItem);
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
};

export default KeychainOrdersManager;