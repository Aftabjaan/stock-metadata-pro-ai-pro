import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  AlertCircle,
  FileCheck,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { processUploadedFile } from '../utils/imageUtils';
import { StockAsset } from '../types';

interface UploadZoneProps {
  onAddAssets: (assets: StockAsset[]) => void;
  existingFilenames: Set<string>;
  totalAssetsCount: number;
  onClearAll: () => void;
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB per file

export const UploadZone: React.FC<UploadZoneProps> = ({
  onAddAssets,
  existingFilenames,
  totalAssetsCount,
  onClearAll,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLoading(true);
    setErrorMessage(null);
    setDuplicateWarning(null);

    const newAssets: StockAsset[] = [];
    const duplicatesFound: string[] = [];
    const errors: string[] = [];

    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      // 1. Validate extension & mime
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": Unsupported format. Only JPG, PNG, and WEBP are supported.`);
        continue;
      }

      // 2. Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}": File exceeds 50MB limit.`);
        continue;
      }

      // 3. Duplicate check
      if (existingFilenames.has(file.name)) {
        duplicatesFound.push(file.name);
      }

      try {
        const processed = await processUploadedFile(file);

        // STRICT REQUIREMENT: originalFilename MUST equal EXACT browser File.name
        const newAsset: StockAsset = {
          id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          originalFilename: processed.originalFilename, // EXACT file.name
          fileSize: processed.fileSize,
          mimeType: processed.mimeType,
          thumbnailUrl: processed.thumbnailUrl,
          versions: [],
          status: 'waiting',
          uploadedAt: new Date().toISOString(),
        };

        // Cache the optimized AI base64 string on the object for queue dispatch without storing raw image buffer
        (newAsset as any)._aiBase64 = processed.aiBase64;

        newAssets.push(newAsset);
      } catch (err: any) {
        errors.push(`"${file.name}": ${err.message || 'Corrupted or unreadable image'}`);
      }
    }

    setLoading(false);

    if (errors.length > 0) {
      setErrorMessage(errors.slice(0, 3).join(' • ') + (errors.length > 3 ? ` (+${errors.length - 3} more)` : ''));
    }

    if (duplicatesFound.length > 0) {
      setDuplicateWarning(duplicatesFound);
    }

    if (newAssets.length > 0) {
      onAddAssets(newAssets);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Main Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-blue-400 bg-blue-500/15 shadow-xl shadow-blue-500/10'
            : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-850/70'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/30 border border-blue-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Drag & Drop stock images here, or <span className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-4">Browse Files</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Supports <strong className="text-slate-200">JPG, JPEG, PNG, WEBP</strong> batches (1 to 500+ items).
              Filenames are preserved 100% strictly as uploaded.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Preserves Exact File.name
            </span>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Client-Side Fast Thumbnails
            </span>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Max 50MB per file
            </span>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 text-cyan-400 font-semibold text-sm">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Analyzing files & generating memory-safe thumbnails...
          </div>
        )}
      </div>

      {/* Batch Assets Status Bar with Clear All Button */}
      {totalAssetsCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs shadow-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-semibold">{totalAssetsCount}</strong> {totalAssetsCount === 1 ? 'image' : 'images'} in current batch
            </span>
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            title="Clear all images from current batch"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            Clear All ({totalAssetsCount})
          </button>
        </div>
      )}

      {/* Duplicate detection warning */}
      {duplicateWarning && duplicateWarning.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Possible duplicate filename detected: </strong>
              <span>
                {duplicateWarning.slice(0, 3).join(', ')}
                {duplicateWarning.length > 3 ? ` and ${duplicateWarning.length - 3} more` : ''}.
              </span>
              <span className="text-amber-400/80 block mt-0.5">Files added to queue. You can inspect or remove duplicates in the table.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDuplicateWarning(null)}
            className="text-amber-400/80 hover:text-amber-200 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Validation Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
