"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import type { ContentTopic } from "@/lib/types";

interface ContentStructureEditorProps {
    courseId: string;
    initialContent?: ContentTopic[];
    onSave?: (content: ContentTopic[]) => void;
}

export function ContentStructureEditor({
    courseId,
    initialContent = [],
    onSave,
}: ContentStructureEditorProps) {
    const [contentTopics, setContentTopics] = useState<ContentTopic[]>(initialContent);
    const [saving, setSaving] = useState(false);

    // Content Structure handlers
    const addMainTopic = () => {
        setContentTopics([
            ...contentTopics,
            {
                id: `topic-${nanoid(10)}`,
                title: "",
                subtopics: [],
            },
        ]);
    };

    const removeMainTopic = (index: number) => {
        setContentTopics(contentTopics.filter((_, i) => i !== index));
    };

    const updateMainTopic = (index: number, title: string) => {
        const updated = [...contentTopics];
        updated[index].title = title;
        setContentTopics(updated);
    };

    const addSubtopic = (topicIndex: number) => {
        const updated = [...contentTopics];
        updated[topicIndex].subtopics.push("");
        setContentTopics(updated);
    };

    const removeSubtopic = (topicIndex: number, subIndex: number) => {
        const updated = [...contentTopics];
        updated[topicIndex].subtopics = updated[topicIndex].subtopics.filter(
            (_, i) => i !== subIndex
        );
        setContentTopics(updated);
    };

    const updateSubtopic = (topicIndex: number, subIndex: number, value: string) => {
        const updated = [...contentTopics];
        updated[topicIndex].subtopics[subIndex] = value;
        setContentTopics(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contentStructure: JSON.stringify(contentTopics),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save content structure");
            }

            if (onSave) {
                onSave(contentTopics);
            }

            alert("Content structure saved successfully!");
        } catch (error) {
            console.error("Error saving content structure:", error);
            alert("Failed to save content structure. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {contentTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                    ยังไม่มีโครงสร้างเนื้อหา คลิกปุ่มด้านล่างเพื่อเพิ่มหัวข้อหลัก
                </p>
            ) : (
                <div className="space-y-6">
                    {contentTopics.map((topic, topicIndex) => (
                        <div
                            key={topic.id}
                            className="border rounded-lg p-4 space-y-3 bg-gray-50"
                        >
                            {/* Main Topic */}
                            <div className="flex items-start gap-2">
                                <div className="flex-1">
                                    <Label htmlFor={`topic-${topic.id}`}>
                                        หัวข้อหลัก {topicIndex + 1}
                                    </Label>
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            id={`topic-${topic.id}`}
                                            value={topic.title}
                                            onChange={(e) =>
                                                updateMainTopic(topicIndex, e.target.value)
                                            }
                                            placeholder="เช่น บทที่ 1: Introduction to Programming"
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeMainTopic(topicIndex)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Subtopics */}
                            {topic.subtopics.length > 0 && (
                                <div className="ml-6 space-y-2">
                                    <Label className="text-sm text-muted-foreground">
                                        หัวข้อย่อย
                                    </Label>
                                    {topic.subtopics.map((subtopic, subIndex) => (
                                        <div key={subIndex} className="flex gap-2">
                                            <Input
                                                value={subtopic}
                                                onChange={(e) =>
                                                    updateSubtopic(topicIndex, subIndex, e.target.value)
                                                }
                                                placeholder={`หัวข้อย่อยที่ ${subIndex + 1}`}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeSubtopic(topicIndex, subIndex)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Subtopic Button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSubtopic(topicIndex)}
                                className="ml-6"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                เพิ่มหัวข้อย่อย
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Main Topic Button */}
            <Button
                type="button"
                variant="outline"
                onClick={addMainTopic}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มหัวข้อหลัก
            </Button>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="min-w-32"
                >
                    {saving ? "Saving..." : "Save Content Structure"}
                </Button>
            </div>
        </div>
    );
}
