import React, { useState } from 'react';
import {
  Edit3,
  RotateCw,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Tag,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { StockAsset, AssetStatus } from '../types';

interface AssetTableProps {
  assets: StockAsset[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEditAsset: (asset: StockAsset) => void;
  onRegenerateAsset: (asset: StockAsset) => void;
  onDeleteAsset: (id: string) => void;
  isProcessing: boolean;
  onClearAll?: () => void;
  onDeleteSelected?: () => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onEditAsset,
  onRegenerateAsset,
  onDeleteAsset,
  isProcessing,
  onClearAll,
  onDeleteSelected,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [seoScoreFilter, setSeoScoreFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAssets = assets.filter((asset) => {
    // 1. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = asset.originalFilename.toLowerCase().includes(q);
      const matchTitle = asset.metadata?.title?.toLowerCase().includes(q);
      const matchDesc = asset.metadata?.description?.toLowerCase().includes(q);
      const matchCat = asset.metadata?.category?.toLowerCase().includes(q);
      const matchKw = asset.metadata?.keywords?.some((k) =>
        (typeof k === 'string' ? k : k.word).toLowerCase().includes(q)
      );

      if (!matchName && !matchTitle && !matchDesc && !matchCat && !matchKw) {
        return false;
      }
    }

    // 2. Status filter
    if (statusFilter !== 'all' && asset.status !== statusFilter) {
      return false;
    }

    // 3. SEO Score filter
    if (seoScoreFilter !== 'all') {
      const score = asset.metadata?.seoScore || 0;
      if (seoScoreFilter === '90' && score < 90) return false;
      if (seoScoreFilter === '70-89' && (score < 70 || score >= 90)) return false;
      if (seoScoreFilter === 'below-70' && score >= 70) return false;
    }

    return true;
  });

  const handleCopyKeywords = (asset: StockAsset) => {
    if (!asset.metadata?.keywords) return;
    const kwText = asset.metadata.keywords
      .map((k) => (typeof k === 'string' ? k : k.word))
      .join(', ');
    navigator.clipboard.writeText(kwText);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getSeoBadgeColor = (score?: number) => {
    if (score === undefined || score === 0) return 'bg-slate-800 text-slate-400 border-slate-700';
    if (score >= 90) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (score >= 75) return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    if (score >= 60) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  const getStatusBadge = (status: AssetStatus, error?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Analyzing
          </span>
        );
      case 'failed':
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30"
            title={error || 'Failed'}
          >
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3 h-3" />
            Waiting
          </span>
        );
    }
  };

  const allSelected =
    filteredAssets.length > 0 && filteredAssets.every((a) => selectedIds.has(a.id));

  return (
    <div className="space-y-3">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search filename, title, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-850 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 text-slate-200 border-none rounded text-xs py-0.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Ready</option>
              <option value="waiting">Waiting</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-850 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">SEO:</span>
            <select
              value={seoScoreFilter}
              onChange={(e) => setSeoScoreFilter(e.target.value)}
              className="bg-slate-900 text-slate-200 border-none rounded text-xs py-0.5 focus:outline-none"
            >
              <option value="all">All Scores</option>
              <option value="90">90+ (Excellent)</option>
              <option value="70-89">70 - 89 (Good)</option>
              <option value="below-70">&lt; 70 (Needs Work)</option>
            </select>
          </div>

          <div className="text-xs font-mono text-slate-400 pl-2">
            Showing <strong className="text-white">{filteredAssets.length}</strong> of {assets.length}
          </div>

          {/* Action buttons: Delete Selected & Clear All */}
          {selectedIds.size > 0 && onDeleteSelected && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={onDeleteSelected}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Delete only selected assets"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Delete Selected ({selectedIds.size})
            </button>
          )}

          {assets.length > 0 && onClearAll && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClearAll}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Clear all assets from this project"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No matching assets found</p>
          <p className="text-xs text-slate-500">
            {assets.length === 0
              ? 'Upload your stock images above to begin generating high-converting metadata.'
              : 'Try clearing your search query or adjusting your filters.'}
          </p>
        </div>
      )}

      {/* Desktop Table View */}
      {filteredAssets.length > 0 && (
        <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => (e.target.checked ? onSelectAll() : onDeselectAll())}
                    className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
                  />
                </th>
                <th className="py-3 px-3 w-16">Preview</th>
                <th className="py-3 px-4 w-60">
                  Original Filename
                  <span className="block text-[10px] font-normal text-cyan-400/80 lowercase">
                    immutable source
                  </span>
                </th>
                <th className="py-3 px-4">Title & Metadata Preview</th>
                <th className="py-3 px-3 w-28 text-center">Tags</th>
                <th className="py-3 px-3 w-24 text-center">SEO Score</th>
                <th className="py-3 px-3 w-24 text-center">Status</th>
                <th className="py-3 px-4 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.map((asset) => {
                const isSelected = selectedIds.has(asset.id);
                const meta = asset.metadata;

                return (
                  <tr
                    key={asset.id}
                    className={`hover:bg-slate-850/60 transition-colors ${
                      isSelected ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    {/* Select Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(asset.id)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20 cursor-pointer"
                      />
                    </td>

                    {/* Thumbnail */}
                    <td className="py-3 px-3">
                      <div
                        onClick={() => onEditAsset(asset)}
                        className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all flex items-center justify-center shrink-0"
                      >
                        {asset.thumbnailUrl ? (
                          <img
                            src={asset.thumbnailUrl}
                            alt={asset.originalFilename}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-[10px] text-slate-500">No img</div>
                        )}
                      </div>
                    </td>

                    {/* STRICT ORIGINAL FILENAME */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-200 truncate max-w-[240px]">
                      <div className="flex items-center gap-1.5" title={asset.originalFilename}>
                        <span className="truncate">{asset.originalFilename}</span>
                      </div>
                      <span className="text-[10px] font-normal text-slate-500 font-sans block">
                        {(asset.fileSize / 1024).toFixed(0)} KB • {asset.mimeType?.replace('image/', '')}
                      </span>
                    </td>

                    {/* Title & Metadata Preview */}
                    <td className="py-3 px-4">
                      {meta?.title ? (
                        <div className="space-y-1">
                          <div
                            onClick={() => onEditAsset(asset)}
                            className="text-slate-100 font-semibold line-clamp-1 hover:text-blue-300 cursor-pointer"
                            title={meta.title}
                          >
                            {meta.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            {meta.category && (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                                {meta.category}
                              </span>
                            )}
                            {meta.aiGenerated && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                AI
                              </span>
                            )}
                            <span className="text-slate-500 capitalize">{meta.assetType}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No metadata generated yet</span>
                      )}
                    </td>

                    {/* Keywords Count & Quick Copy */}
                    <td className="py-3 px-3 text-center">
                      {meta?.keywords && meta.keywords.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleCopyKeywords(asset)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
                          title="Click to copy all tags to clipboard"
                        >
                          <Tag className="w-3 h-3 text-emerald-400" />
                          {meta.keywords.length} tags
                          {copiedId === asset.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* SEO Score Gauge */}
                    <td className="py-3 px-3 text-center">
                      {meta?.seoScore !== undefined ? (
                        <span
                          className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded-full border ${getSeoBadgeColor(
                            meta.seoScore
                          )}`}
                          title={`SEO Score: ${meta.seoScore}/100 (${meta.seoBreakdown?.grade || 'Calculated'})`}
                        >
                          {meta.seoScore}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(asset.status, asset.errorMessage)}
                    </td>

                    {/* Row Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditAsset(asset)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-700 transition-colors"
                          title="Review and Edit Metadata"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onRegenerateAsset(asset)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors disabled:opacity-40"
                          title="Regenerate with AI"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAsset(asset.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 hover:text-rose-300 text-slate-400 border border-slate-700 transition-colors"
                          title="Remove asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Touch Cards View */}
      {filteredAssets.length > 0 && (
        <div className="lg:hidden space-y-3">
          {filteredAssets.map((asset) => {
            const isSelected = selectedIds.has(asset.id);
            const meta = asset.metadata;

            return (
              <div
                key={asset.id}
                className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition-all ${
                  isSelected ? 'border-blue-500/70 bg-blue-500/5' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(asset.id)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-500 mt-1 cursor-pointer"
                  />

                  {/* Thumbnail */}
                  <div
                    onClick={() => onEditAsset(asset)}
                    className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0 cursor-pointer"
                  >
                    {asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.originalFilename}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                        No img
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {asset.originalFilename}
                      </span>
                      {getStatusBadge(asset.status, asset.errorMessage)}
                    </div>

                    {meta?.title ? (
                      <p className="text-xs text-slate-200 font-medium line-clamp-2">{meta.title}</p>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Pending analysis</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {meta?.seoScore !== undefined && (
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${getSeoBadgeColor(
                            meta.seoScore
                          )}`}
                        >
                          SEO {meta.seoScore}
                        </span>
                      )}
                      {meta?.keywords && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {meta.keywords.length} tags
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-2.5">
                  <button
                    type="button"
                    onClick={() => onEditAsset(asset)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Review & Edit
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onRegenerateAsset(asset)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
