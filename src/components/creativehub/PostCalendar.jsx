import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2, Edit, Trash2, Download, Facebook, Instagram } from "lucide-react";
import { format } from "date-fns";

const emptyForm = {
  platform: "facebook",
  scheduled_date: "",
  caption: "",
  image_url: "",
  status: "draft"
};

export default function PostCalendar() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.SocialMediaPost.list("scheduled_date");
      setPosts(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load scheduled posts." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    }
    setUploading(false);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      platform: post.platform || "facebook",
      scheduled_date: post.scheduled_date || "",
      caption: post.caption || "",
      image_url: post.image_url || "",
      status: post.status || "draft"
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheduled_date) {
      toast({ variant: "destructive", title: "Scheduled date is required" });
      return;
    }
    try {
      if (editingPost) {
        await base44.entities.SocialMediaPost.update(editingPost.id, formData);
        toast({ title: "Post updated" });
      } else {
        await base44.entities.SocialMediaPost.create(formData);
        toast({ title: "Post scheduled" });
      }
      setShowDialog(false);
      setEditingPost(null);
      setFormData(emptyForm);
      loadPosts();
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to save post" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scheduled post?")) return;
    try {
      await base44.entities.SocialMediaPost.delete(id);
      toast({ title: "Post deleted" });
      loadPosts();
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete post" });
    }
  };

  const handleDownload = (post) => {
    if (!post.image_url) return;
    const a = document.createElement("a");
    a.href = post.image_url;
    a.download = `${post.platform}-post-${post.scheduled_date}.png`;
    a.target = "_blank";
    a.click();
  };

  const statusColor = (status) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "posted": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Post Schedule</CardTitle>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) { setEditingPost(null); setFormData(emptyForm); }
        }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Schedule Post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit" : "Schedule"} Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Scheduled Date *</Label>
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Caption</Label>
                <Textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  rows={4}
                  placeholder="Post caption..."
                />
              </div>

              <div>
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {formData.image_url && (
                  <img src={formData.image_url} alt="Post preview" className="mt-2 max-h-40 rounded-lg border" />
                )}
              </div>

              {editingPost && (
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={uploading}>{editingPost ? "Update" : "Schedule"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No posts scheduled yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="flex items-center gap-4 p-3 border rounded-lg">
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {post.platform === "facebook" ? <Facebook className="w-4 h-4 text-blue-600" /> : <Instagram className="w-4 h-4 text-pink-600" />}
                    <span className="font-medium">{format(new Date(post.scheduled_date), "MMM dd, yyyy")}</span>
                    <Badge className={statusColor(post.status)}>{post.status}</Badge>
                  </div>
                  {post.caption && <p className="text-sm text-muted-foreground truncate">{post.caption}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {post.image_url && (
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(post)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}