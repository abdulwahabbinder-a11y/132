"use client";

import { useMemo, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { VidrushShell } from "@/components/vidrush/VidrushShell";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { ScraperGrid } from "@/components/admin/ScraperGrid";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { AdminSaveBar } from "@/components/admin/AdminSaveBar";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import type { AdminTabId } from "@/lib/admin/types";
import {
  ADMIN_TABS,
  computeAdminStats,
  settingsForTab,
} from "@/lib/admin/utils";

const TAB_HINTS: Partial<Record<AdminTabId, React.ReactNode>> = {
  llm: (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
      <h3 className="mb-1 text-sm font-semibold text-violet-300">LLM Routing</h3>
      <p className="text-xs text-white/50">
        <strong className="text-white/70">Claude</strong> handles deep research synthesis.
        <strong className="text-white/70"> Script LLM</strong> controls final viral script generation.
      </p>
    </div>
  ),
  billing: (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-xs text-white/45">
        Stripe keys enable Pro subscriptions ($29/mo, 30 credits).
        Webhook secret is required for automatic credit top-ups after payment.
      </p>
    </div>
  ),
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [search, setSearch] = useState("");

  const {
    settings,
    scrapers,
    draft,
    loading,
    saving,
    saved,
    error,
    isDemo,
    draftCount,
    updateDraft,
    toggleScraper,
    bulkToggleScrapers,
    handleSave,
    handleLogout,
    discardDraft,
    getVal,
  } = useAdminSettings();

  const usersEnabled = activeTab === "users" || activeTab === "overview";
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refresh: refreshUsers,
  } = useAdminUsers(usersEnabled);

  const stats = useMemo(
    () => computeAdminStats(settings, scrapers, draft),
    [settings, scrapers, draft]
  );

  const tabSettings = useMemo(
    () => settingsForTab(settings, activeTab, search),
    [settings, activeTab, search]
  );

  const tabBadges = useMemo(
    () => ({
      users: usersData?.summary.total_users ?? "…",
      scraping: `${stats.scrapersReady}/${stats.scrapersTotal}`,
      llm: stats.llmReady ? "✓" : "!",
      media: stats.mediaReady ? "✓" : "!",
      billing: stats.billingReady ? "✓" : "!",
    }),
    [stats, usersData]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error && settings.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-6">
        <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold">Admin Access Required</h1>
          <p className="text-sm text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  const activeTabLabel =
    ADMIN_TABS.find((t) => t.id === activeTab)?.label ?? "Settings";

  return (
    <VidrushShell>
      <div className="mx-auto max-w-6xl px-6 py-8 pb-24 lg:px-10">
        <AdminHeader
          isDemo={isDemo}
          healthScore={stats.healthScore}
          onLogout={handleLogout}
          onRefresh={() => {
            discardDraft();
            refreshUsers();
          }}
        />

        <AdminTabs
          tabs={ADMIN_TABS}
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id);
            setSearch("");
          }}
          badges={tabBadges}
        />

        {activeTab === "overview" && (
          <AdminOverview
            stats={stats}
            usersSummary={usersData?.summary}
            onViewUsers={() => setActiveTab("users")}
          />
        )}

        {activeTab === "users" && (
          <AdminUsersPanel
            summary={usersData?.summary ?? null}
            users={usersData?.users ?? []}
            loading={usersLoading}
            error={usersError}
            onRefresh={refreshUsers}
            isDemo={isDemo}
          />
        )}

        {activeTab === "scraping" && (
          <>
            <ScraperGrid
              scrapers={scrapers}
              settings={settings}
              draft={draft}
              getVal={getVal}
              onToggle={toggleScraper}
              onBulkEnable={bulkToggleScrapers}
            />
            <SettingsPanel
              title="Scraping — API Keys"
              settings={tabSettings}
              draft={draft}
              onUpdate={updateDraft}
              search={search}
              onSearchChange={setSearch}
            />
          </>
        )}

        {activeTab !== "overview" &&
          activeTab !== "users" &&
          activeTab !== "scraping" && (
          <SettingsPanel
            title={`${activeTabLabel} — Configuration`}
            settings={tabSettings}
            draft={draft}
            onUpdate={updateDraft}
            search={search}
            onSearchChange={setSearch}
            hint={TAB_HINTS[activeTab]}
          />
        )}

        <AdminSaveBar
          draftCount={draftCount}
          saving={saving}
          saved={saved}
          onSave={handleSave}
          onDiscard={discardDraft}
        />
      </div>
    </VidrushShell>
  );
}
