import React from 'react';
import {
  Sparkles,
  Layers,
  Key,
  FolderKanban,
  Search,
  BookOpen,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Project, ApiKeyEntry } from '../types';

interface NavbarProps {
  currentProject: Project;
  onOpenProjects: () => void;
  onOpenKeys: () => void;
  onOpenRules: () => void;
  activeView: 'generator' | 'seo-finder';
  setActiveView: (view: 'generator' | 'seo-finder') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  apiKeys: ApiKeyEntry[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  onOpenProjects,
  onOpenKeys,
  onOpenRules,
  activeView,
  setActiveView,
  theme,
  toggleTheme,
  apiKeys,
}) => {
  const activeKeysCount = apiKeys.filter((k) => k.enabled).length;

  // Calculate project average SEO score
  const completedItems = currentProject.items.filter((i) => i.status === 'completed' && i.metadata);
  const avgSeo = completedItems.length > 0
    ? Math.round(
        completedItems.reduce((acc, item) => acc + (item.metadata?.seoScore || 0), 0) /
          completedItems.length
      )
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg sm:text-xl text-white">
                STOCK METADATA <span className="text-cyan-400">PRO AI</span>
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                v2.4 Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Accurate Stock Titles, Descriptions & SEO Keywords
            </p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveView('generator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'generator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Batch Generator
          </button>
          <button
            onClick={() => setActiveView('seo-finder')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'seo-finder'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            SEO Keyword Tool
          </button>
          <button
            onClick={onOpenRules}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Marketplace Rules
          </button>
        </nav>

        {/* Right Tools: Project, Keys, Theme */}
        <div className="flex items-center gap-2.5">
          {/* Average SEO Score Badge */}
          {avgSeo !== null && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Avg SEO: </span>
              <strong className="font-bold">{avgSeo}/100</strong>
            </div>
          )}

          {/* Project Switcher */}
          <button
            onClick={onOpenProjects}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 transition-colors"
            title="Manage and switch projects"
          >
            <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[110px] truncate font-semibold">{currentProject.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
              {currentProject.items.length}
            </span>
          </button>

          {/* API Keys Manager */}
          <button
            onClick={onOpenKeys}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 transition-colors"
            title="Manage Gemini & Groq API keys"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">API Keys</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                activeKeysCount > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {activeKeysCount}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
