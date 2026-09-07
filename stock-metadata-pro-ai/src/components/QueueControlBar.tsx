import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  XCircle,
  FileSpreadsheet,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sliders,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { StockAsset } from '../types';

interface QueueControlBarProps {
  assets: StockAsset[];
  isProcessing: boolean;
  isPaused: boolean;
  selectedCount: number;
  currentProcessingFilename: string | null;
  concurrency: number;
  onChangeConcurrency: (val: number) => void;
  onGenerateAll: () => void;
  onGenerateSelected: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryFailed: () => void;
  onOpenExportCsv: () => void;
  onOpenImportCsv: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClearAll?: () => void;
}

export const QueueControlBar: React.FC<QueueControlBarProps> = ({
  assets,
  isProcessing,
  isPaused,
  selectedCount,
  currentProcessingFilename,
  concurrency,
  onChangeConcurrency,
  onGenerateAll,
  onGenerateSelected,
  onPause,
  onResume,
  onCancel,
  onRetryFailed,
  onOpenExportCsv,
  onOpenImportCsv,
  onSelectAll,
  onDeselectAll,
  onClearAll,
}) => {
  const total = assets.length;
  const completed = assets.filter((a) => a.status === 'completed').length;
  const failed = assets.filter((a) => a.status === 'failed').length;
  const waiting = assets.filter((a) => a.status === 'waiting').length;
  const activeProcessing = assets.filter((a) => a.status === 'processing').length;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Main Processing Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isProcessing ? (
            <>
              <button
                type="button"
                disabled={total === 0}
                onClick={onGenerateAll}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                Generate All ({total})
              </button>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={onGenerateSelected}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  Generate Selected ({selectedCount})
                </button>
              )}

              {failed > 0 && (
                <button
                  type="button"
                  onClick={onRetryFailed}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Retry Failed ({failed})
                </button>
              )}
            </>
          ) : (
            <>
              {isPaused ? (
                <button
                  type="button"
                  onClick={onResume}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Resume Queue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPause}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
                >
                  <Pause className="w-4 h-4" />
                  Pause Queue
                </button>
              )}

              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs border border-rose-500/30 flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                Cancel Queue
              </button>
            </>
          )}

          {/* Quick Select & Clear Buttons */}
          {total > 0 && (
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={onSelectAll}
                className="px-2.5 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={onDeselectAll}
                className="px-2.5 py-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700/50 transition-colors"
                title="Deselect all items"
              >
                Deselect
              </button>
              {onClearAll && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={onClearAll}
                  className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center gap-1 transition-colors font-medium border border-transparent hover:border-rose-500/30"
                  title="Clear all assets from this batch"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right tools: Concurrency slider, CSV Import & Export */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Concurrency Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Workers:</span>
            <select
              value={concurrency}
              onChange={(e) => onChangeConcurrency(Number(e.target.value))}
              disabled={isProcessing}
              className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-cyan-300 px-1.5 py-0.5 focus:outline-none"
            >
              <option value={1}>1 Worker (Sequential)</option>
              <option value={2}>2 Parallel</option>
              <option value={3}>3 Parallel</option>
              <option value={4}>4 Parallel</option>
              <option value={5}>5 Parallel (Max)</option>
            </select>
          </div>

          {/* CSV Import */}
          <button
            type="button"
            onClick={onOpenImportCsv}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            disabled={completed === 0}
            onClick={onOpenExportCsv}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            Export CSV ({completed})
          </button>
        </div>
      </div>

      {/* Progress & Queue Status Bar */}
      {total > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white font-mono">
                {completed} / {total} completed ({percent}%)
              </span>
              {isProcessing && currentProcessingFilename && (
                <span className="text-cyan-400 font-mono flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[340px]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Analyzing: {currentProcessingFilename}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              {activeProcessing > 0 && (
                <span className="flex items-center gap-1 text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {activeProcessing} active
                </span>
              )}
              {waiting > 0 && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {waiting} waiting
                </span>
              )}
              {failed > 0 && (
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  {failed} failed
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar with multi-color segments */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${(completed / total) * 100}%` }}
            />
            <div
              className="bg-cyan-500 animate-pulse transition-all duration-300"
              style={{ width: `${(activeProcessing / total) * 100}%` }}
            />
            <div
              className="bg-rose-500 transition-all duration-300"
              style={{ width: `${(failed / total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
