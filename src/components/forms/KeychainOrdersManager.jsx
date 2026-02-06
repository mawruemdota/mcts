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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, Phone, User, Calendar, FileText, ExternalLink, 
  Search, Filter, Ruler, Eye, RefreshCw, Copy, Link2, Plus, Trash2, Edit, Save, Download, MoreVertical
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
  const [templates, setTemplates] = useState([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

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

  const getNumPhotosFromType = (type) => {
    const match = type?.match(/^(\d+)_photo/);
    return match ? parseInt(match[1]) : 1;
  };

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { KeychainTemplate } = await import('@/entities/all');
      const templatesData = await KeychainTemplate.list('-created_date');
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error loading templates:", error);
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

  const openImagePreview = (order) => {
    const images = order.orders?.filter(item => item.generated_image_url).map(item => item.generated_image_url) || [];
    setImagePreview({ clientName: order.client_name, images });
    setShowImagePreview(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    
    try {
      const { KeychainOrder } = await import('@/entities/all');
      await KeychainOrder.delete(orderId);
      toast({
        title: "Order deleted",
        description: "The order has been removed"
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the order",
        variant: "destructive"
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicFormUrl);
    toast({ title: 'Link Copied!', description: 'The keychain order form link has been copied to your clipboard.' });
  };

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate?.template_name) {
      toast({ title: "Error", description: "Please enter a template name", variant: "destructive" });
      return;
    }

    try {
      const { KeychainTemplate } = await import('@/entities/all');
      if (editingTemplate.id) {
        await KeychainTemplate.update(editingTemplate.id, editingTemplate);
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        await KeychainTemplate.create(editingTemplate);
        toast({ title: "Success", description: "Template saved successfully" });
      }
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { KeychainTemplate } = await import('@/entities/all');
      await KeychainTemplate.delete(templateId);
      toast({ title: "Success", description: "Template deleted" });
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  };

  const openNewTemplate = () => {
    setEditingTemplate({
      template_name: "",
      description: "",
      num_photos: 3,
      width_inches: 1,
      height_inches: 3,
      orientation: "portrait",
      back_to_back: "same",
      photo_margin: 4,
      photo_border_width: 0,
      photo_border_color: "#000000",
      background_color: "#FFFFFF",
      background_image: "",
      is_active: true
    });
    setShowTemplateDialog(true);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6 mt-6">
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => {
                              const hasImages = order.orders?.some(item => item.generated_image_url);
                              if (!hasImages) {
                                toast({
                                  title: "No images available",
                                  description: "This order doesn't have generated images yet",
                                  variant: "destructive"
                                });
                                return;
                              }
                              order.orders.forEach((item, idx) => {
                                if (item.generated_image_url) {
                                  const link = document.createElement('a');
                                  link.href = item.generated_image_url;
                                  link.download = `keychain_${order.client_name}_${idx + 1}.png`;
                                  link.click();
                                }
                              });
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => openImagePreview(order)} 
                            variant="ghost" 
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openOrderDetails(order)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "for_approval")}>
                                Change to For Approval
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "for_payment")}>
                                Change to For Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "ongoing")}>
                                Change to Ongoing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "done")}>
                                Change to Done
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteOrder(order.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{imagePreview?.clientName} - Keychain Designs</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imagePreview?.images.map((url, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <img src={url} alt={`Keychain ${idx + 1}`} className="w-full h-auto" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
                       {item.generated_image_url ? (
                         <div className="space-y-2">
                           <OptimizedImage
                             src={item.generated_image_url}
                             alt="Generated Keychain"
                             className="w-full h-48 object-contain rounded border"
                           />
                           <a 
                             href={item.generated_image_url} 
                             download={`keychain_order_${selectedOrder.id}_item_${idx + 1}.png`}
                             target="_blank"
                             rel="noopener noreferrer"
                           >
                             <Button variant="outline" size="sm">
                               <Download className="w-4 h-4 mr-2" />
                               Download Generated Image
                             </Button>
                           </a>
                         </div>
                       ) : (
                         <p className="text-sm text-muted-foreground">No generated image available.</p>
                       )}

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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Keychain Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Background & Photos</Label>
                <p className="text-sm text-muted-foreground mb-4">Customize background color or image. Photos are set by the client.</p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingItem.background_color || "#FFFFFF"}
                    onChange={(e) => setEditingItem({ ...editingItem, background_color: e.target.value, background_image: null })}
                    className="w-12 h-12 rounded border cursor-pointer"
                  />
                  <div className="flex-1">
                    <Label>Background Color</Label>
                    <p className="text-xs text-muted-foreground">{editingItem.background_color || "#FFFFFF"}</p>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">or</div>

                <div>
                  <Label>Background Image URL</Label>
                  <Input
                    value={editingItem.background_image || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, background_image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                {editingItem.background_image && (
                  <OptimizedImage
                    src={editingItem.background_image}
                    alt="Background"
                    className="w-full h-32 rounded border"
                    objectFit="cover"
                  />
                )}
              </div>

              {/* Individual photos are no longer stored/displayed here */}
              {editingItem.generated_image_url && (
                <div>
                  <Label>Generated Keychain Preview</Label>
                  <OptimizedImage
                    src={editingItem.generated_image_url}
                    alt="Generated Keychain"
                    className="w-full h-48 object-contain rounded border mt-2"
                  />
                  <a 
                    href={editingItem.generated_image_url} 
                    download={`keychain_item_preview.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download className="w-4 h-4 mr-2" />
                      Download Preview
                    </Button>
                  </a>
                </div>
              )}

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
        </TabsContent>

        <TabsContent value="templates" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Keychain Templates</h3>
              <p className="text-sm text-muted-foreground">Save and reuse keychain design configurations</p>
            </div>
            <Button onClick={openNewTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.template_name}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      )}
                    </div>
                    {!template.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Photos:</span> {template.num_photos} ({template.orientation})</p>
                    <p><span className="text-muted-foreground">Size:</span> {template.width_inches}" × {template.height_inches}"</p>
                    <p><span className="text-muted-foreground">Back to Back:</span> {template.back_to_back}</p>
                    {template.photo_border_width > 0 && (
                      <p><span className="text-muted-foreground">Border:</span> {template.photo_border_width}px</p>
                    )}
                  </div>

                  <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
                    <div 
                      className="h-32 rounded flex items-center justify-center"
                      style={{ 
                        backgroundColor: template.background_image ? 'transparent' : template.background_color,
                        backgroundImage: template.background_image ? `url(${template.background_image})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <span className="text-xs text-gray-500">Preview</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowTemplateDialog(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {templates.length === 0 && (
              <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No templates yet</p>
                <Button onClick={openNewTemplate} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Template
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      {editingTemplate && (
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate.id ? "Edit" : "New"} Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label>Template Name *</Label>
                <Input
                  value={editingTemplate.template_name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, template_name: e.target.value })}
                  placeholder="e.g., Classic 3-Photo"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="Describe this template..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Number of Photos *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingTemplate.num_photos}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, num_photos: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Width (inches) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={editingTemplate.width_inches}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, width_inches: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Height (inches) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={editingTemplate.height_inches}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, height_inches: parseFloat(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Orientation *</Label>
                  <Select
                    value={editingTemplate.orientation}
                    onValueChange={(value) => setEditingTemplate({ ...editingTemplate, orientation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Back to Back *</Label>
                  <Select
                    value={editingTemplate.back_to_back}
                    onValueChange={(value) => setEditingTemplate({ ...editingTemplate, back_to_back: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="same">Same (both sides same photos)</SelectItem>
                      <SelectItem value="different">Different (2x photos needed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editingTemplate.back_to_back === "different" && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> This template requires {editingTemplate.num_photos * 2} photos total 
                    ({editingTemplate.num_photos} for front, {editingTemplate.num_photos} for back)
                  </p>
                </div>
              )}

              <KeychainVisualEditor
                numPhotos={editingTemplate.num_photos}
                photoUrls={[]}
                backgroundColor={editingTemplate.background_color}
                onBackgroundColorChange={(color) => setEditingTemplate({ ...editingTemplate, background_color: color })}
                backgroundImage={editingTemplate.background_image}
                onBackgroundImageChange={(url) => setEditingTemplate({ ...editingTemplate, background_image: url })}
                photoBorderWidth={editingTemplate.photo_border_width}
                onPhotoBorderWidthChange={(width) => setEditingTemplate({ ...editingTemplate, photo_border_width: width })}
                photoBorderColor={editingTemplate.photo_border_color}
                onPhotoBorderColorChange={(color) => setEditingTemplate({ ...editingTemplate, photo_border_color: color })}
                photoMargin={editingTemplate.photo_margin || 4}
                onPhotoMarginChange={(margin) => setEditingTemplate({ ...editingTemplate, photo_margin: margin })}
                orientation={editingTemplate.orientation}
                widthInches={editingTemplate.width_inches}
                heightInches={editingTemplate.height_inches}
                photoLayout={editingTemplate.photo_layout}
                onPhotoLayoutChange={(layout) => setEditingTemplate({ ...editingTemplate, photo_layout: layout })}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingTemplate.is_active}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">Active (available for use)</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowTemplateDialog(false);
                  setEditingTemplate(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingTemplate.id ? "Update" : "Save"} Template
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