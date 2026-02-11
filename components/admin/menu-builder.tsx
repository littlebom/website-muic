"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotification } from "@/components/ui/notification-dialog";

interface MenuItem {
    id: string; // generated UUID or temp ID
    label: string;
    url: string;
    order: number;
    target: "_self" | "_blank";
}

interface MenuBuilderProps {
    institutionId: string;
}

export function MenuBuilder({ institutionId }: MenuBuilderProps) {
    const { showSuccess, showError, NotificationComponent } = useNotification();
    const [activeTab, setActiveTab] = useState("header");
    const [loading, setLoading] = useState(false);
    const [headerItems, setHeaderItems] = useState<MenuItem[]>([]);
    const [footerItems, setFooterItems] = useState<MenuItem[]>([]);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<Partial<MenuItem>>({
        label: "",
        url: "",
        target: "_self"
    });

    useEffect(() => {
        fetchMenus();
    }, [institutionId]);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/menus?institutionId=${institutionId}`);
            if (!res.ok) throw new Error("Failed to fetch menus");
            const data = await res.json();
            setHeaderItems(data.header || []);
            setFooterItems(data.footer || []);
        } catch (error) {
            console.error(error);
            showError("Error", "Failed to load menus");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (position: string, items: MenuItem[]) => {
        try {
            const res = await fetch("/api/menus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    institutionId,
                    position,
                    items
                }),
            });

            if (!res.ok) throw new Error("Failed to save menu");

            showSuccess("Success", `${position === "header" ? "Header" : "Footer"} menu saved successfully`);
        } catch (error) {
            console.error(error);
            showError("Error", "Failed to save menu");
        }
    };

    const handleAddItem = () => {
        setEditingItem(null);
        setFormData({ label: "", url: "", target: "_self" });
        setIsDialogOpen(true);
    };

    const handleEditItem = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({ ...item });
        setIsDialogOpen(true);
    };

    const handleDeleteItem = (id: string, position: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        if (position === "header") {
            const newItems = headerItems.filter(i => i.id !== id);
            setHeaderItems(newItems);
            handleSave("header", newItems);
        } else {
            const newItems = footerItems.filter(i => i.id !== id);
            setFooterItems(newItems);
            handleSave("footer", newItems);
        }
    };

    const handleDialogSubmit = () => {
        if (!formData.label || !formData.url) return;

        const currentItems = activeTab === "header" ? headerItems : footerItems;
        let newItems = [...currentItems];

        if (editingItem) {
            // Edit existing
            newItems = newItems.map(item =>
                item.id === editingItem.id
                    ? { ...item, ...formData } as MenuItem
                    : item
            );
        } else {
            // Add new
            newItems.push({
                id: crypto.randomUUID(), // Temp ID
                label: formData.label,
                url: formData.url,
                target: formData.target as "_self" | "_blank" || "_self",
                order: newItems.length
            } as MenuItem);
        }

        if (activeTab === "header") {
            setHeaderItems(newItems);
            handleSave("header", newItems);
        } else {
            setFooterItems(newItems);
            handleSave("footer", newItems);
        }

        setIsDialogOpen(false);
    };

    // Helper to render menu list
    const renderMenuList = (items: MenuItem[], position: string) => (
        <div className="space-y-2">
            {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 border rounded-md">
                    <GripVertical className="h-5 w-5 text-slate-400 cursor-move" />
                    <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>Edit</Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteItem(item.id, position)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}

            {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No menu items yet. Add one to get started.
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <NotificationComponent />
            <Tabs defaultValue="header" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="header">Header Menu</TabsTrigger>
                        <TabsTrigger value="footer">Footer Menu</TabsTrigger>
                    </TabsList>

                    <Button onClick={handleAddItem}>
                        <Plus className="mr-2 h-4 w-4" /> Add Menu Item
                    </Button>
                </div>

                <TabsContent value="header" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Header Navigation</CardTitle>
                            <CardDescription>
                                Configure the main navigation bar for the microsite.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderMenuList(headerItems, "header")}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="footer" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Footer Navigation</CardTitle>
                            <CardDescription>
                                Configure the links shown in the microsite footer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderMenuList(footerItems, "footer")}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                placeholder="e.g. Home"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="e.g. / or https://example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Target</Label>
                            <Select
                                value={formData.target}
                                onValueChange={(val) => setFormData({ ...formData, target: val as "_self" | "_blank" })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_self">Same Tab</SelectItem>
                                    <SelectItem value="_blank">New Tab</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDialogSubmit}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
