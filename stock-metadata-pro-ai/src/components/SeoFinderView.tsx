import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Zap,
  Globe,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { Marketplace } from '../types';
import { MARKETPLACE_PROFILES } from '../utils/platforms';
import { calculateSeoScore } from '../utils/seoEngine';

export const SeoFinderView: React.FC = () => {
  const [marketplace, setMarketplace] = useState<Marketplace>('adobe');
  const [title, setTitle] = useState(
    'Young woman working on laptop at cozy cafe table with cup of coffee in warm morning sunlight'
  );
  const [keywordsText, setKeywordsText] = useState(
    'woman, laptop, cafe, coffee, working, technology, morning, freelance, lifestyle, modern, student, work, business, cup, indoor, young, caucasian, smiling, happy, internet'
  );
  const [copied, setCopied] = useState(false);

  const profile = MARKETPLACE_PROFILES[marketplace] || MARKETPLACE_PROFILES.generic;

  const rawKeywords = keywordsText
    .split(/[,;\n]/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const keywordsList = rawKeywords.map((w, idx) => ({
    word: w,
    score: 80,
    priority: (idx < 10 ? 'primary' : idx < 25 ? 'secondary' : 'supporting') as any,
  }));

  const seoResult = calculateSeoScore(
    {
      title,
      description: title,
      keywords: keywordsList,
      category: 'Lifestyle',
      assetType: 'photo',
      orientation: 'horizontal',
      aiGenerated: false,
      seoScore: 0,
    },
    marketplace
  );

  const handleCopyCleaned = () => {
    navigator.clipboard.writeText(rawKeywords.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Introduction */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <Search className="w-3.5 h-3.5" />
          Stock Search Engine Optimization Auditor
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Microstock SEO Keyword & Title Analyzer
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Test your titles and keyword tags against the ranking rules of Adobe Stock,
          Shutterstock, and Freepik. Identify keyword stuffing, weak initial tags, missing subject
          nouns, and non-compliance before uploading.
        </p>
      </div>

      {/* Target Marketplace Selector */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          Audit Ruleset:
        </span>
        {(['adobe', 'shutterstock', 'freepik', 'istock', 'generic'] as Marketplace[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMarketplace(m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              marketplace === m
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {m === 'generic' ? 'Generic Stock' : m}
          </button>
        ))}
      </div>

      {/* Main Grid: Input Form vs Live Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Title Tester */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Stock Title
              </label>
              <span className="text-xs font-mono text-slate-400">
                {title.length} / {profile.titleMaxLength} chars
              </span>
            </div>
            <textarea
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-medium rounded-xl bg-slate-950 border border-slate-700 p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Paste or type stock title..."
            />
          </div>

          {/* Keywords Tester */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Comma-Separated Keywords ({rawKeywords.length} / {profile.maxKeywords})
              </label>
              <button
                type="button"
                onClick={handleCopyCleaned}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Clean List
              </button>
            </div>
            <textarea
              rows={5}
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              className="w-full text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="sunset, beach, ocean, landscape, nature, dusk..."
            />
          </div>

          {/* First 10 Tags (Adobe Algorithm Simulation) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Adobe Stock Top 10 Weighting Preview
              </span>
              <span className="text-[11px] text-slate-500">Most critical ranking factors</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Adobe Stock weights the initial 5 to 10 keywords with massive priority. If your primary
              subjects are not in this top 10, your asset may not rank on page 1:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {rawKeywords.slice(0, 10).map((k, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs"
                >
                  <strong className="text-white mr-1">#{i + 1}</strong>
                  {k}
                </span>
              ))}
              {rawKeywords.length === 0 && (
                <span className="text-xs text-slate-500 italic">No keywords entered.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right SEO Score & Audit Checks (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Score Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audit SEO Score
            </div>
            <div
              className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center font-mono font-black text-4xl shadow-inner ${
                seoResult.score >= 90
                  ? 'bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500/40'
                  : seoResult.score >= 75
                  ? 'bg-cyan-500/15 text-cyan-400 border-2 border-cyan-500/40'
                  : 'bg-amber-500/15 text-amber-400 border-2 border-amber-500/40'
              }`}
            >
              {seoResult.score}
            </div>
            <div>
              <div className="text-base font-bold text-white">{seoResult.grade} Rating</div>
              <div className="text-xs text-slate-400">
                Benchmarked for {profile.name} microstock guidelines
              </div>
            </div>
          </div>

          {/* Breakdown Checks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Audit Checklist
            </h4>
            <div className="space-y-2">
              {seoResult.checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    check.passed
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-amber-500/20 bg-amber-500/5'
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className={check.passed ? 'text-emerald-300' : 'text-amber-300'}>
                      {check.label}
                    </strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">{check.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {seoResult.recommendations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Suggested Optimizations:
              </h4>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {seoResult.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
