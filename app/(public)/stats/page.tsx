"use client";

import { useEffect, useState } from "react";
import {
    BookOpen,
    Users,
    Building2,
    Award,
    GraduationCap,
    LayoutGrid,
    TrendingUp,
    Globe
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Card, CardContent } from "@/components/ui/card";

interface StatsData {
    courses: number;
    instructors: number;
    institutions: number;
    categories: number;
    news: number;
    guides: number;
    externalLearners?: number;
    certificates?: number;
}

export default function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch("/api/public/stats");
                const data = await response.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const statItems = [
        {
            label: "รายวิชาทั้งหมด",
            value: stats?.courses || 0,
            icon: BookOpen,
            color: "text-blue-600",
            bg: "bg-blue-50",
            description: "คอร์สเรียนคุณภาพจากสถาบันชั้นนำ"
        },
        {
            label: "ผู้เรียนทั้งหมด",
            value: stats?.externalLearners || 0,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            description: "ผู้เรียนที่ลงทะเบียนในระบบ"
        },
        {
            label: "ใบประกาศนียบัตร",
            value: stats?.certificates || 0,
            icon: Award,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
            description: "มอบให้เมื่อเรียนจบหลักสูตร"
        },
        {
            label: "สถาบันการศึกษา",
            value: stats?.institutions || 0,
            icon: Building2,
            color: "text-orange-600",
            bg: "bg-orange-50",
            description: "พันธมิตรทางการศึกษาทั่วประเทศ"
        },
        {
            label: "ผู้สอน",
            value: stats?.instructors || 0,
            icon: GraduationCap,
            color: "text-purple-600",
            bg: "bg-purple-50",
            description: "ผู้เชี่ยวชาญในหลากหลายสาขา"
        },
        {
            label: "หมวดหมู่",
            value: stats?.categories || 0,
            icon: LayoutGrid,
            color: "text-pink-600",
            bg: "bg-pink-50",
            description: "ครอบคลุมทุกความสนใจ"
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลสถิติ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-20 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="container mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        สถิติการเรียนรู้บน MUIC
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                        แพลตฟอร์มการเรียนรู้ออนไลน์ระบบเปิดสำหรับมหาชน ที่รวบรวมองค์ความรู้จากสถาบันชั้นนำทั่วประเทศ
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-none shadow-md">
                                <CardContent className="p-8">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-4 rounded-2xl ${item.bg}`}>
                                            <Icon className={`w-8 h-8 ${item.color}`} />
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2 py-1 rounded text-xs font-medium">
                                            <TrendingUp className="w-3 h-3" />
                                            <span>Updated</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-bold text-gray-900 mb-2">
                                            <AnimatedCounter end={item.value} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-1">
                                            {item.label}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {item.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Additional Info Section */}
            <div className="container mx-auto px-4 mt-20">
                <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">
                            ทำไมต้องเรียนกับ <span className="text-blue-600">MUIC?</span>
                        </h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            เรามุ่งมั่นที่จะสร้างสังคมแห่งการเรียนรู้ตลอดชีวิต ด้วยคอร์สเรียนคุณภาพที่เข้าถึงได้ง่าย เรียนได้ทุกที่ ทุกเวลา พร้อมรับใบประกาศนียบัตรเพื่อต่อยอดทางวิชาชีพ
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-medium">
                                <Globe className="w-5 h-5" />
                                เรียนได้ทุกที่
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-medium">
                                <Award className="w-5 h-5" />
                                ใบประกาศนียบัตร
                            </div>
                            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full font-medium">
                                <Users className="w-5 h-5" />
                                ชุมชนแห่งการเรียนรู้
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
                        <div className="relative grid grid-cols-2 gap-4">
                            <div className="bg-blue-100 p-6 rounded-2xl text-center transform translate-y-8">
                                <div className="text-3xl font-bold text-blue-600 mb-1">24/7</div>
                                <div className="text-sm text-blue-800">Access</div>
                            </div>
                            <div className="bg-purple-100 p-6 rounded-2xl text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-1">100%</div>
                                <div className="text-sm text-purple-800">Free</div>
                            </div>
                            <div className="bg-green-100 p-6 rounded-2xl text-center transform translate-y-8">
                                <div className="text-3xl font-bold text-green-600 mb-1">High</div>
                                <div className="text-sm text-green-800">Quality</div>
                            </div>
                            <div className="bg-orange-100 p-6 rounded-2xl text-center">
                                <div className="text-3xl font-bold text-orange-600 mb-1">Any</div>
                                <div className="text-sm text-orange-800">Device</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
