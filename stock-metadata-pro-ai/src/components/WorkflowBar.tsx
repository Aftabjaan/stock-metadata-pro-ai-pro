import React from 'react';
import {
  Globe,
  SlidersHorizontal,
  Type,
  Tag,
  Cpu,
  Bot,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Marketplace, AssetType, TitleSettings, KeywordSettings, AIProvider } from '../types';
import { MARKETPLACE_PROFILES } from '../utils/platforms';

interface WorkflowBarProps {
  marketplace: Marketplace;
  onSelectMarketplace: (m: Marketplace) => void;
  assetType: AssetType;
  onSelectAssetType: (t: AssetType) => void;
  titleSettings: TitleSettings;
  onOpenTitleSettings: () => void;
  keywordSettings: KeywordSettings;
  onOpenKeywordSettings: () => void;
  aiGenerated: boolean;
  onToggleAiGenerated: (val: boolean) => void;
  provider: AIProvider;
  onSelectProvider: (p: AIProvider) => void;
  onOpenAdvanced: () => void;
}

export const WorkflowBar: React.FC<WorkflowBarProps> = ({
  marketplace,
  onSelectMarketplace,
  assetType,
  onSelectAssetType,
  titleSettings,
  onOpenTitleSettings,
  keywordSettings,
  onOpenKeywordSettings,
  aiGenerated,
  onToggleAiGenerated,
  provider,
  onSelectProvider,
  onOpenAdvanced,
}) => {
  const currentProfile = MARKETPLACE_PROFILES[marketplace] || MARKETPLACE_PROFILES.generic;

  const platforms: { id: Marketplace; label: string }[] = [
    { id: 'adobe', label: 'Adobe Stock' },
    { id: 'shutterstock', label: 'Shutterstock' },
    { id: 'freepik', label: 'Freepik' },
    { id: 'istock', label: 'iStock / Getty' },
    { id: 'generic', label: 'Generic Stock' },
  ];

  const assetTypes: { id: AssetType; label: string }[] = [
    { id: 'photo', label: 'Photo' },
    { id: 'vector', label: 'Vector' },
    { id: 'illustration', label: 'Illustration' },
    { id: '3d_render', label: '3D Render' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Top row: Platform Tabs & Quick Settings */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-3.5">
        {/* Marketplace Profiles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            Platform:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectMarketplace(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  marketplace === p.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider & Advanced Mode trigger */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
            <span className="px-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              Provider:
            </span>
            {(['auto', 'gemini', 'groq'] as AIProvider[]).map((pr) => (
              <button
                key={pr}
                type="button"
                onClick={() => onSelectProvider(pr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                  provider === pr
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenAdvanced}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Advanced processing & queue settings"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Second row: Asset Type, Title Settings Pill, Keyword Settings Pill, AI Generated flag */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Asset Type */}
        <div className="bg-slate-850/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Asset Type
          </span>
          <div className="flex items-center gap-1">
            {assetTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectAssetType(t.id)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  assetType === t.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dedicated Title Settings Trigger */}
        <button
          type="button"
          onClick={onOpenTitleSettings}
          className="bg-slate-850/90 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl p-2.5 flex items-center justify-between group transition-all text-left"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-blue-300">
                Title Formula
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                {titleSettings.mode.replace('_', ' ')} • {titleSettings.length}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            Edit
          </span>
        </button>

        {/* Dedicated Keyword Settings Trigger */}
        <button
          type="button"
          onClick={onOpenKeywordSettings}
          className="bg-slate-850/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-2.5 flex items-center justify-between group transition-all text-left"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                Keyword Formula
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                {keywordSettings.targetCount} tags • {keywordSettings.strategy}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Edit
          </span>
        </button>

        {/* AI-Generated Flag (Stock Requirement) */}
        <div className="bg-slate-850/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">AI Generated</div>
              <div className="text-[11px] text-slate-400">Platform declaration</div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => onToggleAiGenerated(false)}
              className={`px-2.5 py-0.5 rounded-md font-medium text-xs transition-all ${
                !aiGenerated ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => onToggleAiGenerated(true)}
              className={`px-2.5 py-0.5 rounded-md font-bold text-xs transition-all ${
                aiGenerated ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yes
            </button>
          </div>
        </div>
      </div>

      {/* Platform Active Guidance Banner */}
      <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-slate-300">{currentProfile.name}:</span>
          <span className="truncate">{currentProfile.rules[0]}</span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 shrink-0 ml-2">
          Max {currentProfile.maxKeywords} tags • Title max {currentProfile.titleMaxLength}c
        </span>
      </div>
    </div>
  );
};
