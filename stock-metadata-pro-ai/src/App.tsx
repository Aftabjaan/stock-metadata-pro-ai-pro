import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  Project,
  StockAsset,
  Marketplace,
  AssetType,
  TitleSettings,
  KeywordSettings,
  AIProvider,
  ApiKeyEntry,
  ApiUsageStats,
  ProcessingSettings,
} from './types';
import { Navbar } from './components/Navbar';
import { WorkflowBar } from './components/WorkflowBar';
import { UploadZone } from './components/UploadZone';
import { QueueControlBar } from './components/QueueControlBar';
import { AssetTable } from './components/AssetTable';
import { TitleSettingsModal } from './components/TitleSettingsModal';
import { KeywordSettingsModal } from './components/KeywordSettingsModal';
import { MetadataEditorModal } from './components/MetadataEditorModal';
import { CsvExportModal } from './components/CsvExportModal';
import { CsvImportModal } from './components/CsvImportModal';
import { ApiKeyManagerModal } from './components/ApiKeyManagerModal';
import { ProjectsModal } from './components/ProjectsModal';
import { AdvancedSettingsModal } from './components/AdvancedSettingsModal';
import { RulesModal } from './components/InfoModals';
import { SeoFinderView } from './components/SeoFinderView';
import {
  fetchProjects,
  saveProjectApi,
  deleteProjectApi,
  fetchApiKeys,
  fetchUsageStats,
  fetchSettingsApi,
  updateSettingsApi,
  requestGenerateMetadata,
} from './utils/apiClient';

export function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Navigation state
  const [activeView, setActiveView] = useState<'generator' | 'seo-finder'>('generator');

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project>({
    id: 'default-project',
    name: 'Stock Batch 01',
    marketplace: 'adobe',
    assetType: 'photo',
    titleSettings: { mode: 'seo_balanced', length: 'medium' },
    keywordSettings: { targetCount: 40, minCount: 25, maxCount: 49, strategy: 'balanced' },
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Global settings & keys
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  const [settings, setSettings] = useState<ProcessingSettings>({
    preferredProvider: 'auto',
    concurrency: 3,
    geminiModel: 'gemini-3.8-flash',
    groqModel: 'llama-3.2-11b-vision-preview',
    retryCount: 2,
    enableAutoSave: true,
  });

  // Table selection & editor modal
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Queue runner state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProcessingFilename, setCurrentProcessingFilename] = useState<string | null>(null);
  const isCancelledRef = useRef(false);
  const isPausedRef = useRef(false);

  // Modals visibility
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isExportCsvOpen, setIsExportCsvOpen] = useState(false);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [projs, keys, usage, setts] = await Promise.all([
        fetchProjects().catch(() => []),
        fetchApiKeys().catch(() => []),
        fetchUsageStats().catch(() => null),
        fetchSettingsApi().catch(() => null),
      ]);

      if (keys.length > 0) setApiKeys(keys);
      if (usage) setStats(usage);
      if (setts) setSettings(setts);

      if (projs.length > 0) {
        setProjects(projs);
        setCurrentProject(projs[0]);
      } else {
        // Save initial default project
        const initialProj: Project = {
          id: `project-${Date.now()}`,
          name: 'My Stock Batch 01',
          marketplace: 'adobe',
          assetType: 'photo',
          titleSettings: { mode: 'seo_balanced', length: 'medium' },
          keywordSettings: { targetCount: 40, minCount: 25, maxCount: 49, strategy: 'balanced' },
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveProjectApi(initialProj);
        setProjects([initialProj]);
        setCurrentProject(initialProj);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  // Keep project saved to server
  const persistProject = async (updated: Project) => {
    setCurrentProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    try {
      await saveProjectApi(updated);
    } catch (err) {
      console.error('Error auto-saving project:', err);
    }
  };

  // Upload new assets
  const handleAddAssets = (newAssets: StockAsset[]) => {
    const updatedItems = [...currentProject.items, ...newAssets];
    const updatedProj: Project = {
      ...currentProject,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    persistProject(updatedProj);
  };

  // Remove asset
  const handleDeleteAsset = (id: string) => {
    const updatedItems = currentProject.items.filter((a) => a.id !== id);
    const updatedProj: Project = {
      ...currentProject,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    persistProject(updatedProj);
  };

  // Clear all assets (opens safe in-app confirmation modal)
  const handleClearAllAssets = () => {
    if (currentProject.items.length === 0) return;
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClearAll = () => {
    setIsClearConfirmOpen(false);
    const updatedProj: Project = {
      ...currentProject,
      items: [],
      updatedAt: new Date().toISOString(),
    };
    setSelectedIds(new Set());
    persistProject(updatedProj);
  };

  // Delete selected assets
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const updatedItems = currentProject.items.filter((a) => !selectedIds.has(a.id));
    const updatedProj: Project = {
      ...currentProject,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setSelectedIds(new Set());
    persistProject(updatedProj);
  };

  // Update single asset after edit
  const handleSaveAsset = (updatedAsset: StockAsset) => {
    const updatedItems = currentProject.items.map((item) =>
      item.id === updatedAsset.id ? updatedAsset : item
    );
    persistProject({
      ...currentProject,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(currentProject.items.map((a) => a.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Workflow settings handlers
  const handleSelectMarketplace = (m: Marketplace) => {
    persistProject({ ...currentProject, marketplace: m, updatedAt: new Date().toISOString() });
  };

  const handleSelectAssetType = (t: AssetType) => {
    persistProject({ ...currentProject, assetType: t, updatedAt: new Date().toISOString() });
  };

  const handleSaveTitleSettings = (ts: TitleSettings) => {
    persistProject({ ...currentProject, titleSettings: ts, updatedAt: new Date().toISOString() });
  };

  const handleSaveKeywordSettings = (ks: KeywordSettings) => {
    persistProject({ ...currentProject, keywordSettings: ks, updatedAt: new Date().toISOString() });
  };

  const handleToggleAiGenerated = (val: boolean) => {
    // Also toggle for existing items
    const updatedItems = currentProject.items.map((item) => {
      if (item.metadata) {
        return {
          ...item,
          metadata: { ...item.metadata, aiGenerated: val },
        };
      }
      return item;
    });
    persistProject({
      ...currentProject,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSelectProvider = async (p: AIProvider) => {
    const updatedSettings = { ...settings, preferredProvider: p };
    setSettings(updatedSettings);
    await updateSettingsApi({ preferredProvider: p });
  };

  // ==========================================
  // BULK QUEUE WORKER POOL
  // ==========================================
  const runQueue = async (targetAssets: StockAsset[]) => {
    if (targetAssets.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setIsPaused(false);
    isCancelledRef.current = false;
    isPausedRef.current = false;

    const queue = [...targetAssets];
    const concurrency = Math.min(settings.concurrency || 3, 5);

    // Track mutable items array to update UI and server progressively
    let currentItems = [...currentProject.items];

    const worker = async () => {
      while (queue.length > 0 && !isCancelledRef.current) {
        // Pause check loop
        while (isPausedRef.current && !isCancelledRef.current) {
          await new Promise((r) => setTimeout(r, 400));
        }

        if (isCancelledRef.current) break;

        const asset = queue.shift();
        if (!asset) break;

        setCurrentProcessingFilename(asset.originalFilename);

        // Mark asset as processing
        currentItems = currentItems.map((item) =>
          item.id === asset.id ? { ...item, status: 'processing', errorMessage: undefined } : item
        );
        setCurrentProject((prev) => ({ ...prev, items: currentItems }));

        try {
          // Check for cached AI base64 or fallback to thumbnail
          const base64 =
            (asset as any)._aiBase64 || asset.thumbnailUrl || (asset as any).dataUrl;

          if (!base64) {
            throw new Error(`Missing image data for ${asset.originalFilename}`);
          }

          const genResult = await requestGenerateMetadata(
            base64,
            asset.mimeType || 'image/jpeg',
            {
              marketplace: currentProject.marketplace,
              assetType: currentProject.assetType,
              titleSettings: currentProject.titleSettings,
              keywordSettings: currentProject.keywordSettings,
              aiGeneratedFlag: currentProject.items.some((i) => i.metadata?.aiGenerated),
            },
            settings.preferredProvider
          );

          // Update asset with completed metadata
          currentItems = currentItems.map((item) => {
            if (item.id === asset.id) {
              const newVersions = [
                ...(item.versions || []),
                {
                  versionNumber: (item.versions?.length || 0) + 1,
                  timestamp: new Date().toISOString(),
                  title: genResult.metadata.title,
                  description: genResult.metadata.description,
                  keywords: genResult.metadata.keywords,
                  category: genResult.metadata.category,
                  seoScore: genResult.metadata.seoScore,
                },
              ];

              return {
                ...item,
                status: 'completed',
                metadata: genResult.metadata,
                versions: newVersions,
                errorMessage: undefined,
              };
            }
            return item;
          });

          setCurrentProject((prev) => ({ ...prev, items: currentItems }));
        } catch (err: any) {
          console.error(`Error processing ${asset.originalFilename}:`, err);
          currentItems = currentItems.map((item) =>
            item.id === asset.id
              ? {
                  ...item,
                  status: 'failed',
                  errorMessage: err.message || 'Generation failed',
                }
              : item
          );
          setCurrentProject((prev) => ({ ...prev, items: currentItems }));
        }
      }
    };

    // Run parallel workers
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
    await Promise.all(workers);

    // Save final updated state
    const finalProj: Project = {
      ...currentProject,
      items: currentItems,
      updatedAt: new Date().toISOString(),
    };
    await persistProject(finalProj);

    // Refresh telemetry stats
    fetchUsageStats().then(setStats).catch(() => {});

    setIsProcessing(false);
    setIsPaused(false);
    setCurrentProcessingFilename(null);
  };

  const handleGenerateAll = () => {
    runQueue(currentProject.items);
  };

  const handleGenerateSelected = () => {
    const selected = currentProject.items.filter((a) => selectedIds.has(a.id));
    runQueue(selected);
  };

  const handleRetryFailed = () => {
    const failed = currentProject.items.filter((a) => a.status === 'failed');
    runQueue(failed);
  };

  const handleRegenerateSingle = (asset: StockAsset) => {
    runQueue([asset]);
  };

  const handlePause = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentProcessingFilename(null);
  };

  // Projects Modal Handlers
  const handleCreateProject = async (name: string) => {
    const newProj: Project = {
      id: `project-${Date.now()}`,
      name,
      marketplace: currentProject.marketplace,
      assetType: currentProject.assetType,
      titleSettings: currentProject.titleSettings,
      keywordSettings: currentProject.keywordSettings,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveProjectApi(newProj);
    setProjects((prev) => [...prev, newProj]);
    setCurrentProject(newProj);
    setSelectedIds(new Set());
  };

  const handleRenameProject = async (id: string, newName: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const updated = { ...target, name: newName, updatedAt: new Date().toISOString() };
    await saveProjectApi(updated);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (currentProject.id === id) setCurrentProject(updated);
  };

  const handleDuplicateProject = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const dup: Project = {
      ...target,
      id: `project-${Date.now()}`,
      name: `${target.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveProjectApi(dup);
    setProjects((prev) => [...prev, dup]);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProjectApi(id);
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (currentProject.id === id && remaining.length > 0) {
      setCurrentProject(remaining[0]);
    }
  };

  // Navigation inside Metadata Editor
  const editingAssetIndex = currentProject.items.findIndex((a) => a.id === editingAssetId);
  const editingAsset = editingAssetIndex >= 0 ? currentProject.items[editingAssetIndex] : null;

  const existingFilenames = new Set(currentProject.items.map((a) => a.originalFilename));

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } font-sans antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-200`}
    >
      {/* Top Navbar */}
      <Navbar
        currentProject={currentProject}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenKeys={() => setIsKeysOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        apiKeys={apiKeys}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeView === 'generator' ? (
          <>
            {/* Step 1 & 2: Platform, Asset Type, Title & Keyword Configuration Bar */}
            <WorkflowBar
              marketplace={currentProject.marketplace}
              onSelectMarketplace={handleSelectMarketplace}
              assetType={currentProject.assetType}
              onSelectAssetType={handleSelectAssetType}
              titleSettings={currentProject.titleSettings}
              onOpenTitleSettings={() => setIsTitleModalOpen(true)}
              keywordSettings={currentProject.keywordSettings}
              onOpenKeywordSettings={() => setIsKeywordModalOpen(true)}
              aiGenerated={currentProject.items.some((i) => i.metadata?.aiGenerated)}
              onToggleAiGenerated={handleToggleAiGenerated}
              provider={settings.preferredProvider}
              onSelectProvider={handleSelectProvider}
              onOpenAdvanced={() => setIsAdvancedOpen(true)}
            />

            {/* Step 3: Drag & Drop Upload Zone (client-side fast thumbnails, strict originalFilename) */}
            <UploadZone
              onAddAssets={handleAddAssets}
              existingFilenames={existingFilenames}
              totalAssetsCount={currentProject.items.length}
              onClearAll={handleClearAllAssets}
            />

            {/* Step 4: Bulk Queue Controls & Live Progress */}
            {currentProject.items.length > 0 && (
              <QueueControlBar
                assets={currentProject.items}
                isProcessing={isProcessing}
                isPaused={isPaused}
                selectedCount={selectedIds.size}
                currentProcessingFilename={currentProcessingFilename}
                concurrency={settings.concurrency}
                onChangeConcurrency={(c) => {
                  setSettings((prev) => ({ ...prev, concurrency: c }));
                  updateSettingsApi({ concurrency: c });
                }}
                onGenerateAll={handleGenerateAll}
                onGenerateSelected={handleGenerateSelected}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                onRetryFailed={handleRetryFailed}
                onOpenExportCsv={() => setIsExportCsvOpen(true)}
                onOpenImportCsv={() => setIsImportCsvOpen(true)}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onClearAll={handleClearAllAssets}
              />
            )}

            {/* Step 5: High-Density Asset Review Table & Mobile Cards */}
            <AssetTable
              assets={currentProject.items}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onEditAsset={(asset) => setEditingAssetId(asset.id)}
              onRegenerateAsset={handleRegenerateSingle}
              onDeleteAsset={handleDeleteAsset}
              isProcessing={isProcessing}
              onClearAll={handleClearAllAssets}
              onDeleteSelected={handleDeleteSelected}
            />
          </>
        ) : (
          /* Standalone Stock SEO Auditor & Keyword Researcher */
          <SeoFinderView />
        )}
      </main>

      {/* MODALS */}
      {/* Title Settings Modal */}
      <TitleSettingsModal
        isOpen={isTitleModalOpen}
        onClose={() => setIsTitleModalOpen(false)}
        titleSettings={currentProject.titleSettings}
        onSave={handleSaveTitleSettings}
      />

      {/* Keyword Settings Modal */}
      <KeywordSettingsModal
        isOpen={isKeywordModalOpen}
        onClose={() => setIsKeywordModalOpen(false)}
        keywordSettings={currentProject.keywordSettings}
        onSave={handleSaveKeywordSettings}
      />

      {/* Metadata Review & Editor Modal */}
      {editingAsset && (
        <MetadataEditorModal
          isOpen={!!editingAssetId}
          onClose={() => setEditingAssetId(null)}
          asset={editingAsset}
          marketplace={currentProject.marketplace}
          onSaveAsset={handleSaveAsset}
          onPrev={() => {
            if (editingAssetIndex > 0) {
              setEditingAssetId(currentProject.items[editingAssetIndex - 1].id);
            }
          }}
          onNext={() => {
            if (editingAssetIndex < currentProject.items.length - 1) {
              setEditingAssetId(currentProject.items[editingAssetIndex + 1].id);
            }
          }}
          hasPrev={editingAssetIndex > 0}
          hasNext={editingAssetIndex < currentProject.items.length - 1}
        />
      )}

      {/* CSV Export Modal */}
      <CsvExportModal
        isOpen={isExportCsvOpen}
        onClose={() => setIsExportCsvOpen(false)}
        assets={currentProject.items}
        marketplace={currentProject.marketplace}
        selectedIds={selectedIds}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
        onImportAssets={handleAddAssets}
      />

      {/* API Key Manager Modal */}
      <ApiKeyManagerModal
        isOpen={isKeysOpen}
        onClose={() => setIsKeysOpen(false)}
        apiKeys={apiKeys}
        stats={stats}
        onKeysUpdated={async () => {
          const keys = await fetchApiKeys().catch(() => []);
          setApiKeys(keys);
          const usage = await fetchUsageStats().catch(() => null);
          if (usage) setStats(usage);
        }}
      />

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projects}
        currentProjectId={currentProject.id}
        onSelectProject={(id) => {
          const p = projects.find((proj) => proj.id === id);
          if (p) setCurrentProject(p);
        }}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Advanced Settings Modal */}
      <AdvancedSettingsModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        settings={settings}
        onSave={async (newSettings) => {
          setSettings(newSettings);
          await updateSettingsApi(newSettings);
        }}
      />

      {/* Marketplace Rules Reference Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Clear All Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Clear All Assets?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to remove all <strong className="text-white">{currentProject.items.length} {currentProject.items.length === 1 ? 'asset' : 'assets'}</strong> from <span className="text-cyan-400 font-medium">"{currentProject.name}"</span>?
                </p>
                <p className="text-[11px] text-slate-500">
                  All thumbnails, tags, keywords, and generated titles in this current batch will be cleared from your workspace.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
