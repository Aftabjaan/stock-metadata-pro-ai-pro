import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { importCsvApi } from '../utils/apiClient';
import { StockAsset, StockMetadata } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAssets: (assets: StockAsset[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportAssets,
}) => {
  const [csvText, setCsvText] = useState('');
  const [parseResult, setParseResult] = useState<any | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setCsvText(content);
      parseContent(content);
    };
    reader.readAsText(file);
  };

  const parseContent = async (text: string) => {
    if (!text.trim()) return;
    setIsParsing(true);
    setErrorMsg(null);
    try {
      const res = await importCsvApi(text);
      if (res.rows.length === 0) {
        setErrorMsg('No valid rows found. Please ensure the CSV includes a Filename column.');
        setParseResult(null);
      } else {
        setParseResult(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse CSV');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || !parseResult.rows) return;

    const newAssets: StockAsset[] = parseResult.rows.map((row: any, i: number) => {
      const meta: StockMetadata = {
        title: row.title || '',
        description: row.description || '',
        keywords: (row.keywords || []).map((k: string, idx: number) => ({
          word: k.toLowerCase().trim(),
          score: 80,
          priority: idx < 10 ? 'primary' : 'secondary',
        })),
        category: row.category || 'General',
        assetType: 'photo',
        orientation: 'horizontal',
        aiGenerated: false,
        seoScore: 80,
      };

      return {
        id: `csv-import-${Date.now()}-${i}`,
        originalFilename: row.originalFilename, // EXACT
        fileSize: 1024,
        mimeType: 'image/jpeg',
        status: row.title ? 'completed' : 'waiting',
        metadata: row.title ? meta : undefined,
        versions: [],
        uploadedAt: new Date().toISOString(),
      };
    });

    onImportAssets(newAssets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Existing Stock CSV</h3>
              <p className="text-xs text-slate-400">
                Load existing metadata rows or contributor spreadsheets
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

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* File Picker */}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-400/80 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/50 transition-colors"
          >
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-white">Click to choose CSV file</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Supports standard UTF-8 CSVs</div>
          </div>

          {/* Or Paste Raw Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Or Paste CSV Raw Content
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                parseContent(e.target.value);
              }}
              placeholder="Filename,Title,Keywords,Category&#10;123.jpg,A beautiful sunset,sunset, nature, sky,Landscapes"
              className="w-full text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Detected Columns & Sample Preview */}
          {parseResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully detected {parseResult.rows.length} records!
                </span>
                <span className="text-slate-500">
                  {parseResult.invalidRows} invalid rows skipped
                </span>
              </div>

              {/* Column Mapping Badges */}
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Filename: <strong>{parseResult.filenameCol || 'Detected'}</strong>
                </span>
                {parseResult.titleCol && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Title: <strong>{parseResult.titleCol}</strong>
                  </span>
                )}
                {parseResult.keywordsCol && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Keywords: <strong>{parseResult.keywordsCol}</strong>
                  </span>
                )}
              </div>

              {/* Sample First 2 Rows */}
              <div className="text-[11px] text-slate-300 space-y-1 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {parseResult.rows.slice(0, 2).map((r: any, idx: number) => (
                  <div key={idx} className="truncate">
                    <span className="text-cyan-400 font-bold">{r.originalFilename}</span> •{' '}
                    <span>{r.title || '(No title)'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            disabled={!parseResult || parseResult.rows.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            Import {parseResult?.rows?.length || 0} Assets
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
