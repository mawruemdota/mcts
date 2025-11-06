import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Department } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ProfileSettingsModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    nickname: user?.nickname || user?.full_name?.split(' ')[0] || '',
    email: user?.email || '',
    phone: user?.phone || '',
    departments: user?.departments || [],
    position: user?.position || '',
    profile_picture_url: user?.profile_picture_url || ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await Department.list();
        setDepartments(depts);
      } catch (error) {
        console.error('Failed to load departments:', error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load departments." });
      }
    };
    loadDepartments();
  }, [toast]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        nickname: user.nickname || user.full_name?.split(' ')[0] || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || '',
        departments: user.departments || [],
        profile_picture_url: user.profile_picture_url || ''
      });
    }
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_picture_url: file_url }));
      toast({ title: "Upload successful", description: "Profile picture updated." });
    } catch (error) {
      console.error('File upload error:', error);
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload profile picture." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDepartmentToggle = (deptName) => {
    setFormData(prev => {
      const currentDepts = prev.departments || [];
      if (currentDepts.includes(deptName)) {
        return { ...prev, departments: currentDepts.filter(d => d !== deptName) };
      } else {
        return { ...prev, departments: [...currentDepts, deptName] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nickname) {
      toast({ variant: "destructive", title: "Nickname required", description: "Please enter a nickname." });
      return;
    }

    if (!formData.departments || formData.departments.length === 0) {
      toast({ variant: "destructive", title: "Department required", description: "Please select at least one department." });
      return;
    }

    try {
      const allUsers = await User.list();
      const isNicknameTaken = allUsers.some(u => 
        u.id !== user.id && 
        u.nickname?.toLowerCase() === formData.nickname.toLowerCase()
      );

      if (isNicknameTaken) {
        toast({ variant: "destructive", title: "Nickname Taken", description: "This nickname is already in use. Please choose another one." });
        return;
      }

      await base44.auth.updateMe({
        full_name: formData.full_name,
        nickname: formData.nickname,
        phone: formData.phone,
        departments: formData.departments,
        position: formData.position,
        profile_picture_url: formData.profile_picture_url,
      });
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: "destructive", title: "Save failed", description: "Could not update your profile." });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="dialog-content max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Profile Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.profile_picture_url} alt={formData.full_name} />
                <AvatarFallback>{formData.nickname?.charAt(0) || formData.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <label htmlFor="pfp-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90">
                <Camera className="w-4 h-4" />
              </label>
              <input id="pfp-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname *</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="How others will see you"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Departments</Label>
            <div className="grid grid-cols-2 gap-3 p-4 border border-border rounded-lg bg-secondary/20 max-h-48 overflow-y-auto">
              {departments.length > 0 ? (
                departments.map(dept => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dept-${dept.id}`}
                      checked={(formData.departments || []).includes(dept.name)}
                      onCheckedChange={() => handleDepartmentToggle(dept.name)}
                    />
                    <Label htmlFor={`dept-${dept.id}`} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dept.color || '#3b82f6' }}
                      />
                      {dept.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-2">No departments available. Contact an admin to create departments.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., Manager, Operator"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}