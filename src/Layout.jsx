
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  User as UserIcon,
  FileText,
  Wallet,
  BookUser,
  DollarSign,
  ListChecks,
  Archive,
  Calculator,
  Wrench,
  Plus,
  Palette,
  UserX,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import ProfileSettingsModal from "@/components/auth/ProfileSettingsModal";
import FloatingCalculator from "@/components/ui/FloatingCalculator";
import QueueStatsHeader from "@/components/dashboard/QueueStatsHeader";
import QuickReminderModal from "@/components/reminders/QuickReminderModal";
import NewTaskModal from "@/components/jobs/NewTaskModal";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showQuickReminder, setShowQuickReminder] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [isInactiveUser, setIsInactiveUser] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : true; // Initialize to true (collapsed) if no value is saved
  });

  const isPublicPage = location.pathname === createPageUrl("Home") ||
                       location.pathname === '/' ||
                       location.pathname.startsWith(createPageUrl("ClientQuote")) || 
                       location.pathname.startsWith(createPageUrl("PublicContentView")) ||
                       location.pathname.startsWith(createPageUrl("ARView")) ||
                       location.pathname.startsWith(createPageUrl("ReimbursementPrintView")) ||
                       location.pathname.startsWith(createPageUrl("ClientOrderForm"));

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.add(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      
      if (currentUser.is_active === false) {
        setIsInactiveUser(true);
        setUser(null);
      } else {
        setUser(currentUser);
        setIsInactiveUser(false);
      }
    } catch (error) {
      console.log("User not authenticated or error fetching user:", error);
      setUser(null);
      setIsInactiveUser(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
     if (!isPublicPage) {
        loadUser();
    } else {
        setIsLoading(false);
    }
  }, [isPublicPage, loadUser]);

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const handleTaskCreated = () => {
    window.location.reload();
  };

  if (isPublicPage) {
    return <>{children}</>;
  }

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard,
        roles: ["admin", "user"]
      },
       {
        title: "Creatives",
        url: createPageUrl("Creatives"),
        icon: Palette,
        roles: ["admin", "user"]
      },
      {
        title: "Forms",
        url: createPageUrl("Forms"),
        icon: FileText,
        roles: ["admin", "user"]
      },
      {
        title: "Contacts",
        url: createPageUrl("Contacts"),
        icon: BookUser,
        roles: ["admin", "user"]
      },
      {
        title: "Inventory",
        url: createPageUrl("Inventory"),
        icon: Package,
        roles: ["admin", "user"]
      },
      {
        title: "Products",
        url: createPageUrl("ItemsAndServices"),
        icon: DollarSign,
        roles: ["admin", "user"]
      },
      {
        title: "Shop Cash",
        url: createPageUrl("ShopCash"),
        icon: Wallet,
        roles: ["admin"]
      },
      {
        title: "Reminders",
        url: createPageUrl("Reminders"),
        icon: ListChecks,
        roles: ["admin", "user"]
      },
      {
        title: "Reports",
        url: createPageUrl("Reports"),
        icon: BarChart3,
        roles: ["admin", "user"]
      },
      {
        title: "Archive",
        url: createPageUrl("Dump"),
        icon: Archive,
        roles: ["admin"]
      }
    ];

    if (user?.role === "admin") {
      if (!baseItems.some(item => item.title === "Team")) {
        baseItems.push(
          {
            title: "Team",
            url: createPageUrl("Team"),
            icon: Users,
            roles: ["admin"]
          }
        );
      }
    }

    if (user?.role !== 'admin') {
      const adminOnlyPages = ["Shop Cash", "Team", "Archive"];
      return baseItems.filter(item => !adminOnlyPages.includes(item.title));
    }

    return baseItems.filter(item => item.roles.includes(user?.role));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    if (isInactiveUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserX className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Account Inactive</h1>
              <p className="text-gray-600 mt-2">Your account has been deactivated. Please contact your administrator for assistance.</p>
            </div>
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MCTS</h1>
            <p className="text-gray-600 mt-2">Internal Management System</p>
          </div>
          <Button
            onClick={() => User.login()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        :root.dark {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 217.2 91.2% 59.8%;
          --primary-foreground: 210 40% 98%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 217.2 91.2% 59.8%;
        }
        :root.light {
          --background: 0 0% 100%;
          --foreground: 222.2 47.4% 11.2%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 47.4% 11.2%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 47.4% 11.2%;
          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --ring: 222.2 47.4% 11.2%;
        }
        .bg-background { background-color: hsl(var(--background)); }
        .text-foreground { color: hsl(var(--foreground)); }
        .bg-card { background-color: hsl(var(--card)); }
        .text-card-foreground { color: hsl(var(--card-foreground)); }
        .bg-popover { background-color: hsl(var(--popover)); }
        .text-popover-foreground { color: hsl(var(--popover-foreground)); }
        .border-border { border-color: hsl(var(--border)); }
        .bg-primary { background-color: hsl(var(--primary)); }
        .text-primary-foreground { color: hsl(var(--primary-foreground)); }
        .bg-secondary { background-color: hsl(var(--secondary)); }
        .text-secondary-foreground { color: hsl(var(--secondary-foreground)); }
        .text-muted-foreground { color: hsl(var(--muted-foreground)); }
        .dialog-content { background-color: hsl(var(--card)) !important; }
        
        .tabs-list {
          background-color: hsl(var(--muted)) !important;
          border-radius: 0.5rem;
          padding: 0.25rem;
        }
        .tabs-trigger {
          border-radius: 0.375rem;
          padding: 0.5rem 1rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground)) !important;
          transition: all 0.2s ease-in-out;
        }
        .tabs-trigger[data-state="active"] {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .tabs-trigger:hover:not([data-state="active"]) {
          background-color: hsl(var(--secondary)) !important;
          color: hsl(var(--foreground)) !important;
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--muted-foreground));
        }

        /* Smooth transitions for sidebar */
        .sidebar-transition {
          transition: all 0.3s ease-in-out;
        }
      `}</style>
      
      <TooltipProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Sidebar className={cn(
              "fixed left-0 top-0 bottom-0 border-r border-border bg-card sidebar-transition z-50",
              isSidebarCollapsed ? "w-16" : "w-64"
            )}>
              <SidebarHeader className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className={cn("flex items-center gap-3 overflow-hidden transition-all", isSidebarCollapsed && "opacity-0 w-0")}>
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
                      alt="MCTS Logo"
                      className="w-10 h-10 object-contain flex-shrink-0"
                    />
                    <div>
                      <h2 className="font-bold text-foreground text-lg">MCTS</h2>
                      <p className="text-xs text-muted-foreground">Management System</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="flex-shrink-0"
                  >
                    {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </Button>
                </div>
              </SidebarHeader>

              <SidebarContent className="p-3">
                <SidebarGroup>
                  {!isSidebarCollapsed && (
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                      Main Menu
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {getNavigationItems().map((item) => (
                        <SidebarMenuItem key={item.title}>
                          {isSidebarCollapsed ? (
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton
                                  asChild
                                  className={cn(
                                    "hover:bg-secondary/80 text-foreground/70 hover:text-foreground transition-all duration-200 rounded-lg justify-center px-2",
                                    location.pathname === item.url && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                  )}
                                >
                                  <Link to={item.url} className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                  </Link>
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>{item.title}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <SidebarMenuButton
                              asChild
                              className={cn(
                                "hover:bg-secondary/80 text-foreground/70 hover:text-foreground transition-all duration-200 rounded-lg px-4 py-3",
                                location.pathname === item.url && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                              )}
                            >
                              <Link to={item.url} className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-6">
                  {!isSidebarCollapsed && (
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                      Quick Access
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <div className={cn("px-3 py-2 space-y-2", isSidebarCollapsed && "px-0")}>
                      {isSidebarCollapsed ? (
                        <>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="w-full px-2 justify-center text-sm h-9"
                                onClick={() => setShowNewTaskModal(true)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>New Task</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="w-full px-2 justify-center text-sm h-9"
                                onClick={() => setShowQuickReminder(true)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>New Reminder</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="w-full px-2 justify-center text-sm h-9"
                                onClick={() => setShowCalculator(true)}
                              >
                                <Calculator className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>Calculator</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-sm h-9"
                            onClick={() => setShowNewTaskModal(true)}
                          >
                            <Plus className="w-4 h-4" />
                            <span className="ml-2">Task</span>
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-sm h-9"
                            onClick={() => setShowQuickReminder(true)}
                          >
                            <Plus className="w-4 h-4" />
                            <span className="ml-2">Reminder</span>
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-sm h-9"
                            onClick={() => setShowCalculator(true)}
                          >
                            <Calculator className="w-4 h-4" />
                            <span className="ml-2">Calculator</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              <SidebarFooter className="border-t border-border p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-3 cursor-pointer hover:bg-secondary p-2 rounded-lg transition-colors",
                      isSidebarCollapsed && "justify-center"
                    )}>
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user?.profile_picture_url ? (
                          <img src={user.profile_picture_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{user?.nickname || user?.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
                        </div>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    <DropdownMenuItem onClick={() => setShowProfileSettings(true)} className="flex items-center gap-2 text-foreground hover:!bg-secondary">
                      <UserIcon className="w-4 h-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Settings")} className="flex items-center gap-2 text-foreground hover:!bg-secondary cursor-pointer">
                          <Settings className="w-4 h-4" />
                          App Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-border"/>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-red-500 hover:!text-red-500 hover:!bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarFooter>
            </Sidebar>

            <main className={cn(
              "min-h-screen flex flex-col transition-all duration-300",
              isSidebarCollapsed ? "ml-16 w-[calc(100vw-64px)]" : "ml-64 w-[calc(100vw-256px)]"
            )}>
              <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="hover:bg-secondary p-2 rounded-lg transition-colors duration-200 md:hidden" />
                  <div className="flex items-center gap-6">
                     <p className="text-muted-foreground text-sm">
                       {format(new Date(), "EEEE, MMMM do")}
                     </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                    <QueueStatsHeader />
                    <NotificationsPanel user={user}/>
                </div>
              </header>

              <div className="flex-1 overflow-auto bg-background p-6">
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </TooltipProvider>
      {showProfileSettings && <ProfileSettingsModal user={user} onClose={() => { setShowProfileSettings(false); loadUser(); }} />}
      {showCalculator && <FloatingCalculator onClose={() => setShowCalculator(false)} />}
      {showQuickReminder && <QuickReminderModal isOpen={showQuickReminder} onClose={() => setShowQuickReminder(false)} user={user} />}
      {showNewTaskModal && <NewTaskModal isOpen={showNewTaskModal} onClose={() => setShowNewTaskModal(false)} onTaskCreated={handleTaskCreated} user={user} />}
    </>
  );
}
