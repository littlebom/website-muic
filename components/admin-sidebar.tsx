"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  Building2,
  Newspaper,
  Image as ImageIcon,
  Settings,
  FileText,
  Layers,
  Tag,
  LogOut,
  UserCog,
  Shield,
  ShieldCheck,
  MessageSquare,
  BookMarked,
  Ticket,
  Briefcase,
  MenuSquare,
  BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminRole } from "@/lib/types";

// Define menu item type
interface MenuItem {
  title: string;
  href: string;
  icon: any;
  allowedRoles: AdminRole[]; // Roles that can see this menu
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'admin', 'institution_admin'],
  },
  {
    title: "Courses",
    href: "/admin/courses",
    icon: BookOpen,
    allowedRoles: ['super_admin', 'admin', 'institution_admin'],
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    title: "Course Types",
    href: "/admin/course-types",
    icon: Tag,
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    title: "Instructors",
    href: "/admin/instructors",
    icon: Users,
    allowedRoles: ['super_admin', 'admin', 'institution_admin'],
  },
  {
    title: "Institutions",
    href: "/admin/institutions",
    icon: Building2,
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    title: "News",
    href: "/admin/news",
    icon: Newspaper,
    allowedRoles: ['super_admin', 'admin', 'institution_admin'],
  },
  {
    title: "Guides",
    href: "/admin/guides",
    icon: BookMarked,
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    title: "Chat",
    href: "/admin/chat",
    icon: MessageSquare,
    allowedRoles: ['super_admin', 'admin'], // Global chat for support
  },
  {
    title: "Tickets",
    href: "/admin/tickets",
    icon: Ticket,
    allowedRoles: ['super_admin', 'admin'], // Global tickets
  },
  {
    title: "Banners",
    href: "/admin/banners",
    icon: Layers,
    allowedRoles: ['super_admin', 'admin', 'institution_admin'],
  },
  {
    title: "Popups",
    href: "/admin/popups",
    icon: MessageSquare,
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    title: "Files",
    href: "/admin/files",
    icon: ImageIcon,
    allowedRoles: ['super_admin', 'admin', 'institution_admin'],
  },
  {
    title: "Admin Users",
    href: "/admin/users",
    icon: UserCog,
    allowedRoles: ['super_admin'],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    allowedRoles: ['super_admin', 'admin', 'institution_admin'],
  },
  {
    title: "Structure",
    href: "/admin/structure",
    icon: FileText,
    allowedRoles: ['super_admin', 'admin'],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [institutionName, setInstitutionName] = useState<string>("");
  const [chatCount, setChatCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUserRole(data.user.role);
            setUserName(data.user.name);
            // If institution admin, could fetch institution name here if needed
            if (data.user.institutionId) {
              // For now just show "Institution Admin"
            }
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();
  }, []);

  // Fetch notification counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch("/api/analytics");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setChatCount(data.data.chat.unread || 0);
            setTicketCount(data.data.tickets.unread || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
    if (pathname.startsWith('/admin/chat') || pathname.startsWith('/admin/tickets')) {
      setTimeout(fetchCounts, 500);
    }
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/admin" className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-gray-900">Admin Panel</span>
        </Link>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // Check if user role is allowed
          if (userRole && !item.allowedRoles.includes(userRole)) {
            return null;
          }

          // Get badge count for specific menus
          let badgeCount = 0;
          if (item.title === "Chat") badgeCount = chatCount;
          if (item.title === "Tickets") badgeCount = ticketCount;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>

              {/* Notification Badge */}
              {badgeCount > 0 && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-red-500 text-white"
                  )}>
                    {badgeCount}
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-4 border-t border-gray-200 space-y-2">
        {userName && (
          <div className="px-3 py-2 bg-gray-50 rounded-md">
            <div className="text-sm font-medium text-gray-900">{userName}</div>
            <div className="flex items-center gap-1 mt-1">
              {userRole === 'super_admin' ? (
                <>
                  <ShieldCheck className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600 font-medium">Super Admin</span>
                </>
              ) : userRole === 'institution_admin' ? (
                <>
                  <Briefcase className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-emerald-600 font-medium">Microsite Admin</span>
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Admin</span>
                </>
              )}
            </div>
          </div>
        )}

        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm px-3 py-2"
        >
          ← Back to Website
        </Link>

        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span>{isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</span>
        </Button>
      </div>
    </aside>
  );
}
