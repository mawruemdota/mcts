
import React, { useState, useEffect, useCallback } from "react";
import { User, Team, Department } from "@/entities/all"; // Added Department entity
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import { Users, Mail, Phone, Briefcase, Plus, Edit, Trash2, User as UserIcon, Loader2, UserCheck, UserX, MoreVertical, Building2 } from "lucide-react"; // Added MoreVertical, Building2
import { useToast } from "@/components/ui/use-toast";
import { UploadFile } from "@/integrations/Core";
import {
    Table, TableHeader, TableRow, TableBody, TableCell
} from "@/components/ui/table"; // Added Table imports
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added DropdownMenu imports


export default function TeamPage() {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [departments, setDepartments] = useState([]); // New state for departments
    const [isLoading, setIsLoading] = useState(true);
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [showDepartmentForm, setShowDepartmentForm] = useState(false); // New state for department form visibility
    const [editingUser, setEditingUser] = useState(null);
    const [editingDepartment, setEditingDepartment] = useState(null); // New state for editing department
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [teamSearchQuery, setTeamSearchQuery] = useState('');
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [userData, teamData, departmentData] = await Promise.all([ // Added departmentData
                User.list(),
                Team.list(),
                Department.list() // Fetch department data
            ]);
            setUsers(userData);
            setTeams(teamData);
            setDepartments(departmentData); // Set department state
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load data." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDeleteUser = async (userId, userName) => {
        try {
            await User.delete(userId);
            toast({ title: "Success", description: `${userName || 'User'} deleted successfully.` });
            loadData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete user." });
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus, userName) => {
        try {
            const newStatus = !currentStatus;
            await User.update(userId, { is_active: newStatus });
            toast({
                title: "Success",
                description: `${userName || 'User'} ${newStatus ? 'activated' : 'deactivated'} successfully.`
            });
            loadData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update user status." });
        }
    };

    const handleDeleteTeam = async (teamId, teamName) => {
        try {
            const usersInTeam = users.filter(u => u.team_name === teamName);
            if (usersInTeam.length > 0) {
                toast({ variant: "destructive", title: "Error", description: `Cannot delete team "${teamName}". Please reassign or remove all ${usersInTeam.length} members first.` });
                return;
            }

            await Team.delete(teamId);
            toast({ title: "Success", description: `Team "${teamName}" deleted successfully.` });
            loadData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete team." });
        }
    };

    // New function for deleting a department
    const handleDeleteDepartment = async (deptId, deptName) => {
        const usersInDept = users.filter(u => u.departments?.includes(deptName)); // Check for users assigned to this department
        if (usersInDept.length > 0) {
            toast({ variant: "destructive", title: "Cannot Delete", description: `${usersInDept.length} users are assigned to this department. Please reassign them first.` });
            return;
        }

        if (window.confirm(`Are you sure you want to delete the department "${deptName}"?`)) { // Confirmation before deleting
            try {
                await Department.delete(deptId);
                toast({ title: "Success", description: "Department deleted successfully." });
                loadData();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to delete department." });
            }
        }
    };

    const TeamForm = ({ onSubmitted }) => {
        const [teamData, setTeamData] = useState({
            team_name: '',
            description: '',
            team_lead: ''
        });
        const { toast } = useToast();

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                await Team.create(teamData);
                toast({ title: "Success", description: "Team created successfully." });
                onSubmitted();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to create team." });
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
                <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                        id="teamName"
                        value={teamData.team_name}
                        onChange={e => setTeamData({...teamData, team_name: e.target.value})}
                        placeholder="e.g., Production Team"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        value={teamData.description}
                        onChange={e => setTeamData({...teamData, description: e.target.value})}
                        placeholder="Brief description of the team"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="teamLead">Team Lead</Label>
                    <Select value={teamData.team_lead} onValueChange={v => setTeamData({...teamData, team_lead: v})}>
                        <SelectTrigger id="teamLead"><SelectValue placeholder="Select team lead" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>No Lead</SelectItem>
                            {users.map(user => (
                                <SelectItem key={user.email} value={user.email}>
                                    {user.nickname || user.full_name} ({user.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end">
                    <Button type="submit">Create Team</Button>
                </div>
            </form>
        );
    };

    // DepartmentForm component updated from outline
    const DepartmentForm = ({ department, onSubmitted }) => {
        const [departmentData, setDepartmentData] = useState({
            name: department?.name || '',
            description: department?.description || '',
            color: department?.color || '#3b82f6'
        });
        const { toast } = useToast();

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                if (department) {
                    await Department.update(department.id, departmentData);
                    toast({ title: "Success", description: "Department updated successfully." });
                } else {
                    await Department.create(departmentData);
                    toast({ title: "Success", description: "Department created successfully." });
                }
                onSubmitted();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to save department." });
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
                <div className="space-y-2">
                    <Label htmlFor="deptName">Department Name *</Label>
                    <Input
                        id="deptName"
                        value={departmentData.name}
                        onChange={e => setDepartmentData({...departmentData, name: e.target.value})}
                        placeholder="e.g., Operations"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deptDescription">Description</Label>
                    <Textarea
                        id="deptDescription"
                        value={departmentData.description}
                        onChange={e => setDepartmentData({...departmentData, description: e.target.value})}
                        placeholder="Brief description"
                        rows={3}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deptColor">Color</Label>
                    <Input
                        id="deptColor"
                        type="color"
                        value={departmentData.color}
                        onChange={e => setDepartmentData({...departmentData, color: e.target.value})}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSubmitted}>Cancel</Button>
                    <Button type="submit">{department ? 'Update' : 'Create'} Department</Button>
                </div>
            </form>
        );
    };

    const EditUserForm = ({ user, allUsers, onSubmitted, loadData }) => {
        const [userData, setUserData] = useState({
            full_name: user?.full_name || '',
            nickname: user?.nickname || '',
            team_name: user?.team_name || '',
            departments: user?.departments || [], // Changed from 'department' to 'departments' array
            position: user?.position || '',
            profile_picture_url: user?.profile_picture_url || '',
            is_active: user?.is_active !== false, // Default to true if undefined or null
            is_authorized_access: user?.is_authorized_access !== false // Add authorization field
        });
        const [isUploading, setIsUploading] = useState(false);
        const { toast } = useToast();

        const handleFileChange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                setIsUploading(true);
                try {
                    const { file_url } = await UploadFile({ file });
                    setUserData(prev => ({...prev, profile_picture_url: file_url}));
                    toast({ title: "Success", description: "Profile picture uploaded." });
                } catch (error) {
                    toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload profile picture." });
                } finally {
                    setIsUploading(false);
                }
            }
        };

        // New function to toggle department selection
        const toggleDepartment = (deptName) => {
            setUserData(prev => {
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

            if (!userData.nickname) {
                toast({ variant: "destructive", title: "Nickname required", description: "Please enter a nickname." });
                return;
            }

            // New validation for departments
            if (!userData.departments || userData.departments.length === 0) {
                toast({ variant: "destructive", title: "Department required", description: "Please select at least one department." });
                return;
            }

            const isNicknameTaken = allUsers.some(u =>
                u.id !== user.id &&
                u.nickname?.toLowerCase() === userData.nickname.toLowerCase()
            );

            if (isNicknameTaken) {
                toast({ variant: "destructive", title: "Nickname Taken", description: "This nickname is already in use. Please choose another one." });
                return;
            }

            try {
                // Use User.update for admin updating other users
                await User.update(user.id, userData);
                toast({ title: "Success", description: "User updated successfully." });
                // Refresh the users list to show updated data
                await loadData();
                onSubmitted();
            } catch (error) {
                console.error('Update error:', error);
                toast({ variant: "destructive", title: "Error", description: "Failed to update user." });
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
                <div className="space-y-2">
                    <Label htmlFor="profilePicture">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                        {userData.profile_picture_url ? (
                            <img src={userData.profile_picture_url} alt="Profile" className="w-16 h-16 rounded-full object-cover"/>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-muted-foreground"/>
                            </div>
                        )}
                        <Input
                            id="profilePicture"
                            type="file"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="flex-1"
                            accept="image/*"
                        />
                        {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            value={userData.full_name}
                            onChange={e => setUserData({...userData, full_name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nickname">Nickname</Label>
                        <Input
                            id="nickname"
                            value={userData.nickname}
                            onChange={e => setUserData({...userData, nickname: e.target.value})}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="teamAssignment">Team Assignment</Label>
                    <Select value={userData.team_name || ""} onValueChange={v => setUserData({...userData, team_name: v || null})}>
                        <SelectTrigger id="teamAssignment"><SelectValue placeholder="Select team" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>No Team</SelectItem>
                            {teams.map(team => (
                                <SelectItem key={team.id} value={team.team_name}>
                                    {team.team_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {/* Department selection with checkboxes */}
                <div className="space-y-2">
                    <Label>Departments (Select one or more)</Label>
                    <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-md">
                        {departments.length > 0 ? departments.map(dept => (
                            <div key={dept.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`dept-${dept.id}`}
                                    checked={userData.departments?.includes(dept.name)}
                                    onCheckedChange={() => toggleDepartment(dept.name)}
                                />
                                <Label htmlFor={`dept-${dept.id}`} className="cursor-pointer flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                                    {dept.name}
                                </Label>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground col-span-2">No departments available. Please create one first.</p>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                        id="position"
                        value={userData.position}
                        onChange={e => setUserData({...userData, position: e.target.value})}
                        placeholder="Job title"
                    />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-1">
                        <Label htmlFor="activeStatus" className="font-medium">Account Status</Label>
                        <p className="text-sm text-muted-foreground">
                            {userData.is_active ? 'User can access the application' : 'User is blocked from accessing the application'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="activeStatus"
                            checked={userData.is_active}
                            onCheckedChange={v => setUserData({...userData, is_active: v})}
                        />
                        <Label htmlFor="activeStatus" className="text-sm">
                            {userData.is_active ? 'Active' : 'Inactive'}
                        </Label>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-lg">
                    <div className="space-y-1">
                        <Label htmlFor="authorizedAccess" className="font-medium text-amber-900">Access Authorization</Label>
                        <p className="text-sm text-amber-700">
                            {userData.is_authorized_access ? 'User is authorized to access the application' : 'User requires admin approval to access the application'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="authorizedAccess"
                            checked={userData.is_authorized_access}
                            onCheckedChange={v => setUserData({...userData, is_authorized_access: v})}
                        />
                        <Label htmlFor="authorizedAccess" className="text-sm text-amber-900">
                            {userData.is_authorized_access ? 'Authorized' : 'Pending'}
                        </Label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={onSubmitted}>Cancel</Button>
                    <Button type="submit" disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        );
    };

    return (
        <div className="p-4 md:p-8 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Team Management</h1>
                        <p className="text-muted-foreground mt-1">Manage teams, departments, and assign members.</p> {/* Updated description */}
                    </div>
                </div>

                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="tabs-list bg-secondary">
                        <TabsTrigger value="members" className="tabs-trigger data-[state=active]:bg-background">
                            <Users className="w-4 h-4 mr-2" />
                            Team Members
                        </TabsTrigger>
                        <TabsTrigger value="teams" className="tabs-trigger data-[state=active]:bg-background">
                            <Users className="w-4 h-4 mr-2" />
                            Teams
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="tabs-trigger data-[state=active]:bg-background">
                            <Building2 className="w-4 h-4 mr-2" />
                            Departments
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="space-y-6">
                        <Input
                            placeholder="Search team members by name, email, team, or role..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="max-w-md"
                        />
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Members ({users.filter(user =>
                                    (user.nickname?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                     user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                     user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                     user.position?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                     // Updated search to include departments array
                                     user.departments?.some(d => d.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                                     user.team_name?.toLowerCase().includes(userSearchQuery.toLowerCase()))
                                ).length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-48">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableCell className="w-[200px] min-w-[150px]">Member</TableCell>
                                                    <TableCell className="min-w-[100px]">Position</TableCell>
                                                    <TableCell className="min-w-[100px]">Departments</TableCell> {/* Updated header */}
                                                    <TableCell className="min-w-[100px]">Team</TableCell>
                                                    <TableCell className="min-w-[100px]">Phone</TableCell>
                                                    <TableCell className="text-right min-w-[150px]">Actions</TableCell>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {users.filter(user =>
                                                    (user.nickname?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                     user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                     user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                     user.position?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                     // Updated search to include departments array
                                                     user.departments?.some(d => d.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                                                     user.team_name?.toLowerCase().includes(userSearchQuery.toLowerCase()))
                                                ).map(user => (
                                                    <TableRow key={user.id} className={user.is_active === false ? 'bg-muted/50' : ''}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                                                                        {user.profile_picture_url ? (
                                                                            <img src={user.profile_picture_url} alt={user.nickname || user.full_name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                                                                        )}
                                                                    </div>
                                                                    <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${user.is_active !== false ? 'bg-green-500' : 'bg-gray-400'} ring-2 ring-background`}/>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-foreground whitespace-nowrap">{user.nickname || user.full_name}</div>
                                                                    <div className="text-sm text-muted-foreground whitespace-nowrap">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">{user.position}</TableCell>
                                                        {/* Display departments as colored badges */}
                                                        <TableCell className="whitespace-nowrap">
                                                            <div className="flex flex-wrap gap-1">
                                                                {user.departments && user.departments.length > 0 ? (
                                                                    user.departments.map((deptName, idx) => {
                                                                        const dept = departments.find(d => d.name === deptName);
                                                                        return (
                                                                            <Badge key={idx} variant="secondary" className="text-xs" style={{ backgroundColor: dept?.color + '20', color: dept?.color || 'inherit' }}>
                                                                                {deptName}
                                                                            </Badge>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">None</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">{user.team_name}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{user.phone}</TableCell>
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleToggleUserStatus(user.id, user.is_active, user.nickname || user.full_name)}
                                                                    title={user.is_active !== false ? "Deactivate user" : "Activate user"}
                                                                >
                                                                    {user.is_active !== false ? (
                                                                        <UserCheck className="w-4 h-4 text-green-600" />
                                                                    ) : (
                                                                        <UserX className="w-4 h-4 text-red-500" />
                                                                    )}
                                                                </Button>
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                                                                            <Edit className="w-4 h-4" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="dialog-content max-w-2xl">
                                                                        <DialogHeader>
                                                                            <DialogTitle className="text-card-foreground">Edit Team Member</DialogTitle>
                                                                        </DialogHeader>
                                                                        {editingUser && <EditUserForm user={editingUser} allUsers={users} onSubmitted={() => { setEditingUser(null); }} loadData={loadData} />}
                                                                    </DialogContent>
                                                                </Dialog>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This action cannot be undone. This will permanently delete the user <span className="font-semibold">{user.nickname || user.full_name}</span> from the system.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.nickname || user.full_name)}>Delete</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
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
                    </TabsContent>

                    <TabsContent value="teams" className="space-y-6">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <h2 className="text-xl font-semibold text-foreground">Teams</h2>
                            <Dialog open={showTeamForm} onOpenChange={setShowTeamForm}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="w-4 h-4 mr-2" />Create Team</Button>
                                </DialogTrigger>
                                <DialogContent className="dialog-content">
                                    <DialogHeader>
                                        <DialogTitle className="text-card-foreground">Create New Team</DialogTitle>
                                    </DialogHeader>
                                    <TeamForm onSubmitted={() => { setShowTeamForm(false); loadData(); }} />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Input
                            placeholder="Search teams by name or description..."
                            value={teamSearchQuery}
                            onChange={(e) => setTeamSearchQuery(e.target.value)}
                            className="max-w-md"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.filter(team =>
                                (team.team_name?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                                 team.description?.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                            ).map(team => {
                                const teamMembers = users.filter(u => u.team_name === team.team_name);
                                const teamLead = users.find(u => u.email === team.team_lead);

                                return (
                                    <Card key={team.id} className="bg-card border-border">
                                        <CardHeader className="flex flex-row justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg text-foreground">{team.team_name}</CardTitle>
                                                {team.description && (
                                                    <p className="text-sm text-muted-foreground">{team.description}</p>
                                                )}
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the team <span className="font-semibold">{team.team_name}</span>.
                                                            {teamMembers.length > 0 && (
                                                                <p className="mt-2 font-medium text-red-600">
                                                                    Warning: This team currently has {teamMembers.length} member(s).
                                                                    Please reassign or remove all members before deleting the team.
                                                                </p>
                                                            )}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTeam(team.id, team.team_name)}
                                                            disabled={teamMembers.length > 0}
                                                        >Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {teamLead && (
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Team Lead</Label>
                                                    <p className="text-sm font-medium text-foreground">{teamLead.nickname || teamLead.full_name}</p>
                                                </div>
                                            )}
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Members ({teamMembers.length})</Label>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {teamMembers.slice(0, 5).map(member => (
                                                        <Badge key={member.id} variant="secondary" className="text-xs">
                                                            {member.nickname || member.full_name}
                                                        </Badge>
                                                    ))}
                                                    {teamMembers.length > 5 && (
                                                        <Badge variant="outline" className="text-xs">+{teamMembers.length - 5} more</Badge>
                                                    )}
                                                    {teamMembers.length === 0 && (
                                                        <span className="text-sm text-muted-foreground">No members yet.</span>
                                                    )}
                                                </div>
                                            </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* New Departments TabContent */}
                    <TabsContent value="departments" className="space-y-6">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Departments</h2>
                                <p className="text-muted-foreground mt-1">Manage organizational departments</p>
                            </div>
                            <Dialog open={showDepartmentForm} onOpenChange={setShowDepartmentForm}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setEditingDepartment(null)}><Plus className="w-4 h-4 mr-2" />Add Department</Button>
                                </DialogTrigger>
                                <DialogContent className="dialog-content">
                                    <DialogHeader>
                                        <DialogTitle className="text-card-foreground">
                                            {editingDepartment ? 'Edit' : 'New'} Department
                                        </DialogTitle>
                                    </DialogHeader>
                                    <DepartmentForm
                                        department={editingDepartment}
                                        onSubmitted={() => {
                                            setShowDepartmentForm(false);
                                            setEditingDepartment(null);
                                            loadData();
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {departments.map(dept => {
                                const deptUsers = users.filter(u => u.departments?.includes(dept.name));
                                return (
                                    <Card key={dept.id} className="bg-card border-border">
                                        <CardHeader className="pb-3 flex flex-row items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: dept.color }}></div>
                                                <div>
                                                    <CardTitle className="text-lg text-foreground">{dept.name}</CardTitle>
                                                    {dept.description && (
                                                        <p className="text-sm text-muted-foreground">{dept.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingDepartment(dept);
                                                            setShowDepartmentForm(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                                        className="text-red-600 focus:bg-red-50 focus:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent>
                                            <Label className="text-xs text-muted-foreground">Members ({deptUsers.length})</Label>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {deptUsers.slice(0, 5).map(member => (
                                                    <Badge key={member.id} variant="secondary" className="text-xs">
                                                        {member.nickname || member.full_name}
                                                    </Badge>
                                                ))}
                                                {deptUsers.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">+{deptUsers.length - 5} more</Badge>
                                                )}
                                                {deptUsers.length === 0 && (
                                                    <span className="text-sm text-muted-foreground">No members yet.</span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
