"use client";

import {
  Brain,
  CreditCard,
  Film,
  Globe,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminTabId } from "@/lib/admin/types";

const TAB_ICONS: Record<AdminTabId, typeof Globe> = {
  overview: LayoutDashboard,
  users: Users,
  scraping: Globe,
  llm: Brain,
  media: Film,
  billing: CreditCard,
};

interface AdminTabsProps {
  tabs: { id: AdminTabId; label: string }[];
  activeTab: AdminTabId;
  onChange: (id: AdminTabId) => void;
  badges?: Partial<Record<AdminTabId, string | number>>;
}

export function AdminTabs({ tabs, activeTab, onChange, badges }: AdminTabsProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
      {tabs.map(({ id, label }) => {
        const Icon = TAB_ICONS[id];
        const badge = badges?.[id];
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-1 min-w-[100px] items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition",
              activeTab === id
                ? "bg-violet-600/20 text-violet-300 shadow-sm"
                : "text-white/40 hover:text-white/70"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
            {badge !== undefined && (
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
