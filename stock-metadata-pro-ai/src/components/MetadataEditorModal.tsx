import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Tag,
  Type,
  AlignLeft,
  Layers,
  History,
  AlertCircle,
  Copy,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StockAsset, StockMetadata, KeywordItem, Marketplace, MetadataVersion } from '../types';
import { MARKETPLACE_PROFILES } from '../utils/platforms';
import { calculateSeoScore } from '../utils/seoEngine';
import { requestOptimizeTitle, requestOptimizeDescription } from '../utils/apiClient';

interface MetadataEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: StockAsset | null;
  marketplace: Marketplace;
  onSaveAsset: (updated: StockAsset) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const MetadataEditorModal: React.FC<MetadataEditorModalProps> = ({
  isOpen,
  onClose,
  asset,
  marketplace,
  onSaveAsset,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  if (!isOpen || !asset) return null;

  const profile = MARKETPLACE_PROFILES[marketplace] || MARKETPLACE_PROFILES.generic;

  // Local working copy of metadata
  const [metadata, setMetadata] = useState<StockMetadata>(
    asset.metadata || {
      title: '',
      description: '',
      keywords: [],
      category: profile.allowedCategories[0] || 'General',
      assetType: 'photo',
      orientation: 'horizontal',
      aiGenerated: false,
      seoScore: 0,
    }
  );

  const [activeTab, setActiveTab] = useState<'edit' | 'seo' | 'history'>('edit');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'primary' | 'secondary' | 'supporting'>('all');
  const [copiedKeywords, setCopiedKeywords] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Optimizer modal states
  const [optimizingTitle, setOptimizingTitle] = useState(false);
  const [titleDiff, setTitleDiff] = useState<{ current: string; candidate: string } | null>(null);

  const [optimizingDesc, setOptimizingDesc] = useState(false);
  const [descDiff, setDescDiff] = useState<{ current: string; candidate: string } | null>(null);

  // Sync state whenever the selected asset changes
  useEffect(() => {
    if (asset?.metadata) {
      setMetadata(asset.metadata);
    } else {
      setMetadata({
        title: '',
        description: '',
        keywords: [],
        category: profile.allowedCategories[0] || 'General',
        assetType: 'photo',
        orientation: 'horizontal',
        aiGenerated: false,
        seoScore: 0,
      });
    }
    setTitleDiff(null);
    setDescDiff(null);
  }, [asset?.id, profile]);

  // Recalculate live SEO score on metadata changes
  const liveSeo = calculateSeoScore(metadata, marketplace);

  // Auto-save updates to parent
  const commitMetadataChange = (updatedMeta: StockMetadata) => {
    setSaveStatus('saving');
    const enriched: StockMetadata = {
      ...updatedMeta,
      seoScore: liveSeo.score,
      seoBreakdown: liveSeo,
    };
    setMetadata(enriched);

    // Save version history entry if significant change
    const newVersions: MetadataVersion[] = [...(asset.versions || [])];
    if (newVersions.length === 0 || newVersions[newVersions.length - 1].title !== enriched.title) {
      newVersions.push({
        versionNumber: newVersions.length + 1,
        timestamp: new Date().toISOString(),
        title: enriched.title,
        description: enriched.description,
        keywords: enriched.keywords,
        category: enriched.category,
        seoScore: enriched.seoScore,
      });
    }

    const updatedAsset: StockAsset = {
      ...asset,
      metadata: enriched,
      versions: newVersions,
      status: 'completed',
    };

    onSaveAsset(updatedAsset);
    setTimeout(() => setSaveStatus('saved'), 400);
  };

  // Add new keyword(s)
  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return;

    const parts = newKeywordInput
      .split(/[,;\n]/)
      .map((p) => p.trim().toLowerCase())
      .filter((p) => p.length >= 2);

    const currentWords = new Set(
      metadata.keywords.map((k) => (typeof k === 'string' ? k : k.word.toLowerCase()))
    );
    const additions: KeywordItem[] = [];

    for (const p of parts) {
      if (!currentWords.has(p) && metadata.keywords.length + additions.length < profile.maxKeywords) {
        currentWords.add(p);
        additions.push({
          word: p,
          score: 85,
          priority: metadata.keywords.length + additions.length < 10 ? 'primary' : 'secondary',
        });
      }
    }

    if (additions.length > 0) {
      const updated = {
        ...metadata,
        keywords: [...metadata.keywords, ...additions],
      };
      commitMetadataChange(updated);
      setNewKeywordInput('');
    }
  };

  // Remove keyword
  const handleRemoveKeyword = (indexToRemove: number) => {
    const updatedKeywords = metadata.keywords.filter((_, i) => i !== indexToRemove);
    commitMetadataChange({ ...metadata, keywords: updatedKeywords });
  };

  // Update keyword priority
  const handleUpdatePriority = (index: number, priority: 'primary' | 'secondary' | 'supporting') => {
    const updatedKeywords = metadata.keywords.map((k, i) =>
      i === index ? { ...k, priority } : k
    );
    commitMetadataChange({ ...metadata, keywords: updatedKeywords });
  };

  // Copy all keywords
  const handleCopyAllKeywords = () => {
    const text = metadata.keywords.map((k) => (typeof k === 'string' ? k : k.word)).join(', ');
    navigator.clipboard.writeText(text);
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 1800);
  };

  // Quick Title Optimizer
  const handleOptimizeTitle = async () => {
    if (!metadata.title) return;
    setOptimizingTitle(true);
    try {
      const kwList = metadata.keywords.map((k) => (typeof k === 'string' ? k : k.word));
      const optimized = await requestOptimizeTitle(metadata.title, {
        category: metadata.category,
        keywords: kwList,
        marketplace,
      });
      setTitleDiff({ current: metadata.title, candidate: optimized });
    } catch (err: any) {
      alert(err.message || 'Title optimization failed');
    } finally {
      setOptimizingTitle(false);
    }
  };

  // Quick Description Optimizer
  const handleOptimizeDescription = async () => {
    if (!metadata.description && !metadata.title) return;
    setOptimizingDesc(true);
    try {
      const optimized = await requestOptimizeDescription(
        metadata.description || metadata.title,
        metadata.title
      );
      setDescDiff({ current: metadata.description || '', candidate: optimized });
    } catch (err: any) {
      alert(err.message || 'Description optimization failed');
    } finally {
      setOptimizingDesc(false);
    }
  };

  // Restore previous version
  const handleRestoreVersion = (ver: MetadataVersion) => {
    const restored: StockMetadata = {
      title: ver.title,
      description: ver.description,
      keywords: ver.keywords,
      category: ver.category,
      assetType: metadata.assetType,
      orientation: metadata.orientation,
      aiGenerated: metadata.aiGenerated,
      seoScore: ver.seoScore,
    };
    commitMetadataChange(restored);
  };

  const filteredKeywords = metadata.keywords.filter((k) => {
    if (keywordFilter === 'all') return true;
    return k.priority === keywordFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
          {/* Filename & Navigation */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Prev / Next Asset Navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={onPrev}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                title="Previous asset"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={onNext}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                title="Next asset"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white truncate">
                  {asset.originalFilename}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {profile.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Exact browser original filename is strictly preserved
              </p>
            </div>
          </div>

          {/* Right: Save Indicator, SEO Score Pill & Close */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono transition-opacity flex items-center gap-1 ${
                saveStatus === 'saving' ? 'text-amber-400 opacity-100' : 'text-slate-500 opacity-80'
              }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  Auto-saved
                </>
              )}
            </span>

            {/* Live SEO Score Gauge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-xs text-slate-400 font-medium">SEO:</span>
              <span
                className={`font-mono text-xs font-bold ${
                  liveSeo.score >= 90
                    ? 'text-emerald-400'
                    : liveSeo.score >= 75
                    ? 'text-cyan-400'
                    : 'text-amber-400'
                }`}
              >
                {liveSeo.score}/100
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('edit')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'edit'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Metadata Editor
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'seo'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            SEO Diagnostics ({liveSeo.score}%)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Version History ({asset.versions?.length || 1})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'edit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Preview & Classifications (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center p-2 relative group">
                  {asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.originalFilename}
                      className="w-full max-h-72 object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-600 text-xs">
                      No preview available
                    </div>
                  )}
                  <span className="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-300 border border-white/10">
                    {metadata.orientation}
                  </span>
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Stock Category ({profile.name})
                  </label>
                  <select
                    value={metadata.category}
                    onChange={(e) => commitMetadataChange({ ...metadata, category: e.target.value })}
                    className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700/80 p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {profile.allowedCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asset Type & Orientation */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Asset Type
                    </label>
                    <select
                      value={metadata.assetType}
                      onChange={(e) =>
                        commitMetadataChange({ ...metadata, assetType: e.target.value as any })
                      }
                      className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700/80 p-2 text-slate-200 focus:outline-none"
                    >
                      <option value="photo">Photo</option>
                      <option value="vector">Vector</option>
                      <option value="illustration">Illustration</option>
                      <option value="3d_render">3D Render</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Orientation
                    </label>
                    <select
                      value={metadata.orientation}
                      onChange={(e) =>
                        commitMetadataChange({ ...metadata, orientation: e.target.value as any })
                      }
                      className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700/80 p-2 text-slate-200 focus:outline-none"
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                      <option value="square">Square</option>
                      <option value="panoramic">Panoramic</option>
                    </select>
                  </div>
                </div>

                {/* AI Generated Flag */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">AI Generated Asset</div>
                    <div className="text-[11px] text-slate-500">Marketplace requirement</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={metadata.aiGenerated}
                    onChange={(e) =>
                      commitMetadataChange({ ...metadata, aiGenerated: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500/30 cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Column: Title, Description, Keyword Chips (8 cols) */}
              <div className="lg:col-span-8 space-y-5">
                {/* Title Editor with Quick Optimizer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-blue-400" />
                      Stock Title
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono ${
                          metadata.title.length > profile.titleMaxLength
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {metadata.title.length} / {profile.titleMaxLength} chars
                      </span>
                      <button
                        type="button"
                        disabled={optimizingTitle || !metadata.title}
                        onClick={handleOptimizeTitle}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[11px] font-bold border border-blue-500/30 flex items-center gap-1 transition-colors disabled:opacity-40"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-300" />
                        {optimizingTitle ? 'Optimizing...' : 'Optimize Title'}
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => commitMetadataChange({ ...metadata, title: e.target.value })}
                    className="w-full text-sm font-semibold rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter descriptive, non-spammy stock title..."
                  />

                  {/* Title Diff Candidate Modal/Bar */}
                  {titleDiff && (
                    <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 space-y-2 animate-in fade-in">
                      <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Title Optimization Suggestion:
                      </div>
                      <p className="text-xs text-white font-medium bg-slate-950/80 p-2.5 rounded-lg border border-blue-500/20">
                        {titleDiff.candidate}
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setTitleDiff(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            commitMetadataChange({ ...metadata, title: titleDiff.candidate });
                            setTitleDiff(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                        >
                          Apply Optimized Title
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description Editor with Quick Optimizer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
                      Stock Description / Caption
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {metadata.description.length} chars
                      </span>
                      <button
                        type="button"
                        disabled={optimizingDesc}
                        onClick={handleOptimizeDescription}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 flex items-center gap-1 transition-colors disabled:opacity-40"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-300" />
                        {optimizingDesc ? 'Optimizing...' : 'Optimize Description'}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={metadata.description}
                    onChange={(e) =>
                      commitMetadataChange({ ...metadata, description: e.target.value })
                    }
                    className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Enter natural 1-2 sentence stock description..."
                  />

                  {/* Description Diff Candidate */}
                  {descDiff && (
                    <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 space-y-2 animate-in fade-in">
                      <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Description Optimization Suggestion:
                      </div>
                      <p className="text-xs text-white font-medium bg-slate-950/80 p-2.5 rounded-lg border border-indigo-500/20">
                        {descDiff.candidate}
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setDescDiff(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            commitMetadataChange({
                              ...metadata,
                              description: descDiff.candidate,
                            });
                            setDescDiff(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
                        >
                          Apply Optimized Description
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Keywords Header & Controls */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Keywords ({metadata.keywords.length} / {profile.maxKeywords})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority Filters */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                        {(['all', 'primary', 'secondary', 'supporting'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setKeywordFilter(filter)}
                            className={`px-2 py-0.5 rounded capitalize font-medium transition-all ${
                              keywordFilter === filter
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>

                      {/* Copy All Tags */}
                      <button
                        type="button"
                        onClick={handleCopyAllKeywords}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold border border-slate-700 flex items-center gap-1"
                      >
                        {copiedKeywords ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" /> Copy All
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Add Keyword Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      placeholder="Add tag (type word and press Enter or comma)..."
                      className="flex-1 text-xs rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Tag
                    </button>
                  </div>

                  {/* Keyword Chips Grid */}
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    {filteredKeywords.map((kw, index) => {
                      const word = typeof kw === 'string' ? kw : kw.word;
                      const score = typeof kw === 'object' ? kw.score : 80;
                      const priority = typeof kw === 'object' ? kw.priority : 'secondary';

                      const priorityColor =
                        priority === 'primary'
                          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                          : priority === 'secondary'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-purple-500/40 bg-purple-500/10 text-purple-300';

                      return (
                        <div
                          key={`${word}-${index}`}
                          className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all ${priorityColor}`}
                        >
                          <span className="font-medium text-slate-100">{word}</span>

                          {/* Relevance score pill */}
                          <span className="text-[10px] font-mono opacity-75 font-semibold">
                            {score}
                          </span>

                          {/* Quick priority switcher */}
                          <button
                            type="button"
                            onClick={() => {
                              const next =
                                priority === 'primary'
                                  ? 'secondary'
                                  : priority === 'secondary'
                                  ? 'supporting'
                                  : 'primary';
                              handleUpdatePriority(index, next);
                            }}
                            className="text-[9px] uppercase font-bold opacity-60 hover:opacity-100 px-1 py-0.2 rounded bg-black/40 hover:bg-black/60"
                            title="Click to cycle priority (Primary > Secondary > Supporting)"
                          >
                            {priority[0]}
                          </button>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(index)}
                            className="text-slate-400 hover:text-rose-400 opacity-60 group-hover:opacity-100 p-0.5 rounded transition-colors"
                            title="Delete keyword"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {filteredKeywords.length === 0 && (
                      <div className="py-6 text-center w-full text-slate-500 text-xs italic">
                        No keywords in this category.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: SEO Diagnostics */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* Score Card Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-mono font-black text-2xl shadow-xl ${
                      liveSeo.score >= 90
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : liveSeo.score >= 75
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {liveSeo.score}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{liveSeo.grade} Stock Rating</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                        Target: {profile.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Evaluated against real microstock search algorithms (length, primary weighting,
                      taxonomy, non-spam compliance).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Keywords</span>
                    <strong className="text-sm text-white font-mono">
                      {metadata.keywords.length} / {profile.maxKeywords}
                    </strong>
                  </div>
                  <div className="text-right border-l border-slate-800 pl-3">
                    <span className="text-xs text-slate-400 block">Title Length</span>
                    <strong className="text-sm text-white font-mono">
                      {metadata.title.length} / {profile.titleMaxLength}c
                    </strong>
                  </div>
                </div>
              </div>

              {/* Checks Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Algorithmic Ranking Checks
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {liveSeo.checks.map((check, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                        check.passed
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-amber-500/30 bg-amber-500/5'
                      }`}
                    >
                      {check.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            check.passed ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {check.label}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{check.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {liveSeo.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Recommended Actions to Boost Ranking:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {liveSeo.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Version History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Every AI generation or manual save creates a timestamped version snapshot. You can
                preview or restore any prior version.
              </p>

              <div className="space-y-3">
                {(asset.versions || []).map((ver) => (
                  <div
                    key={ver.versionNumber}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          Version {ver.versionNumber}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ver.timestamp).toLocaleTimeString()} •{' '}
                          {new Date(ver.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                          SEO: {ver.seoScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium line-clamp-1">{ver.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {ver.keywords.length} keywords • Category: {ver.category}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreVersion(ver)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5" />
                      Restore Version {ver.versionNumber}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">ESC</kbd> or click Close when finished.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            Done Editing
          </button>
        </div>
      </div>
    </div>
  );
};
