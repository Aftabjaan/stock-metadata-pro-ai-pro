import React, { useState } from 'react';
import { Tag, Check, X, Sliders, Layers, Info } from 'lucide-react';
import { KeywordSettings, KeywordStrategy } from '../types';

interface KeywordSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keywordSettings: KeywordSettings;
  onSave: (settings: KeywordSettings) => void;
  platformLimit?: number;
}

export const KeywordSettingsModal: React.FC<KeywordSettingsModalProps> = ({
  isOpen,
  onClose,
  keywordSettings,
  onSave,
  platformLimit = 50,
}) => {
  const [targetCount, setTargetCount] = useState<number>(keywordSettings.targetCount);
  const [minCount, setMinCount] = useState<number>(keywordSettings.minCount || 20);
  const [maxCount, setMaxCount] = useState<number>(keywordSettings.maxCount || platformLimit);
  const [strategy, setStrategy] = useState<KeywordStrategy>(keywordSettings.strategy);
  const [customCountMode, setCustomCountMode] = useState<boolean>(
    ![10, 20, 30, 35, 40, 45, 49, 50].includes(keywordSettings.targetCount)
  );

  if (!isOpen) return null;

  const countPresets = [10, 20, 30, 35, 40, 45, 49, 50];

  const strategies: { id: KeywordStrategy; label: string; desc: string }[] = [
    {
      id: 'balanced',
      label: 'Balanced Mix (Recommended)',
      desc: 'Optimal distribution: 30% subject nouns, 30% environment & actions, 40% commercial & conceptual keywords.',
    },
    {
      id: 'highly_relevant',
      label: 'Highly Relevant (Literal)',
      desc: 'Focus primarily on direct visual entities, observable objects, colors, and physical composition.',
    },
    {
      id: 'commercial',
      label: 'Commercial & Advertising',
      desc: 'Heavy focus on copy space, marketing themes, business use cases, and industry search keywords.',
    },
    {
      id: 'concept_focused',
      label: 'Concept & Metaphorical',
      desc: 'Emphasize symbolic meanings (e.g., success, leadership, freedom, synergy, security).',
    },
    {
      id: 'minimal',
      label: 'Minimal & High-Intent',
      desc: 'Only the highest-intent converting search terms without secondary descriptors.',
    },
  ];

  const handleSave = () => {
    onSave({
      targetCount: Math.min(targetCount, maxCount),
      minCount,
      maxCount,
      strategy,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Keyword Settings</h3>
              <p className="text-xs text-slate-400">Configure keyword quantity, taxonomy strategy, and priority hierarchy</p>
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
          {/* Keyword Strategy */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Keyword Strategy
            </label>
            <div className="space-y-2">
              {strategies.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    strategy === s.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-slate-800 bg-slate-850 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-semibold ${strategy === s.id ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {s.label}
                    </span>
                    {strategy === s.id && (
                      <span className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Target Keyword Count Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Target Keyword Count
              </label>
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Target: {targetCount} tags
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
              {countPresets.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setTargetCount(cnt);
                    setCustomCountMode(false);
                  }}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    targetCount === cnt && !customCountMode
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                      : 'border-slate-800 bg-slate-850 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            {/* Custom Range Slider */}
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Custom Target Adjuster:</span>
                <span className="font-mono text-emerald-400 font-bold">{targetCount} Keywords</span>
              </div>
              <input
                type="range"
                min="5"
                max={platformLimit}
                value={targetCount}
                onChange={(e) => {
                  setTargetCount(Number(e.target.value));
                  setCustomCountMode(true);
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Min: 5</span>
                <span>Adobe Sweetspot: 35–49</span>
                <span>Max: {platformLimit}</span>
              </div>
            </div>
          </div>

          {/* Keyword Priority Tier Explanation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400" />
              Keyword Priority Classification (Rank Weighted)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stock algorithms give the strongest ranking power to initial keywords:
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                <strong className="block text-white font-semibold">PRIMARY (1–10)</strong>
                Core subjects & primary actions
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <strong className="block text-white font-semibold">SECONDARY (11–25)</strong>
                Environment, setting & lighting
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <strong className="block text-white font-semibold">SUPPORTING (26+)</strong>
                Metaphors, concepts & copy space
              </div>
            </div>
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
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Apply Keyword Settings
          </button>
        </div>
      </div>
    </div>
  );
};
