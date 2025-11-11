
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import OptimizedImage from "@/components/ui/OptimizedImage";
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
  Home,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isPublicPage = location.pathname === createPageUrl("Home") ||
                       location.pathname === '/' ||
                       location.pathname === '/Home' ||
                       location.pathname === createPageUrl("NotFound") ||
                       location.pathname.startsWith(createPageUrl("ClientQuote")) || 
                       location.pathname.startsWith(createPageUrl("PublicContentView")) ||
                       location.pathname.startsWith(createPageUrl("ARView")) ||
                       location.pathname.startsWith(createPageUrl("ReimbursementPrintView")) ||
                       location.pathname.startsWith(createPageUrl("ClientOrderForm")) ||
                       location.pathname.startsWith(createPageUrl("OrderTracking"));

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

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      
      if (currentUser.is_active === false) {
        setIsInactiveUser(true);
        setUser(null);
      } else if (currentUser.is_authorized_access === false) {
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
      
      // Redirect to homepage if user is not authenticated and trying to access dashboard
      if (!isPublicPage) {
        window.location.href = createPageUrl("Home");
      }
    }
    setIsLoading(false);
  }, [isPublicPage]);

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
          },
          {
            title: "Homepage",
            url: createPageUrl("HomepageSettings"),
            icon: Home,
            roles: ["admin"]
          }
        );
      }
    }

    if (user?.role !== 'admin') {
      const adminOnlyPages = ["Shop Cash", "Team", "Archive", "Homepage"];
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
        <div className="min-h-screen flex items-center justify-center relative">
          <OptimizedImage
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/b878ac35a_bg.png"
            alt="Background"
            className="absolute inset-0 w-full h-full"
            objectFit="cover"
          />
          <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm"></div>
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 relative z-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserX className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Access Pending Authorization</h1>
              <p className="text-gray-600 mt-2">Your account requires administrator approval before you can access this application. Please contact your administrator for assistance.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Sign Out
              </Button>
              <a href={createPageUrl('Home')} className="w-full">
                <Button variant="outline" className="w-full">
                  Go to Homepage
                </Button>
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Redirect to homepage instead of showing login screen
    window.location.href = createPageUrl("Home");
    return null;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Bai+Jamjuree:wght@400;500;600;700&display=swap');
        
        .font-oswald {
          font-family: 'Oswald', sans-serif;
          font-weight: 700;
        }
        
        .font-bai-jamjuree {
          font-family: 'Bai Jamjuree', sans-serif;
        }
        
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
      `}</style>
      
      <div className="min-h-screen bg-background text-foreground">
        {/* Floating Menu Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full shadow-lg bg-card hover:bg-secondary"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Floating Sidebar Menu */}
        <div
          className={cn(
            "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out overflow-y-auto",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <OptimizedImage
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
                alt="MCTS Logo"
                className="w-10 h-10 flex-shrink-0"
                objectFit="contain"
                priority={true}
              />
              <div>
                <h2 className="font-bold text-foreground text-lg">MCTS</h2>
                <p className="text-xs text-muted-foreground">Management System</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Main Menu</h3>
              {getNavigationItems().map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    location.pathname === item.url
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ))}
            </div>

            {/* Quick Access */}
            <div className="space-y-2 mb-8">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Access</h3>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm h-9"
                onClick={() => {
                  setShowNewTaskModal(true);
                  setIsSidebarOpen(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Task
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm h-9"
                onClick={() => {
                  setShowQuickReminder(true);
                  setIsSidebarOpen(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Reminder
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm h-9"
                onClick={() => {
                  setShowCalculator(true);
                  setIsSidebarOpen(false);
                }}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculator
              </Button>
            </div>

            {/* User Profile */}
            <div className="border-t border-border pt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-secondary p-2 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user?.profile_picture_url ? (
                        <OptimizedImage
                          src={user.profile_picture_url}
                          alt={user.full_name}
                          className="w-full h-full"
                          objectFit="cover"
                        />
                      ) : (
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{user?.nickname || user?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
                    </div>
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
            </div>
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="min-h-screen flex flex-col w-full">
          <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 ml-16">
              <p className="text-muted-foreground text-sm">
                {format(new Date(), "EEEE, MMMM do")}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <QueueStatsHeader />
              <NotificationsPanel user={user}/>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-background p-6">
            {children}
          </div>
        </div>
      </div>

      {showProfileSettings && <ProfileSettingsModal user={user} onClose={() => { setShowProfileSettings(false); loadUser(); }} />}
      {showCalculator && <FloatingCalculator onClose={() => setShowCalculator(false)} />}
      {showQuickReminder && <QuickReminderModal isOpen={showQuickReminder} onClose={() => setShowQuickReminder(false)} user={user} />}
      {showNewTaskModal && <NewTaskModal isOpen={showNewTaskModal} onClose={() => setShowNewTaskModal(false)} onTaskCreated={handleTaskCreated} user={user} />}
    </>
  );
}
