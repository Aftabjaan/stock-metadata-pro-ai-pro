import React, { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Cpu,
  Activity,
  ShieldCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { ApiKeyEntry, ApiUsageStats } from '../types';
import {
  addApiKeyApi,
  updateApiKeyApi,
  deleteApiKeyApi,
  testApiKeyApi,
} from '../utils/apiClient';

interface ApiKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeyEntry[];
  stats: ApiUsageStats | null;
  onKeysUpdated: () => void;
}

export const ApiKeyManagerModal: React.FC<ApiKeyManagerModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  stats,
  onKeysUpdated,
}) => {
  const [provider, setProvider] = useState<'gemini' | 'groq'>('gemini');
  const [label, setLabel] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue.trim()) return;

    setIsAdding(true);
    setFeedback(null);
    try {
      await addApiKeyApi(provider, label.trim() || `${provider.toUpperCase()} Key`, keyValue.trim());
      setKeyValue('');
      setLabel('');
      setFeedback({ type: 'success', text: 'API Key added securely to server pool.' });
      onKeysUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to add key' });
    } finally {
      setIsAdding(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleToggleEnabled = async (key: ApiKeyEntry) => {
    try {
      await updateApiKeyApi(key.id, { enabled: !key.enabled });
      onKeysUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Update failed' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKeyApi(id);
      setDeleteConfirmId(null);
      setFeedback({ type: 'success', text: 'API Key removed.' });
      onKeysUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Delete failed' });
    }
  };

  const handleResetStatus = async (id: string) => {
    try {
      await updateApiKeyApi(id, { status: 'active', enabled: true, lastError: undefined });
      setFeedback({ type: 'success', text: 'Key status reset to active.' });
      onKeysUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Reset failed' });
    }
  };

  const handleTestKey = async (id: string) => {
    setTestingId(id);
    setFeedback(null);
    try {
      const res = await testApiKeyApi(id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'Key tested successfully!' });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Key test failed' });
      }
      onKeysUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Test failed' });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Provider & API Key Manager</h3>
              <p className="text-xs text-slate-400">
                Server-side round-robin pool with automatic rate-limit cooldown
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
          {/* Security Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-200">Zero Client Exposure:</span>
              <p className="text-slate-400 leading-relaxed">
                Keys are stored and executed exclusively on the Express backend. Only safe masked
                tokens are displayed to the browser.
              </p>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Add Key Form */}
          <form onSubmit={handleAddKey} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Add New Provider Key
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Provider</label>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setProvider('gemini')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                      provider === 'gemini'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('groq')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                      provider === 'groq'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Groq
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Key Label / Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. Primary Work Key"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full text-xs rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Secret Key Value</label>
                <input
                  type="password"
                  placeholder={provider === 'gemini' ? 'Enter Gemini API key...' : 'Enter Groq API key...'}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  className="w-full text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isAdding || !keyValue.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {isAdding ? 'Saving...' : 'Add Key to Pool'}
              </button>
            </div>
          </form>

          {/* Active Keys List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Configured API Keys ({apiKeys.length})
            </h4>

            <div className="space-y-2">
              {apiKeys.map((key) => {
                const isTesting = testingId === key.id;

                return (
                  <div
                    key={key.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl font-mono text-[10px] font-bold uppercase ${
                          key.provider === 'gemini'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        {key.provider}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{key.label}</span>
                          {key.isEnvKey && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              System Secret
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              key.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : key.status === 'cooldown'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {key.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {key.maskedKey} •{' '}
                          <span className="text-slate-500">
                            {key.requestCount} calls ({key.successCount} ok, {key.failureCount} err)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                      {/* Reset status if error/cooldown */}
                      {key.status !== 'active' && (
                        <button
                          type="button"
                          onClick={() => handleResetStatus(key.id)}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 transition-colors"
                        >
                          Reset Status
                        </button>
                      )}

                      {/* Test key */}
                      <button
                        type="button"
                        disabled={isTesting}
                        onClick={() => handleTestKey(key.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                        {isTesting ? 'Testing...' : 'Test'}
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(key)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          key.enabled
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {key.enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      {/* Delete with inline confirmation */}
                      {deleteConfirmId === key.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(key.id)}
                            className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(key.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                          title="Remove key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {apiKeys.length === 0 && (
                <div className="py-6 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-slate-800">
                  No custom API keys registered. The app will utilize the default server environment
                  key.
                </div>
              )}
            </div>
          </div>

          {/* Usage Metrics Panel */}
          {stats && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Activity className="w-4 h-4 text-cyan-400" />
                Session API Telemetry & Health
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Total Calls</div>
                  <strong className="text-lg font-mono text-white">{stats.totalRequests}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Successful</div>
                  <strong className="text-lg font-mono text-emerald-400">
                    {stats.successfulRequests}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Rate Limited</div>
                  <strong className="text-lg font-mono text-amber-400">
                    {stats.rateLimitedRequests}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Avg Latency</div>
                  <strong className="text-lg font-mono text-cyan-400">
                    {stats.averageProcessingTimeMs}ms
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
