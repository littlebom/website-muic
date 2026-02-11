"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FolderTree,
  Users,
  Building2,
  Newspaper,
  Layers,
  Plus,
  LifeBuoy,
  MessageSquare,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    courses: number;
    categories: number;
    instructors: number;
    institutions: number;
    news: number;
    banners: number;
    guides: number;
    activeGuides: number;
    tickets: number;
    conversations: number;
    popups: number;
    activePopups: number;
    adminUsers: number;
    courseTypes: number;
  };
  tickets: {
    total: number;
    byStatus: {
      new?: number;
      in_progress?: number;
      resolved?: number;
      closed?: number;
    };
    byPriority: {
      low?: number;
      normal?: number;
      high?: number;
      urgent?: number;
    };
    recentWeek: number;
  };
  chat: {
    total: number;
    byStatus: {
      open?: number;
      closed?: number;
    };
  };
  guides: {
    total: number;
    active: number;
    topViewed: Array<{ id: string; title: string; view_count: number }>;
  };
  news: {
    total: number;
    recentMonth: number;
  };
  courses: {
    total: number;
    byCategory: Array<{ category: string; count: number }>;
  };
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/analytics");
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: "Courses",
      value: analytics?.overview.courses || 0,
      icon: BookOpen,
      href: "/admin/courses",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Categories",
      value: analytics?.overview.categories || 0,
      icon: FolderTree,
      href: "/admin/categories",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Instructors",
      value: analytics?.overview.instructors || 0,
      icon: Users,
      href: "/admin/instructors",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Institutions",
      value: analytics?.overview.institutions || 0,
      icon: Building2,
      href: "/admin/institutions",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "News",
      value: analytics?.overview.news || 0,
      icon: Newspaper,
      href: "/admin/news",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Banners",
      value: analytics?.overview.banners || 0,
      icon: Layers,
      href: "/admin/banners",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  const supportStats = [
    {
      title: "Support Tickets",
      value: analytics?.tickets.total || 0,
      subtitle: `${analytics?.tickets.recentWeek || 0} this week`,
      icon: LifeBuoy,
      href: "/admin/tickets",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Chat Conversations",
      value: analytics?.chat.total || 0,
      subtitle: `${analytics?.chat.byStatus.open || 0} open`,
      icon: MessageSquare,
      href: "/admin/chat",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Knowledge Base",
      value: analytics?.guides.total || 0,
      subtitle: `${analytics?.guides.active || 0} active`,
      icon: FileText,
      href: "/admin/guides",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Popups",
      value: analytics?.overview.popups || 0,
      subtitle: `${analytics?.overview.activePopups || 0} active`,
      icon: LayoutDashboard,
      href: "/admin/popups",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  const shortcuts = [
    { title: "Add Course", href: "/admin/courses/new", icon: BookOpen, color: "text-blue-600" },
    { title: "Add Category", href: "/admin/categories/new", icon: FolderTree, color: "text-purple-600" },
    { title: "Add Instructor", href: "/admin/instructors/new", icon: Users, color: "text-green-600" },
    { title: "Add News", href: "/admin/news/new", icon: Newspaper, color: "text-red-600" },
    { title: "Add Banner", href: "/admin/banners/new", icon: Layers, color: "text-pink-600" },
    { title: "Add Guide", href: "/admin/guides/new", icon: FileText, color: "text-indigo-600" },
  ];

  const ticketStatusIcons: any = {
    new: { icon: Clock, color: "text-blue-500" },
    in_progress: { icon: AlertCircle, color: "text-yellow-500" },
    resolved: { icon: CheckCircle2, color: "text-green-500" },
    closed: { icon: XCircle, color: "text-gray-500" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Thai MOOC Admin Panel
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/settings">
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Content Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.href} href={stat.href}>
                <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Support & Communication */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Support & Communication
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.href} href={stat.href}>
                <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-sm font-medium mb-1">
                        {stat.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {stat.subtitle}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Detailed Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5" />
              Ticket Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics?.tickets.byStatus || {}).map(([status, count]) => {
                const statusConfig = ticketStatusIcons[status];
                const StatusIcon = statusConfig?.icon || Clock;
                return (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusConfig?.color}`} />
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Viewed Guides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Top Viewed Guides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.guides.topViewed.length ? (
                analytics.guides.topViewed.map((guide, index) => (
                  <Link key={guide.id} href={`/admin/guides/${guide.id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="truncate">{guide.title}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="font-bold">{guide.view_count}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No guides yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Button
                  key={shortcut.href}
                  asChild
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-all rounded-[0.2rem]"
                >
                  <Link href={shortcut.href}>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <Icon className={`h-6 w-6 ${shortcut.color}`} />
                    </div>
                    <span className="text-sm">{shortcut.title}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Admin Users</p>
              <p className="font-bold">{analytics?.overview.adminUsers || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Course Types</p>
              <p className="font-bold">{analytics?.overview.courseTypes || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Recent News (30d)</p>
              <p className="font-bold">{analytics?.news.recentMonth || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Popups</p>
              <p className="font-bold">{analytics?.overview.activePopups || 0} / {analytics?.overview.popups || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
