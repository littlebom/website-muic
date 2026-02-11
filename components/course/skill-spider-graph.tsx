"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { HARD_SKILL_DOMAINS, SOFT_SKILL_DOMAINS } from "@/lib/gemini";

interface SkillData {
  H1?: number;
  H2?: number;
  H3?: number;
  H4?: number;
  H5?: number;
  H6?: number;
  S1?: number;
  S2?: number;
  S3?: number;
  S4?: number;
  S5?: number;
  S6?: number;
}

interface SkillSpiderGraphProps {
  hardSkills: SkillData;
  softSkills: SkillData;
  type: "hard" | "soft";
}

const HARD_SKILL_LABELS = {
  H1: "Data Science & AI",
  H2: "Digital Dev & Security",
  H3: "Tech PM & Process",
  H4: "Financial Modeling",
  H5: "Tech Operations",
  H6: "Regulatory & Compliance",
};

const SOFT_SKILL_LABELS = {
  S1: "Analytical Thinking",
  S2: "Communication",
  S3: "Leadership",
  S4: "Adaptability",
  S5: "Creativity",
  S6: "Service Orientation",
};

export function SkillSpiderGraph({
  hardSkills,
  softSkills,
}: Omit<SkillSpiderGraphProps, "type">) {
  // Combine skills: Soft Skills (Right) then Hard Skills (Left)
  // Recharts radar usually goes clockwise starting from top/right.
  // We want Soft on Right, Hard on Left.

  const chartData = [
    // Soft Skills (S1-S6)
    ...Object.entries(SOFT_SKILL_LABELS).map(([key, label]) => ({
      skill: label,
      value: softSkills[key as keyof SkillData] || 0,
      fullMark: 100,
      type: 'soft'
    })),
    // Hard Skills (H1-H6)
    ...Object.entries(HARD_SKILL_LABELS).map(([key, label]) => ({
      skill: label,
      value: hardSkills[key as keyof SkillData] || 0,
      fullMark: 100,
      type: 'hard'
    })),
  ];

  // Unified color (Purple theme)
  const color = "#8884d8";
  const fillColor = "#8884d8";

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={450}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="skill"
            tick={(props: any) => {
              const { cx, cy, payload, x, y, textAnchor, verticalAnchor, ...rest } = props;
              // Custom tick to color code labels based on type
              const index = payload.index;
              const isSoft = index < 6;
              const tickColor = isSoft ? "#10b981" : "#3b82f6"; // Green for Soft, Blue for Hard

              return (
                <text
                  {...rest}
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  fill={tickColor}
                  fontSize={12}
                  fontWeight={500}
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#999", fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Skill Level"
            dataKey="value"
            stroke={color}
            fill={fillColor}
            fillOpacity={0.5}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const isSoft = data.type === 'soft';
                const typeLabel = isSoft ? "Soft Skill" : "Hard Skill";
                const typeColor = isSoft ? "#10b981" : "#3b82f6";

                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border">
                    <p className="text-xs font-semibold mb-1" style={{ color: typeColor }}>
                      {typeLabel}
                    </p>
                    <p className="font-medium text-sm">
                      {data.skill}
                    </p>
                    <p className="text-lg font-bold" style={{ color }}>
                      {payload[0].value}/100
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Skill Details Legend/Bar */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Hard Skills Column */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[#3b82f6] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
            Hard Skills
          </h4>
          {Object.entries(HARD_SKILL_LABELS).map(([key, label]) => {
            const score = hardSkills[key as keyof SkillData] || 0;
            const fullDomainName = HARD_SKILL_DOMAINS[key as keyof typeof HARD_SKILL_DOMAINS];

            return (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700 truncate" title={fullDomainName}>
                    {fullDomainName}
                  </div>
                  <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${score}%`,
                        backgroundColor: "#3b82f6",
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm font-bold text-[#3b82f6]">
                  {score}
                </div>
              </div>
            );
          })}
        </div>

        {/* Soft Skills Column */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[#10b981] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            Soft Skills
          </h4>
          {Object.entries(SOFT_SKILL_LABELS).map(([key, label]) => {
            const score = softSkills[key as keyof SkillData] || 0;
            const fullDomainName = SOFT_SKILL_DOMAINS[key as keyof typeof SOFT_SKILL_DOMAINS];

            return (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700 truncate" title={fullDomainName}>
                    {fullDomainName}
                  </div>
                  <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${score}%`,
                        backgroundColor: "#10b981",
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm font-bold text-[#10b981]">
                  {score}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
