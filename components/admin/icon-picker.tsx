"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, BookOpen, Video, FileText, Monitor, Globe, Laptop, Presentation,
  Users, Award, BookMarked, Library, School, Lightbulb, Brain, Rocket, Target,
  Trophy, Star, Sparkles, MessageSquare, Code, Database, Smartphone, Camera,
  Music, Palette, Calculator, Beaker, Heart, Flame, Zap, Crown, Shield, Lock,
  Unlock, Key, Mail, Phone, MapPin, Map, Compass, Navigation, Wifi, Bluetooth,
  Signal, Printer, Cpu, HardDrive, Server, Cloud, Upload, Download, Folder,
  File, FileCode, FileImage, Save, Trash2 as Trash, Edit, Pencil, Pen, Plus,
  Minus, X, Check, ChevronRight, ArrowRight, TrendingUp, BarChart3 as BarChart,
  PieChart, Activity, Settings, Wrench, Hammer, Scissors, Paintbrush as Brush,
  Droplet, Sun, Moon, CloudRain, Snowflake, Wind, Thermometer, Umbrella, Coffee,
  Pizza, Utensils, Apple, Gift, ShoppingCart, ShoppingBag, CreditCard, DollarSign,
  Coins, Wallet, Tag, Package, Truck, Plane, Train, Car, Bike, Bus, Ship,
  Anchor, Home, Building, Building2, Store, Hospital, Hotel, Factory, Warehouse,
  TreePine, Flower2 as Flower, Leaf, Gem, Diamond, Circle, Square, Triangle,
  Hexagon, Box, Layers, Copy, Clipboard, ClipboardList, BookText, Newspaper,
  Bookmark, Flag, Bell, BellRing, AlarmClock, Clock, Calendar, Timer, Hourglass,
  Watch, Handshake, BriefcaseBusiness, Languages, Amphora, PencilRuler, ScrollText, Scroll, HandCoins, type LucideIcon,
} from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const iconOptions: { name: string; icon: LucideIcon }[] = [
  { name: "GraduationCap", icon: GraduationCap },
  { name: "BookOpen", icon: BookOpen },
  { name: "Video", icon: Video },
  { name: "FileText", icon: FileText },
  { name: "Monitor", icon: Monitor },
  { name: "Globe", icon: Globe },
  { name: "Laptop", icon: Laptop },
  { name: "Presentation", icon: Presentation },
  { name: "Users", icon: Users },
  { name: "Award", icon: Award },
  { name: "BookMarked", icon: BookMarked },
  { name: "Library", icon: Library },
  { name: "School", icon: School },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Brain", icon: Brain },
  { name: "Rocket", icon: Rocket },
  { name: "Target", icon: Target },
  { name: "Trophy", icon: Trophy },
  { name: "Star", icon: Star },
  { name: "Sparkles", icon: Sparkles },
  { name: "MessageSquare", icon: MessageSquare },
  { name: "Code", icon: Code },
  { name: "Database", icon: Database },
  { name: "Smartphone", icon: Smartphone },
  { name: "Camera", icon: Camera },
  { name: "Music", icon: Music },
  { name: "Palette", icon: Palette },
  { name: "Calculator", icon: Calculator },
  { name: "Beaker", icon: Beaker },
  { name: "Heart", icon: Heart },
  { name: "Flame", icon: Flame },
  { name: "Zap", icon: Zap },
  { name: "Crown", icon: Crown },
  { name: "Shield", icon: Shield },
  { name: "Lock", icon: Lock },
  { name: "Unlock", icon: Unlock },
  { name: "Key", icon: Key },
  { name: "Mail", icon: Mail },
  { name: "Phone", icon: Phone },
  { name: "MapPin", icon: MapPin },
  { name: "Map", icon: Map },
  { name: "Compass", icon: Compass },
  { name: "Navigation", icon: Navigation },
  { name: "Wifi", icon: Wifi },
  { name: "Bluetooth", icon: Bluetooth },
  { name: "Signal", icon: Signal },
  { name: "Printer", icon: Printer },
  { name: "Cpu", icon: Cpu },
  { name: "HardDrive", icon: HardDrive },
  { name: "Server", icon: Server },
  { name: "Cloud", icon: Cloud },
  { name: "Upload", icon: Upload },
  { name: "Download", icon: Download },
  { name: "Folder", icon: Folder },
  { name: "File", icon: File },
  { name: "FileCode", icon: FileCode },
  { name: "FileImage", icon: FileImage },
  { name: "Save", icon: Save },
  { name: "Trash", icon: Trash },
  { name: "Edit", icon: Edit },
  { name: "Pencil", icon: Pencil },
  { name: "Pen", icon: Pen },
  { name: "Plus", icon: Plus },
  { name: "Minus", icon: Minus },
  { name: "X", icon: X },
  { name: "Check", icon: Check },
  { name: "ChevronRight", icon: ChevronRight },
  { name: "ArrowRight", icon: ArrowRight },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "BarChart", icon: BarChart },
  { name: "PieChart", icon: PieChart },
  { name: "Activity", icon: Activity },
  { name: "Settings", icon: Settings },
  { name: "Wrench", icon: Wrench },
  { name: "Hammer", icon: Hammer },
  { name: "Scissors", icon: Scissors },
  { name: "Brush", icon: Brush },
  { name: "Droplet", icon: Droplet },
  { name: "Sun", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "CloudRain", icon: CloudRain },
  { name: "Snowflake", icon: Snowflake },
  { name: "Wind", icon: Wind },
  { name: "Thermometer", icon: Thermometer },
  { name: "Umbrella", icon: Umbrella },
  { name: "Coffee", icon: Coffee },
  { name: "Pizza", icon: Pizza },
  { name: "Utensils", icon: Utensils },
  { name: "Apple", icon: Apple },
  { name: "Gift", icon: Gift },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "CreditCard", icon: CreditCard },
  { name: "DollarSign", icon: DollarSign },
  { name: "Coins", icon: Coins },
  { name: "Wallet", icon: Wallet },
  { name: "Tag", icon: Tag },
  { name: "Package", icon: Package },
  { name: "Truck", icon: Truck },
  { name: "Plane", icon: Plane },
  { name: "Train", icon: Train },
  { name: "Car", icon: Car },
  { name: "Bike", icon: Bike },
  { name: "Bus", icon: Bus },
  { name: "Ship", icon: Ship },
  { name: "Anchor", icon: Anchor },
  { name: "Home", icon: Home },
  { name: "Building", icon: Building },
  { name: "Building2", icon: Building2 },
  { name: "Store", icon: Store },
  { name: "Hospital", icon: Hospital },
  { name: "Hotel", icon: Hotel },
  { name: "Factory", icon: Factory },
  { name: "Warehouse", icon: Warehouse },
  { name: "TreePine", icon: TreePine },
  { name: "Flower", icon: Flower },
  { name: "Leaf", icon: Leaf },
  { name: "Gem", icon: Gem },
  { name: "Diamond", icon: Diamond },
  { name: "Circle", icon: Circle },
  { name: "Square", icon: Square },
  { name: "Triangle", icon: Triangle },
  { name: "Hexagon", icon: Hexagon },
  { name: "Box", icon: Box },
  { name: "Layers", icon: Layers },
  { name: "Copy", icon: Copy },
  { name: "Clipboard", icon: Clipboard },
  { name: "ClipboardList", icon: ClipboardList },
  { name: "BookText", icon: BookText },
  { name: "Newspaper", icon: Newspaper },
  { name: "Bookmark", icon: Bookmark },
  { name: "Flag", icon: Flag },
  { name: "Bell", icon: Bell },
  { name: "BellRing", icon: BellRing },
  { name: "AlarmClock", icon: AlarmClock },
  { name: "Clock", icon: Clock },
  { name: "Calendar", icon: Calendar },
  { name: "Timer", icon: Timer },
  { name: "Hourglass", icon: Hourglass },
  { name: "Watch", icon: Watch },
  { name: "Handshake", icon: Handshake },
  { name: "BriefcaseBusiness", icon: BriefcaseBusiness },
  { name: "Languages", icon: Languages },
  { name: "Amphora", icon: Amphora },
  { name: "PencilRuler", icon: PencilRuler },
  { name: "ScrollText", icon: ScrollText },
  { name: "Scroll", icon: Scroll },
  { name: "HandCoins", icon: HandCoins },
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIcon = iconOptions.find((opt) => opt.name === value);
  const SelectedIconComponent = selectedIcon?.icon || BookOpen;

  const filteredIcons = iconOptions.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>Icon</Label>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 border rounded-md flex items-center justify-center bg-muted">
            <SelectedIconComponent className="w-6 h-6" />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "ปิด" : "เลือก Icon"}
          </Button>
          {selectedIcon && (
            <span className="text-sm text-muted-foreground">
              {selectedIcon.name}
            </span>
          )}
        </div>

        {isOpen && (
          <div className="border rounded-md">
            <div className="p-2 border-b">
              <Input
                placeholder="ค้นหา icon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-8 gap-2 p-4 max-h-96 overflow-y-auto">
              {filteredIcons.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => {
                      onChange(option.name);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-12 h-12 flex items-center justify-center rounded-md border transition-colors hover:bg-accent ${
                      value === option.name
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                    title={option.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
            {filteredIcons.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                ไม่พบ icon
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
