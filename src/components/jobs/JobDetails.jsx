import React, { useState, useEffect, useCallback } from 'react';
import { Job, JobComment, User, Notification } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from '@/components/ui/checkbox';
import { X, User as UserIcon, Package, Clock, MessageSquare, Info, Plus, Trash2, Send, Calendar as CalendarIcon, Edit, Save, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const userMap = new Map();

export default function JobDetails({ job, onClose, onUpdate, onDelete, user }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(job?.status);
  const [productionNotes, setProductionNotes] = useState(job?.production_notes || '');
  const [assignedTo, setAssignedTo] = useState(job?.assigned_to || '');
  const [operators, setOperators] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  const [editableFields, setEditableFields] = useState({
    title: job?.title || '',
    deadline: job?.deadline ? job.deadline.split('T')[0] : '',
    deadline_time: job?.deadline ? (job.deadline.includes('T') ? job.deadline.split('T')[1]?.slice(0,5) : '') : '',
    special_instructions: job?.special_instructions || '',
    items: job?.items && job.items.length > 0 ? job.items : [{ item_name: '', quantity: 1, price: 0 }],
    checklist: job?.checklist || []
  });

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const statusOptions = [
    { value: 'pending_approval', label: 'Pending' },
    { value: 'in_production', label: 'Working on' },
    { value: 'quality_check', label: 'Quality Control' },
    { value: 'ready_pickup', label: 'For Pickup' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const users = await User.list();
      userMap.clear();
      users.forEach(u => userMap.set(u.email, u.nickname || u.full_name));
      setAllUsers(users);
      setOperators(users);

      const jobComments = await JobComment.filter({ job_id: job.id }, '-created_date');
      setComments(jobComments);
    } catch (error) {
      console.error('Failed to load users or comments:', error);
    }
  }, [job.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...editableFields.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditableFields(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setEditableFields(prev => ({
      ...prev,
      items: [...prev.items, { item_name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (editableFields.items.length > 1) {
      setEditableFields(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    } else {
      toast({ variant: 'destructive', title: 'Cannot remove last item' });
    }
  };

  const addChecklistItem = async () => {
    if (newChecklistItem.trim()) {
      const updatedChecklist = [...editableFields.checklist, { task: newChecklistItem.trim(), completed: false }];
      setEditableFields(prev => ({ ...prev, checklist: updatedChecklist }));
      setNewChecklistItem('');
      try {
        await Job.update(job.id, { checklist: updatedChecklist });
        toast({ title: 'Checklist item added' });
      } catch (error) {
        console.error('Failed to add checklist item:', error);
        toast({ variant: 'destructive', title: 'Failed to add checklist item' });
        setEditableFields(prev => ({ ...prev, checklist: job.checklist }));
      }
    }
  };

  const removeChecklistItem = async (index) => {
    const updatedChecklist = editableFields.checklist.filter((_, i) => i !== index);
    setEditableFields(prev => ({ ...prev, checklist: updatedChecklist }));
    try {
      await Job.update(job.id, { checklist: updatedChecklist });
      toast({ title: 'Checklist item removed' });
    } catch (error) {
      console.error('Failed to remove checklist item:', error);
      toast({ variant: 'destructive', title: 'Failed to remove checklist item' });
      setEditableFields(prev => ({ ...prev, checklist: job.checklist }));
    }
  };

  const handleChecklistToggle = async (index) => {
    const updatedChecklist = [...editableFields.checklist];
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      completed: !updatedChecklist[index].completed
    };
    
    setEditableFields(prev => ({ ...prev, checklist: updatedChecklist }));
    
    // Immediately save to database
    try {
      await Job.update(job.id, { checklist: updatedChecklist });
      toast({ title: 'Checklist updated' });
    } catch (error) {
      console.error('Failed to update checklist:', error);
      toast({ variant: 'destructive', title: 'Failed to update checklist' });
      // Revert on error
      setEditableFields(prev => ({ ...prev, checklist: editableFields.checklist }));
    }
  };

  const calculateTotalFromItems = () => {
    return editableFields.items.reduce((total, item) => {
      return total + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0));
    }, 0);
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedNickname = match[1];
      const mentionedUser = allUsers.find(u => 
        (u.nickname || u.full_name).toLowerCase() === mentionedNickname.toLowerCase()
      );
      if (mentionedUser) {
        mentions.push(mentionedUser.email);
      }
    }
    
    return mentions;
  };

  const handleCommentChange = (value, isEditing = false) => {
    if (isEditing) {
      setEditingCommentContent(value);
    } else {
      setNewComment(value);
    }

    // Check for @ mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionPosition(lastAtIndex);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const selectMention = (selectedUser, isEditing = false) => {
    const currentContent = isEditing ? editingCommentContent : newComment;
    const beforeMention = currentContent.substring(0, mentionPosition);
    const afterMention = currentContent.substring(mentionPosition + mentionSearch.length + 1);
    const newContent = `${beforeMention}@${selectedUser.nickname || selectedUser.full_name} ${afterMention}`;
    
    if (isEditing) {
      setEditingCommentContent(newContent);
    } else {
      setNewComment(newContent);
    }
    setShowMentionDropdown(false);
  };

  const filteredUsersForMention = allUsers.filter(u => {
    const name = (u.nickname || u.full_name).toLowerCase();
    return name.includes(mentionSearch);
  });
  
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const mentions = extractMentions(newComment);
      
      await JobComment.create({
        job_id: job.id,
        content: newComment,
        user_email: user.email,
        mentions: mentions
      });

      // Create notifications for mentioned users
      for (const mentionedEmail of mentions) {
        if (mentionedEmail !== user.email) {
          await Notification.create({
            recipient_email: mentionedEmail,
            message: `${user.nickname || user.full_name} mentioned you in task "${job.title}"`,
            link_to: window.location.href
          });
        }
      }

      setNewComment('');
      loadData();
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast({ variant: 'destructive', title: 'Failed to post comment' });
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    try {
      const mentions = extractMentions(editingCommentContent);
      
      await JobComment.update(commentId, {
        content: editingCommentContent,
        mentions: mentions,
        edited_date: new Date().toISOString()
      });

      // Create notifications for newly mentioned users
      for (const mentionedEmail of mentions) {
        if (mentionedEmail !== user.email) {
          await Notification.create({
            recipient_email: mentionedEmail,
            message: `${user.nickname || user.full_name} mentioned you in task "${job.title}"`,
            link_to: window.location.href
          });
        }
      }

      setEditingCommentId(null);
      setEditingCommentContent('');
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update comment' });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await JobComment.delete(commentId);
        loadData();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to delete comment' });
      }
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      let deadlineDateTime = editableFields.deadline;
      if (editableFields.deadline_time) {
        deadlineDateTime = `${editableFields.deadline}T${editableFields.deadline_time}`;
      }

      const totalQuantity = editableFields.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
      const calculatedTotal = calculateTotalFromItems();
      
      const updateData = {
        status: selectedStatus,
        production_notes: productionNotes,
        assigned_to: assignedTo,
        title: editableFields.title,
        quantity: totalQuantity,
        deadline: deadlineDateTime,
        special_instructions: editableFields.special_instructions,
        estimated_price: calculatedTotal,
        actual_price: calculatedTotal,
        items: editableFields.items.filter(item => item.item_name.trim() !== ''),
        checklist: editableFields.checklist
      };
      
      await onUpdate(job?.id, updateData);
      
      toast({ title: 'Success', description: 'Task updated successfully.' });
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task.' });
    }
    setIsUpdating(false);
  };

  if (!job) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-card border-l border-border shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col z-40">
      <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {editableFields.title || `Task Details`}
            {job?.is_rush && (
              <Badge variant="destructive">RUSH ORDER</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">{`#${job?.id?.slice(-6)?.toUpperCase()}`}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5"/></Button>
      </header>

      <div className="flex-grow overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Row 1: Client Information */}
          <Card className="bg-secondary/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <UserIcon className="w-5 h-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground grid grid-cols-2 gap-4">
               <div><strong>Client:</strong> {job?.client_name}</div>
               <div><strong>Contact:</strong> {job?.client_contact || 'N/A'}</div>
            </CardContent>
          </Card>
          
          {/* Row 2: Task Information */}
          <Card className="bg-secondary/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Package className="w-5 h-5" />
                Task Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taskTitle">Task Title</Label>
                <Input id="taskTitle" value={editableFields.title} onChange={e => setEditableFields(prev => ({...prev, title: e.target.value}))} />
              </div>
              
              <div className="space-y-2">
                <Label>Items</Label>
                <div className="space-y-2">
                  {editableFields.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <Input placeholder="Item Name" value={item.item_name} onChange={e => handleItemChange(index, 'item_name', e.target.value)} className="col-span-6" />
                      <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="col-span-2" />
                      <Input type="number" placeholder="Price" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} className="col-span-3" />
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="col-span-1 text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadlineDate">Deadline Date</Label>
                   <Popover>
                      <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left font-normal"
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editableFields.deadline ? format(new Date(editableFields.deadline), 'PPP') : <span>Pick a date</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={editableFields.deadline ? new Date(editableFields.deadline) : null}
                              onSelect={(d) => d && setEditableFields(prev => ({ ...prev, deadline: format(d, 'yyyy-MM-dd') }))}
                              initialFocus
                          />
                      </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadlineTime">Deadline Time</Label>
                  <Input id="deadlineTime" type="time" value={editableFields.deadline_time} onChange={e => setEditableFields(prev => ({...prev, deadline_time: e.target.value}))} />
                </div>
              </div>
              <div className="pt-2 text-right">
                <p className="text-sm text-muted-foreground">Total Quantity: {editableFields.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}</p>
                <p className="text-lg font-semibold text-foreground">Total Estimated Price: ₱{calculateTotalFromItems().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Checklist Section */}
          <Card className="bg-secondary/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <CheckSquare className="w-5 h-5" />
                Task Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {editableFields.checklist.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No checklist items yet. Add one below!</p>
                ) : (
                  editableFields.checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-secondary/30 transition-colors">
                      <Checkbox 
                        checked={item.completed}
                        onCheckedChange={() => handleChecklistToggle(index)}
                        id={`checklist-${index}`}
                      />
                      <Label 
                        htmlFor={`checklist-${index}`}
                        className={`flex-1 cursor-pointer ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                      >
                        {item.task}
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeChecklistItem(index)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Add a checklist item..."
                    value={newChecklistItem}
                    onChange={e => setNewChecklistItem(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistItem();
                      }
                    }}
                  />
                  <Button onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Row 3: Status & Notes */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-secondary/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <Clock className="w-5 h-5" />
                  Status & Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Update Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign Operator</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {operators.map(op => (
                        <SelectItem key={op.email} value={op.email}>
                          {op.nickname || op.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <Info className="w-5 h-5" />
                  Instructions & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Special Instructions</Label>
                  <Textarea placeholder="Client instructions..." value={editableFields.special_instructions} onChange={e => setEditableFields(prev => ({...prev, special_instructions: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Production Notes</Label>
                  <Textarea placeholder="Internal notes for production..." value={productionNotes} onChange={e => setProductionNotes(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 4: Comments */}
          <Card className="bg-secondary/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <MessageSquare className="w-5 h-5" />
                Activity & Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Textarea 
                    placeholder="Add a comment... (Use @ to mention someone)" 
                    value={newComment}
                    onChange={e => handleCommentChange(e.target.value, false)}
                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
                    rows={2}
                  />
                  {showMentionDropdown && filteredUsersForMention.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto z-10 mb-1">
                      {filteredUsersForMention.map(u => (
                        <div 
                          key={u.id}
                          className="px-3 py-2 hover:bg-secondary cursor-pointer flex items-center gap-2"
                          onClick={() => selectMention(u, false)}
                        >
                          <UserIcon className="w-4 h-4" />
                          <span className="text-sm">{u.nickname || u.full_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={handlePostComment} className="mt-2">
                    <Send className="w-4 h-4 mr-2" /> Post Comment
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {comments.map(comment => {
                    const authorNickname = userMap.get(comment.user_email) || comment.user_email?.split('@')[0];
                    const isAuthor = comment.user_email === user.email;
                    const isEditing = editingCommentId === comment.id;
                    
                    return (
                      <div key={comment.id} className="bg-card p-3 rounded-lg border border-border">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-bold text-foreground text-sm">
                            {authorNickname}
                            <span className="text-xs text-muted-foreground font-normal ml-2">
                              {format(new Date(comment.created_date), 'PPp')}
                              {comment.edited_date && ' (edited)'}
                            </span>
                          </p>
                          {isAuthor && !isEditing && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditComment(comment)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteComment(comment.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="relative space-y-2">
                            <Textarea 
                              value={editingCommentContent}
                              onChange={e => handleCommentChange(e.target.value, true)}
                              rows={2}
                              className="text-sm"
                            />
                            {showMentionDropdown && filteredUsersForMention.length > 0 && (
                              <div className="absolute bottom-full left-0 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto z-10 mb-1">
                                {filteredUsersForMention.map(u => (
                                  <div 
                                    key={u.id}
                                    className="px-3 py-2 hover:bg-secondary cursor-pointer flex items-center gap-2"
                                    onClick={() => selectMention(u, true)}
                                  >
                                    <UserIcon className="w-4 h-4" />
                                    <span className="text-sm">{u.nickname || u.full_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                                <Save className="w-3 h-3 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">{comment.content}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="p-4 border-t border-border flex justify-between items-center flex-shrink-0">
        <Button variant="destructive" onClick={() => onDelete(job?.id)}>Delete Task</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </footer>
    </div>
  );
}