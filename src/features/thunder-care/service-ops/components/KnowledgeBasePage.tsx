"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  ArrowRightIcon,
  BoxIcon,
  ClipboardIcon,
  EyeIcon,
  InfoIcon,
  LightbulbIcon,
  MegaphoneIcon,
  PlayIcon,
  SettingsIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import {
  featuredArticles,
  howToGuides,
  knowledgeCategories,
  knowledgeQuickLinks,
  knowledgeUpdates,
  popularArticles,
  type KnowledgeCategory,
} from "../mock-data";

// "คลังความรู้" — แหล่งรวมคู่มือ/แนวปฏิบัติของ Thunder Care (ผังหน้าจอที่
// ผู้ใช้ส่งมา 2569-09-08, หน้าที่ 5 — หน้าสุดท้ายของชุด Service Operator
// persona นี้). ทุกลิงก์/บทความเป็น mock แสดงผลอย่างเดียว ไม่มีหน้าอ่าน
// บทความจริงให้กดต่อ (ธรรมเนียม "ยังไม่เปิดใช้งาน" เดียวกับ filter/ปุ่มอื่นๆ
// ในหน้า Service Operator ที่เพิ่ง redesign ไป).
const categoryIcon: Record<string, typeof InfoIcon> = {
  manuals: InfoIcon,
  troubleshooting: SettingsIcon,
  practices: ClipboardIcon,
  policy: ShieldIcon,
  training: LightbulbIcon,
  archive: BoxIcon,
};

function categoryLabel(categoryId: string): string {
  return knowledgeCategories.find((c) => c.id === categoryId)?.label ?? categoryId;
}

function CategoryCard({ category }: { category: KnowledgeCategory }) {
  const Icon = categoryIcon[category.id] ?? InfoIcon;
  return (
    <button
      type="button"
      disabled
      title="ยังไม่เปิดใช้งาน"
      className="flex cursor-not-allowed flex-col items-center gap-2 rounded-xl border border-zinc-100 p-4 text-center hover:border-zinc-200 dark:border-zinc-800 dark:hover:border-zinc-700"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{category.label}</span>
      <span className="text-[11px] text-zinc-400">{category.articleCount} บทความ</span>
    </button>
  );
}

function FeaturedCard({ article }: { article: (typeof featuredArticles)[number] }) {
  return (
    <button
      type="button"
      disabled
      title="ยังไม่เปิดใช้งาน"
      className="flex cursor-not-allowed flex-col gap-2 rounded-xl border border-zinc-100 p-3 text-left dark:border-zinc-800"
    >
      <div className="flex h-24 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-800">
        <InfoIcon className="h-6 w-6" />
      </div>
      <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        {categoryLabel(article.categoryId)}
      </span>
      <p className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">{article.title}</p>
      <p className="flex items-center gap-1 text-xs text-zinc-400">
        <EyeIcon className="h-3 w-3" /> {article.viewsLabel} · {article.dateLabel}
      </p>
    </button>
  );
}

function PopularArticlesCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">บทความยอดนิยม</h2>
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">ดูทั้งหมด</span>
      </div>
      <ol className="flex flex-col gap-2.5">
        {popularArticles.map((article, index) => (
          <li key={article.id} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-800 dark:text-zinc-100">{article.title}</p>
              <span className="text-[11px] text-indigo-500">{categoryLabel(article.categoryId)}</span>
            </div>
            <div className="shrink-0 text-right text-[11px] text-zinc-400">
              <p className="flex items-center gap-1">
                <EyeIcon className="h-3 w-3" /> {article.viewsLabel}
              </p>
              <p>{article.dateLabel}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function HowToGuidesCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">How-to Guides</h2>
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">ดูทั้งหมด</span>
      </div>
      <ul className="flex flex-col gap-3">
        {howToGuides.map((guide) => (
          <li key={guide.id} className="flex items-center gap-2.5">
            <div className="relative flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <PlayIcon className="h-4 w-4" />
              <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[9px] text-white">{guide.durationLabel}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-800 dark:text-zinc-100">{guide.title}</p>
              <p className="text-[11px] text-zinc-400">
                {guide.dateLabel} · {guide.viewsLabel} views
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function QuickLinksCard() {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ลิงก์ด่วน</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
        {knowledgeQuickLinks.map((link) => (
          <li key={link.label}>
            <button
              type="button"
              disabled
              title="ยังไม่เปิดใช้งาน"
              className="flex w-full cursor-not-allowed items-center justify-between py-2 text-sm text-zinc-600 dark:text-zinc-300"
            >
              {link.label}
              <ArrowRightIcon className="h-3.5 w-3.5 text-zinc-300" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LatestUpdatesCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">อัปเดตล่าสุด</h2>
      <ul className="flex flex-col gap-3">
        {knowledgeUpdates.map((row) => (
          <li key={row.id} className="flex items-start gap-2.5">
            <MegaphoneIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{row.title}</p>
              <p className="text-[11px] text-indigo-500">{categoryLabel(row.categoryId)}</p>
              <p className="text-[11px] text-zinc-400">{row.dateLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NeedHelpCard() {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ไม่พบคำตอบที่ต้องการ?</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">ส่งคำถามให้ทีม Knowledge หรือแนะนำความรู้ที่ต้องการ</p>
      <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
        ส่งคำถาม / แนะนำความรู้
      </Button>
    </Card>
  );
}

export function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "categories">("overview");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">คลังความรู้</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">แหล่งรวมความรู้ คู่มือ และแนวปฏิบัติการบริการของ Thunder Care</p>
      </div>

      <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {[
          { key: "overview" as const, label: "ภาพรวม" },
          { key: "categories" as const, label: "หมวดหมู่" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "categories" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {knowledgeCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาความรู้..." className="max-w-md" />
            <select disabled title="ยังไม่เปิดใช้งาน" className="ml-auto cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <option>ประเภทเนื้อหา: ทั้งหมด</option>
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">หมวดหมู่หลัก</h2>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">ดูทั้งหมด</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {knowledgeCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">บทความแนะนำ (Featured)</h2>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">ดูทั้งหมด</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredArticles.map((article) => (
                <FeaturedCard key={article.id} article={article} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PopularArticlesCard />
            </div>
            <HowToGuidesCard />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <QuickLinksCard />
            <LatestUpdatesCard />
            <NeedHelpCard />
          </div>
        </div>
      )}
    </div>
  );
}
