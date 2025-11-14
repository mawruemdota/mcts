import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Loader2,
  Edit,
  Trash2,
  Filter,
  Calendar,
  User,
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Palette,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function CreativesPage() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    client_name: "",
    assignee_email: "",
    assignee_name: "",
    request_description: "",
    additional_info: "",
    deadline: "",
    status: "pending",
    priority: "normal",
    file_urls: [],
    output_urls: []
  });

  // Batch upload state - array of tasks
  const [batchTasks, setBatchTasks] = useState([
    {
      title: "",
      client_id: "",
      client_name: "",
      assignee_email: "",
      assignee_name: "",
      request_description: "",
      deadline: "",
      priority: "normal"
    }
  ]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksData, clientsData, usersData] = await Promise.all([
        base44.entities.CreativeTask.list("-created_date"),
        base44.entities.Client.list(),
        base44.entities.User.list()
      ]);
      setTasks(tasksData);
      setClients(clientsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load data." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      title: "",
      client_id: "",
      client_name: "",
      assignee_email: "",
      assignee_name: "",
      request_description: "",
      additional_info: "",
      deadline: "",
      status: "pending",
      priority: "normal",
      file_urls: [],
      output_urls: []
    });
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        client_name: client.client_name
      }));
    }
  };

  const handleAssigneeChange = (userEmail) => {
    const user = users.find(u => u.email === userEmail);
    if (user) {
      setFormData(prev => ({
        ...prev,
        assignee_email: userEmail,
        assignee_name: user.nickname || user.full_name
      }));
    }
  };

  const handleFileUpload = async (e, fieldName) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = files.map(file => base44.integrations.Core.UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(r => r.file_url);

      setFormData(prev => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), ...fileUrls]
      }));

      toast({ title: "Success", description: `${files.length} file(s) uploaded successfully.` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to upload files." });
    }
    setUploadingFiles(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.client_name || !formData.assignee_email || !formData.request_description || !formData.deadline) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields." });
      return;
    }

    try {
      if (editingTask) {
        await base44.entities.CreativeTask.update(editingTask.id, formData);
        toast({ title: "Success", description: "Creative task updated successfully." });
      } else {
        await base44.entities.CreativeTask.create(formData);
        toast({ title: "Success", description: "Creative task created successfully." });
      }

      resetForm();
      setShowCreateDialog(false);
      setEditingTask(null);
      loadData();
    } catch (error) {
      console.error("Save error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save creative task." });
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || "",
      client_id: task.client_id || "",
      client_name: task.client_name || "",
      assignee_email: task.assignee_email || "",
      assignee_name: task.assignee_name || "",
      request_description: task.request_description || "",
      additional_info: task.additional_info || "",
      deadline: task.deadline || "",
      status: task.status || "pending",
      priority: task.priority || "normal",
      file_urls: task.file_urls || [],
      output_urls: task.output_urls || []
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this creative task?")) return;

    try {
      await base44.entities.CreativeTask.delete(taskId);
      toast({ title: "Success", description: "Creative task deleted." });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete task." });
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await base44.entities.CreativeTask.update(taskId, { status: newStatus });
      toast({ title: "Success", description: "Status updated successfully." });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  // Batch upload functions
  const addBatchRow = () => {
    setBatchTasks([
      ...batchTasks,
      {
        title: "",
        client_id: "",
        client_name: "",
        assignee_email: "",
        assignee_name: "",
        request_description: "",
        deadline: "",
        priority: "normal"
      }
    ]);
  };

  const removeBatchRow = (index) => {
    setBatchTasks(batchTasks.filter((_, i) => i !== index));
  };

  const updateBatchTask = (index, field, value) => {
    const newBatchTasks = [...batchTasks];
    newBatchTasks[index][field] = value;
    
    // Handle client selection
    if (field === "client_id") {
      const client = clients.find(c => c.id === value);
      if (client) {
        newBatchTasks[index].client_name = client.client_name;
      }
    }
    
    // Handle assignee selection
    if (field === "assignee_email") {
      const user = users.find(u => u.email === value);
      if (user) {
        newBatchTasks[index].assignee_name = user.nickname || user.full_name;
      }
    }
    
    setBatchTasks(newBatchTasks);
  };

  const handleBatchSubmit = async () => {
    // Validate all tasks
    const validTasks = batchTasks.filter(task => 
      task.title && task.client_name && task.assignee_email && task.request_description && task.deadline
    );

    if (validTasks.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in at least one complete task." });
      return;
    }

    if (validTasks.length < batchTasks.length) {
      toast({ 
        variant: "destructive", 
        title: "Warning", 
        description: `Only ${validTasks.length} out of ${batchTasks.length} tasks are complete. Incomplete tasks will be skipped.` 
      });
    }

    try {
      const tasksToCreate = validTasks.map(task => ({
        ...task,
        status: "pending"
      }));

      await base44.entities.CreativeTask.bulkCreate(tasksToCreate);
      toast({ title: "Success", description: `${tasksToCreate.length} creative task(s) created successfully.` });
      
      // Reset batch form
      setBatchTasks([
        {
          title: "",
          client_id: "",
          client_name: "",
          assignee_email: "",
          assignee_name: "",
          request_description: "",
          deadline: "",
          priority: "normal"
        }
      ]);
      
      setShowBatchDialog(false);
      loadData();
    } catch (error) {
      console.error("Batch create error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create tasks." });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "ongoing": return <PlayCircle className="w-4 h-4" />;
      case "for_checking": return <AlertCircle className="w-4 h-4" />;
      case "done": return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-800";
      case "ongoing": return "bg-blue-100 text-blue-800";
      case "for_checking": return "bg-yellow-100 text-yellow-800";
      case "done": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low": return "bg-slate-100 text-slate-700";
      case "normal": return "bg-blue-100 text-blue-700";
      case "high": return "bg-orange-100 text-orange-700";
      case "urgent": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesAssignee = filterAssignee === "all" || task.assignee_email === filterAssignee;
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.request_description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesAssignee && matchesSearch;
  });

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Palette className="w-8 h-8 text-purple-600" />
              Creative Tasks
            </h1>
            <p className="text-muted-foreground mt-1">Manage all creative requests and assignments</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Creative Tool Buttons */}
            <Link to={createPageUrl("ARStickerManager")}>
              <Button variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                AR Stickers
              </Button>
            </Link>
            
            <Button variant="outline" size="sm" onClick={() => {
              // You can implement a dialog or navigate to image generator
              toast({ title: "Coming Soon", description: "Image Generator will open here" });
            }}>
              <ImageIcon className="w-4 h-4 mr-2" />
              AI Image Gen
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => {
              // You can implement a dialog or navigate to caption maker
              toast({ title: "Coming Soon", description: "Caption Maker will open here" });
            }}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Caption Maker
            </Button>

            {/* Main Action Buttons */}
            <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Batch Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Batch Add Creative Tasks</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add multiple creative tasks at once. Fill in the details for each task below.
                  </p>
                  
                  <div className="space-y-4">
                    {batchTasks.map((task, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="pt-6">
                          <div className="absolute top-2 right-2">
                            {batchTasks.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeBatchRow(index)}
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Title *</Label>
                              <Input
                                value={task.title}
                                onChange={(e) => updateBatchTask(index, "title", e.target.value)}
                                placeholder="Task title"
                                className="h-9"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Client *</Label>
                              <Select 
                                value={task.client_id} 
                                onValueChange={(value) => updateBatchTask(index, "client_id", value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent>
                                  {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.client_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Assignee *</Label>
                              <Select 
                                value={task.assignee_email} 
                                onValueChange={(value) => updateBatchTask(index, "assignee_email", value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map(user => (
                                    <SelectItem key={user.email} value={user.email}>
                                      {user.nickname || user.full_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="md:col-span-2">
                              <Label className="text-xs">Request Description *</Label>
                              <Input
                                value={task.request_description}
                                onChange={(e) => updateBatchTask(index, "request_description", e.target.value)}
                                placeholder="What needs to be created..."
                                className="h-9"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Deadline *</Label>
                              <Input
                                type="date"
                                value={task.deadline}
                                onChange={(e) => updateBatchTask(index, "deadline", e.target.value)}
                                className="h-9"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Priority</Label>
                              <Select 
                                value={task.priority} 
                                onValueChange={(value) => updateBatchTask(index, "priority", value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Button variant="outline" onClick={addBatchRow} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Task
                  </Button>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBatchSubmit}>
                    Create {batchTasks.length} Task{batchTasks.length !== 1 ? 's' : ''}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateDialog} onOpenChange={(open) => {
              setShowCreateDialog(open);
              if (!open) {
                resetForm();
                setEditingTask(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTask ? "Edit" : "Create New"} Creative Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="title">Task Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Social Media Graphics for Campaign X"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="client">Client *</Label>
                      <Select value={formData.client_id} onValueChange={handleClientChange} required>
                        <SelectTrigger id="client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.client_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assignee">Assignee *</Label>
                      <Select value={formData.assignee_email} onValueChange={handleAssigneeChange} required>
                        <SelectTrigger id="assignee">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.email} value={user.email}>
                              {user.nickname || user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="deadline">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger id="priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="request">Request Description *</Label>
                      <Textarea
                        id="request"
                        value={formData.request_description}
                        onChange={(e) => setFormData({ ...formData, request_description: e.target.value })}
                        placeholder="Detailed description of what needs to be created..."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="additional">Additional Information</Label>
                      <Textarea
                        id="additional"
                        value={formData.additional_info}
                        onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                        placeholder="Any extra notes, references, or instructions..."
                        rows={3}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Reference Files (Optional)</Label>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e, "file_urls")}
                        disabled={uploadingFiles}
                      />
                      {formData.file_urls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.file_urls.map((url, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              File {idx + 1}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {editingTask && (
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="for_checking">For Checking</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                      setEditingTask(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploadingFiles}>
                      {uploadingFiles ? "Uploading..." : editingTask ? "Update Task" : "Create Task"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search tasks by title, client, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="for_checking">For Checking</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.nickname || user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Creative Tasks ({filteredTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No creative tasks found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.request_description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {task.request_description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            {task.client_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {task.assignee_name || task.assignee_email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {task.deadline ? format(new Date(task.deadline), "MMM dd, yyyy") : "No deadline"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task.id, value)}
                          >
                            <SelectTrigger className="w-36">
                              <Badge className={getStatusColor(task.status)}>
                                {getStatusIcon(task.status)}
                                <span className="ml-2">{task.status.replace("_", " ")}</span>
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="for_checking">For Checking</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(task)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}