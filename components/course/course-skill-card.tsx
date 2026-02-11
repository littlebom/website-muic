"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SkillSpiderGraph } from "./skill-spider-graph";
import { RefreshCw, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface SkillScores {
  H1: number;
  H2: number;
  H3: number;
  H4: number;
  H5: number;
  H6: number;
}

interface SoftSkillScores {
  S1: number;
  S2: number;
  S3: number;
  S4: number;
  S5: number;
  S6: number;
}

interface AnalysisData {
  hardSkills: SkillScores;
  softSkills: SoftSkillScores;
  reasoning: string;
  reasoningTh?: string;
  reasoningEn?: string;
}

interface CourseSkillCardProps {
  courseId: string;
  showRefreshButton?: boolean; // Show refresh button (default: false for public pages)
}

export function CourseSkillCard({ courseId, showRefreshButton = false }: CourseSkillCardProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [cached, setCached] = useState(false);
  const [cacheAge, setCacheAge] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = `/api/courses/${courseId}/analyze-skills`;
      const method = forceRefresh ? "POST" : "GET";

      const response = await fetch(endpoint, { method });
      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data);
        setCached(result.cached || false);
        setCacheAge(result.cacheAge || 0);
      } else {
        setError(result.error || "Failed to analyze skills");
      }
    } catch (err) {
      console.error("Error fetching skill analysis:", err);
      setError("เกิดข้อผิดพลาดในการวิเคราะห์ทักษะ");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const handleRefresh = async () => {
    setAnalyzing(true);
    await fetchAnalysis(true);
  };

  useEffect(() => {
    fetchAnalysis();
  }, [courseId]);

  if (loading && !analyzing) {
    return (
      <Card className="ring-0 shadow-none hover:shadow-none">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t("การวิเคราะห์ทักษะด้วย AI", "AI Skill Analysis")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-muted-foreground">
              {t("กำลังวิเคราะห์...", "Analyzing...")}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="ring-0 shadow-none hover:shadow-none">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t("การวิเคราะห์ทักษะด้วย AI", "AI Skill Analysis")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => fetchAnalysis()} variant="outline" size="sm">
              {t("ลองอีกครั้ง", "Try Again")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Card className="ring-0 shadow-none hover:shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t("การวิเคราะห์ทักษะด้วย AI", "AI Skill Analysis")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showRefreshButton && (
              <>
                {cached && (
                  <span className="text-xs text-muted-foreground">
                    {t(
                      `อัพเดตเมื่อ ${cacheAge} ชั่วโมงที่แล้ว`,
                      `Updated ${cacheAge}h ago`
                    )}
                  </span>
                )}
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={analyzing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`}
                  />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SkillSpiderGraph
          hardSkills={analysis.hardSkills}
          softSkills={analysis.softSkills}
        />

        {/* AI Reasoning */}
        {(analysis.reasoning || analysis.reasoningTh || analysis.reasoningEn) && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-900 mb-1">
                  {t("ข้อมูลเชิงลึกจาก AI", "AI Insights")}
                </p>
                <p className="text-sm text-purple-700">
                  {language === "th"
                    ? analysis.reasoningTh || analysis.reasoning
                    : analysis.reasoningEn || analysis.reasoning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          {t(
            "การวิเคราะห์นี้สร้างโดย AI และอาจไม่สมบูรณ์แบบ ใช้เป็นข้อมูลอ้างอิงเท่านั้น",
            "This analysis is AI-generated and may not be perfect. Use as reference only."
          )}
        </p>
      </CardContent>
    </Card>
  );
}
