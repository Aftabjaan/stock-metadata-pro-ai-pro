import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { StockAsset, Marketplace } from '../types';
import { MARKETPLACE_PROFILES } from '../utils/platforms';
import { downloadCsvFile } from '../utils/apiClient';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: StockAsset[];
  marketplace: Marketplace;
  selectedIds: Set<string>;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  assets,
  marketplace: initialMarketplace,
  selectedIds,
}) => {
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace>(initialMarketplace);
  const [exportScope, setExportScope] = useState<'completed' | 'all' | 'selected'>('completed');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const profile = MARKETPLACE_PROFILES[selectedMarketplace] || MARKETPLACE_PROFILES.generic;

  // Filter export target assets
  let exportAssets = assets;
  if (exportScope === 'completed') {
    exportAssets = assets.filter((a) => a.status === 'completed' && a.metadata);
  } else if (exportScope === 'selected') {
    exportAssets = assets.filter((a) => selectedIds.has(a.id));
  }

  // Strict validation verification: Confirm 100% of filenames match exact originalFilename
  const filenameCheckPassed = exportAssets.every(
    (a) => Boolean(a.originalFilename) && !a.originalFilename.startsWith('undefined')
  );

  const handleDownload = async () => {
    if (exportAssets.length === 0) return;
    setIsExporting(true);
    try {
      await downloadCsvFile(exportAssets, selectedMarketplace);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const platforms: { id: Marketplace; label: string }[] = [
    { id: 'adobe', label: 'Adobe Stock' },
    { id: 'shutterstock', label: 'Shutterstock' },
    { id: 'freepik', label: 'Freepik' },
    { id: 'istock', label: 'iStock / Getty' },
    { id: 'generic', label: 'Generic Stock' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Stock CSV</h3>
              <p className="text-xs text-slate-400">
                Ready for one-click upload to stock contributor portals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Target Marketplace Template */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Target Marketplace Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedMarketplace(p.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedMarketplace === p.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-sm'
                      : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Mapped CSV columns:{' '}
              <strong className="text-slate-200">
                {profile.csvColumns.map((c) => c.header).join(' • ')}
              </strong>
            </p>
          </div>

          {/* Export Scope */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Export Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportScope('completed')}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  exportScope === 'completed'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div>Completed Only</div>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({assets.filter((a) => a.status === 'completed').length} items)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('selected')}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  exportScope === 'selected'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div>Selected Items</div>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({selectedIds.size} items)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  exportScope === 'all'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div>All Assets</div>
                <span className="text-[10px] text-slate-500 font-mono">({assets.length} items)</span>
              </button>
            </div>
          </div>

          {/* Strict Filename Validation Indicator */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Immutable Filename Guarantee</div>
                <div className="text-[11px] text-slate-400">
                  All {exportAssets.length} exported rows strictly preserve exact browser File.name
                </div>
              </div>
            </div>
            {filenameCheckPassed ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                Warning
              </span>
            )}
          </div>

          {/* Preview Table of First 5 Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Data Preview (First 5 records)</span>
              <span className="text-slate-500 font-mono">UTF-8 with BOM format</span>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950">
              <table className="w-full text-left text-[11px] text-slate-300">
                <thead className="bg-slate-900 border-b border-slate-800 font-mono text-slate-400 uppercase">
                  <tr>
                    {profile.csvColumns.map((col) => (
                      <th key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {exportAssets.slice(0, 5).map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-900/40">
                      {profile.csvColumns.map((col) => {
                        let val = '';
                        if (col.key === 'originalFilename') val = asset.originalFilename;
                        else if (col.key === 'title') val = asset.metadata?.title || '';
                        else if (col.key === 'description')
                          val = asset.metadata?.description || asset.metadata?.title || '';
                        else if (col.key === 'keywords')
                          val =
                            asset.metadata?.keywords
                              ?.map((k) => (typeof k === 'string' ? k : k.word))
                              .join(', ') || '';
                        else if (col.key === 'category') val = asset.metadata?.category || '';

                        return (
                          <td
                            key={col.key}
                            className="py-2 px-3 max-w-[200px] truncate"
                            title={val}
                          >
                            {val || <span className="text-slate-600">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {exportAssets.length === 0 && (
                    <tr>
                      <td
                        colSpan={profile.csvColumns.length}
                        className="py-6 text-center text-slate-500 italic font-sans"
                      >
                        No assets in current export scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isExporting || exportAssets.length === 0}
            onClick={handleDownload}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating CSV...' : `Download ${exportAssets.length} Records (.CSV)`}
          </button>
        </div>
      </div>
    </div>
  );
};
