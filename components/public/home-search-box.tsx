"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export interface HomeSearchBoxProps {
    variant?: "default" | "banner";
    className?: string; // Allow passing external margins/width
    disableForm?: boolean; // New prop to prevent hydration error in admin preview
}

export function HomeSearchBox({ variant = "default", className = "", disableForm = false }: HomeSearchBoxProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/courses?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const isBanner = variant === "banner";
    const Container = disableForm ? "div" : "form";

    return (
        <div className={`w-full ${isBanner ? 'max-w-2xl' : 'max-w-4xl mx-auto'} relative z-10 ${className}`}>
            <div className={`${isBanner
                ? "bg-white/10 backdrop-blur-md p-2 border border-white/20"
                : "bg-white shadow-sm p-4 md:p-6 border border-gray-100"
                } ${isBanner ? "rounded-[5px]" : "rounded-xl"} transition-all`}>
                <Container
                    onSubmit={disableForm ? undefined : handleSearch}
                    className="flex flex-col md:flex-row gap-2 md:gap-4"
                >
                    <div className="flex-1 relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isBanner ? "text-white/70" : "text-gray-400"
                            }`} />
                        <Input
                            type="text"
                            placeholder={t(
                                "ค้นหารายวิชาที่น่าสนใจ...",
                                "Search for interesting courses..."
                            )}
                            className={`pl-10 h-12 text-lg transition-colors ${isBanner
                                ? "bg-black/20 border-transparent text-white placeholder:text-white/60 focus:bg-black/30 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-white/50"
                                : "bg-gray-50 border-gray-200 focus:bg-white"
                                }`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            readOnly={disableForm}
                        />
                    </div>
                    <Button
                        type={disableForm ? "button" : "submit"}
                        size="lg"
                        className={`h-12 px-8 text-lg font-medium ${isBanner
                            ? "bg-white text-primary hover:bg-white/90"
                            : "bg-primary hover:bg-primary/90"
                            }`}
                        style={{ borderRadius: isBanner ? '5px' : '.5rem' }}
                        disabled={disableForm}
                    >
                        {t("ค้นหา", "Search")}
                    </Button>
                </Container>
            </div>
        </div>
    );
}
