import React from 'react';
import { BookOpen, X, CheckCircle2, ShieldCheck, HelpCircle, FileText } from 'lucide-react';
import { MARKETPLACE_PROFILES } from '../utils/platforms';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Stock Marketplace Ranking Rules</h3>
              <p className="text-xs text-slate-400">
                Official guidelines & algorithmic ranking factors across major microstock agencies
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(MARKETPLACE_PROFILES).map(([key, profile]) => (
              <div
                key={key}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{profile.name}</h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                    Max {profile.maxKeywords} tags
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Title length:</span>
                    <strong className="text-slate-200">
                      {profile.titleMinLength} – {profile.titleMaxLength} chars
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>CSV Headers:</span>
                    <strong className="text-slate-200 truncate max-w-[200px]">
                      {profile.csvColumns.map((c) => c.header).join(', ')}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Core Algorithm Directives:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {profile.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
