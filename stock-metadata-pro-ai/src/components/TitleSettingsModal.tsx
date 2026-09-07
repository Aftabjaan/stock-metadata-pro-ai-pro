import React, { useState } from 'react';
import { Type, Check, X, Sparkles, Info } from 'lucide-react';
import { TitleSettings, TitleMode, TitleLength } from '../types';

interface TitleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleSettings: TitleSettings;
  onSave: (settings: TitleSettings) => void;
}

export const TitleSettingsModal: React.FC<TitleSettingsModalProps> = ({
  isOpen,
  onClose,
  titleSettings,
  onSave,
}) => {
  const [mode, setMode] = useState<TitleMode>(titleSettings.mode);
  const [length, setLength] = useState<TitleLength>(titleSettings.length);
  const [customMaxLength, setCustomMaxLength] = useState<number>(titleSettings.customMaxLength || 120);
  const [customPrompt, setCustomPrompt] = useState<string>(titleSettings.customPrompt || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      mode,
      length,
      customMaxLength: length === 'custom' ? customMaxLength : undefined,
      customPrompt: mode === 'custom' || customPrompt ? customPrompt : undefined,
    });
    onClose();
  };

  const titleModes: { id: TitleMode; label: string; desc: string; sample: string }[] = [
    {
      id: 'seo_balanced',
      label: 'SEO Balanced (Recommended)',
      desc: 'Balanced combination of primary subject, context, action, and industry search phrases.',
      sample: 'Young business professional analyzing financial data on tablet in modern office.',
    },
    {
      id: 'descriptive',
      label: 'Descriptive & Visual',
      desc: 'Literal, high-detail portrayal of scene components, colors, lighting, and composition.',
      sample: 'Close-up of golden retriever resting on sunlit wooden floor beside houseplant.',
    },
    {
      id: 'commercial',
      label: 'Commercial & Concept',
      desc: 'Tailored for advertising, branding, copy space, lifestyle themes, and marketing search queries.',
      sample: 'Teamwork and creative collaboration during startup brainstorming session.',
    },
    {
      id: 'minimal',
      label: 'Minimal & Direct',
      desc: 'Concise, essential subject description without secondary modifier words.',
      sample: 'Fresh ripe organic strawberries in ceramic bowl.',
    },
    {
      id: 'custom',
      label: 'Custom Instruction',
      desc: 'Specify your own custom prompt guidelines for title generation.',
      sample: 'Your custom prompt will guide the model directly.',
    },
  ];

  const titleLengths: { id: TitleLength; label: string; range: string }[] = [
    { id: 'short', label: 'Short', range: '30 – 50 chars' },
    { id: 'medium', label: 'Medium (Standard)', range: '50 – 90 chars' },
    { id: 'long', label: 'Long / Detailed', range: '90 – 140 chars' },
    { id: 'custom', label: 'Custom Limit', range: 'User defined' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Title Settings</h3>
              <p className="text-xs text-slate-400">Configure dedicated title formula, mode, and character length</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Title Mode Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Title Mode
            </label>
            <div className="space-y-2.5">
              {titleModes.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    mode === m.id
                      ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                      : 'border-slate-800 bg-slate-850 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${mode === m.id ? 'text-blue-300' : 'text-slate-200'}`}>
                      {m.label}
                    </span>
                    {mode === m.id && (
                      <span className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{m.desc}</p>
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500">Preview: </span>
                    {m.sample}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Title Length Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Title Length
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {titleLengths.map((l) => (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => setLength(l.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    length === l.id
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300 font-semibold'
                      : 'border-slate-800 bg-slate-850 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{l.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{l.range}</div>
                </button>
              ))}
            </div>

            {length === 'custom' && (
              <div className="mt-3 p-3 rounded-xl bg-slate-850 border border-slate-700">
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Max Character Limit (Stock standard: 15–200)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="200"
                    value={customMaxLength}
                    onChange={(e) => setCustomMaxLength(Number(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-sm font-bold text-blue-400 font-mono w-16 text-right">
                    {customMaxLength} chars
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Custom Instruction Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Custom Title Instruction (Optional)
              </label>
            </div>
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus on modern lifestyle, copy space, and authentic emotion without clichés."
              className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              Appended directly to the AI vision prompt for tailored stock titles.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Apply Title Settings
          </button>
        </div>
      </div>
    </div>
  );
};
