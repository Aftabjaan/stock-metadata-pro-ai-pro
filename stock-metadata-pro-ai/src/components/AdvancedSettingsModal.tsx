import React, { useState } from 'react';
import { SlidersHorizontal, Check, X, Cpu, RefreshCw, Zap } from 'lucide-react';
import { ProcessingSettings, AIProvider } from '../types';

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProcessingSettings;
  onSave: (settings: ProcessingSettings) => void;
}

export const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [preferredProvider, setPreferredProvider] = useState<AIProvider>(
    settings.preferredProvider || 'auto'
  );
  const [concurrency, setConcurrency] = useState<number>(settings.concurrency || 3);
  const [geminiModel, setGeminiModel] = useState<string>(
    settings.geminiModel || 'gemini-3.8-flash'
  );
  const [groqModel, setGroqModel] = useState<string>(
    settings.groqModel || 'llama-3.2-11b-vision-preview'
  );
  const [retryCount, setRetryCount] = useState<number>(settings.retryCount || 2);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      preferredProvider,
      concurrency,
      geminiModel: geminiModel.trim() || 'gemini-3.8-flash',
      groqModel: groqModel.trim() || 'llama-3.2-11b-vision-preview',
      retryCount,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Advanced Processing Engine</h3>
              <p className="text-xs text-slate-400">Concurrency, model identifiers & retry policies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Preferred AI Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'gemini', 'groq'] as AIProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreferredProvider(p)}
                  className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                    preferredProvider === p
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 shadow-sm'
                      : 'border-slate-800 bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {p === 'auto' ? 'Auto (Fallback)' : p}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Auto attempts Gemini first, falling back to Groq if rate-limited.
            </p>
          </div>

          {/* Model Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Gemini Vision Model</label>
              <input
                type="text"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                placeholder="gemini-3.8-flash"
                className="w-full text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Groq Vision Model</label>
              <input
                type="text"
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                placeholder="llama-3.2-11b-vision-preview"
                className="w-full text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>
          </div>

          {/* Concurrency & Retry Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Parallel Workers</span>
                <span className="font-mono text-cyan-400 font-bold">{concurrency}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Rate-limit Retries</span>
                <span className="font-mono text-cyan-400 font-bold">{retryCount} attempts</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                value={retryCount}
                onChange={(e) => setRetryCount(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
