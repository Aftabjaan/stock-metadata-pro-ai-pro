import fs from 'fs';
import path from 'path';
import { Project, ApiUsageStats, Marketplace, AssetType } from '../src/types';

export interface StoredApiKey {
  id: string;
  provider: 'gemini' | 'groq';
  label: string;
  rawKey: string; // Server-only, NEVER sent to client
  maskedKey: string;
  enabled: boolean;
  isEnvKey?: boolean;
  status: 'active' | 'cooldown' | 'error' | 'untested';
  requestCount: number;
  successCount: number;
  failureCount: number;
  lastUsed?: string;
  lastError?: string;
  cooldownUntil?: number;
}

interface DatabaseSchema {
  projects: Project[];
  apiKeys: StoredApiKey[];
  stats: ApiUsageStats;
  settings: {
    concurrency: number;
    preferredProvider: 'gemini' | 'groq' | 'auto';
    groqModel: string;
    geminiModel: string;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'stock_pro_db.json');

function maskKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '********';
  return '••••••••' + trimmed.slice(-4);
}

function getDefaultState(): DatabaseSchema {
  const defaultProject: Project = {
    id: 'proj-default-1',
    name: 'Stock Batch 01',
    description: 'Initial stock batch for multi-platform metadata generation',
    marketplace: 'generic',
    assetType: 'photo',
    titleSettings: {
      mode: 'seo_balanced',
      length: 'medium',
      customPrompt: 'Focus on clear commercial search intent and subject detail'
    },
    keywordSettings: {
      targetCount: 40,
      minCount: 25,
      maxCount: 49,
      strategy: 'balanced'
    },
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    projects: [defaultProject],
    apiKeys: [], // Starts with empty key pool; env keys are injected into memory only
    stats: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      imagesProcessed: 0,
      avgProcessingTimeMs: 0
    },
    settings: {
      concurrency: 3,
      preferredProvider: 'auto',
      groqModel: 'llama-3.2-11b-vision-preview',
      geminiModel: 'gemini-3.1-flash-lite'
    }
  };
}

class DbService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    this.syncEnvKeys();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.settings) {
          if (!parsed.settings.geminiModel || parsed.settings.geminiModel === 'gemini-3.8-flash') {
            parsed.settings.geminiModel = 'gemini-3.1-flash-lite';
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading db file, initializing defaults:', e);
    }
    const def = getDefaultState();
    this.persist(def);
    return def;
  }

  private persist(data: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // SECURITY ENFORCEMENT: Never write real API keys or environment secrets to disk.
      // 1. Environment keys (isEnvKey: true) are loaded from process.env and never saved to disk.
      // 2. Custom keys have rawKey stripped to empty string on disk.
      const sanitizedData = {
        ...data,
        apiKeys: (data.apiKeys || [])
          .filter(k => !k.isEnvKey)
          .map(k => ({
            ...k,
            rawKey: ''
          }))
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(sanitizedData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db file (filesystem may be read-only):', e);
    }
  }

  private syncEnvKeys() {
    const envGemini = process.env.GEMINI_API_KEY || '';
    const envGroq = process.env.GROQ_API_KEY || '';

    let changed = false;
    if (envGemini) {
      const existing = this.data.apiKeys.find(k => k.id === 'env-gemini-1');
      if (existing) {
        if (existing.rawKey !== envGemini) {
          existing.rawKey = envGemini;
          existing.maskedKey = maskKey(envGemini);
          changed = true;
        }
        // Always ensure env key is enabled and active if no other working gemini key is enabled
        const hasOtherEnabled = this.data.apiKeys.some(
          k => k.provider === 'gemini' && k.enabled && k.id !== 'env-gemini-1' && k.status !== 'error'
        );
        if (!hasOtherEnabled) {
          existing.enabled = true;
          existing.status = 'active';
          changed = true;
        }
      } else {
        this.data.apiKeys.unshift({
          id: 'env-gemini-1',
          provider: 'gemini',
          label: 'Gemini Primary (Env Secret)',
          rawKey: envGemini,
          maskedKey: maskKey(envGemini),
          enabled: true,
          isEnvKey: true,
          status: 'active',
          requestCount: 0,
          successCount: 0,
          failureCount: 0
        });
        changed = true;
      }
    }

    if (envGroq) {
      const existing = this.data.apiKeys.find(k => k.id === 'env-groq-1');
      if (existing) {
        if (existing.rawKey !== envGroq) {
          existing.rawKey = envGroq;
          existing.maskedKey = maskKey(envGroq);
          changed = true;
        }
      } else {
        this.data.apiKeys.push({
          id: 'env-groq-1',
          provider: 'groq',
          label: 'Groq Primary (Env Secret)',
          rawKey: envGroq,
          maskedKey: maskKey(envGroq),
          enabled: true,
          isEnvKey: true,
          status: 'active',
          requestCount: 0,
          successCount: 0,
          failureCount: 0
        });
        changed = true;
      }
    }

    if (changed) {
      this.persist();
    }
  }

  public ensureEnvKeyActive(provider: 'gemini' | 'groq'): StoredApiKey | null {
    if (provider === 'gemini') {
      const envGemini = process.env.GEMINI_API_KEY || '';
      if (!envGemini) return null;
      let existing = this.data.apiKeys.find(k => k.id === 'env-gemini-1');
      if (!existing) {
        existing = {
          id: 'env-gemini-1',
          provider: 'gemini',
          label: 'Gemini Primary (Env Secret)',
          rawKey: envGemini,
          maskedKey: maskKey(envGemini),
          enabled: true,
          isEnvKey: true,
          status: 'active',
          requestCount: 0,
          successCount: 0,
          failureCount: 0,
        };
        this.data.apiKeys.unshift(existing);
      } else {
        existing.enabled = true;
        existing.status = 'active';
        existing.rawKey = envGemini;
      }
      this.persist();
      return existing;
    }
    if (provider === 'groq') {
      const envGroq = process.env.GROQ_API_KEY || '';
      if (!envGroq) return null;
      let existing = this.data.apiKeys.find(k => k.id === 'env-groq-1');
      if (!existing) {
        existing = {
          id: 'env-groq-1',
          provider: 'groq',
          label: 'Groq Primary (Env Secret)',
          rawKey: envGroq,
          maskedKey: maskKey(envGroq),
          enabled: true,
          isEnvKey: true,
          status: 'active',
          requestCount: 0,
          successCount: 0,
          failureCount: 0,
        };
        this.data.apiKeys.push(existing);
      } else {
        existing.enabled = true;
        existing.status = 'active';
        existing.rawKey = envGroq;
      }
      this.persist();
      return existing;
    }
    return null;
  }

  public getProjects(): Project[] {
    return this.data.projects;
  }

  public getProject(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  public saveProject(project: Project): Project {
    const idx = this.data.projects.findIndex(p => p.id === project.id);
    project.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.data.projects[idx] = project;
    } else {
      this.data.projects.push(project);
    }
    this.persist();
    return project;
  }

  public deleteProject(id: string): boolean {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.data.projects.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // API Key management (Server handles raw keys, sends masked keys to client)
  public getClientApiKeys() {
    return this.data.apiKeys.map(k => ({
      id: k.id,
      provider: k.provider,
      label: k.label,
      maskedKey: k.maskedKey,
      enabled: k.enabled,
      isEnvKey: k.isEnvKey,
      status: k.status,
      requestCount: k.requestCount,
      successCount: k.successCount,
      failureCount: k.failureCount,
      lastUsed: k.lastUsed,
      lastError: k.lastError
    }));
  }

  public getRawApiKeys(): StoredApiKey[] {
    return this.data.apiKeys;
  }

  public addApiKey(provider: 'gemini' | 'groq', label: string, rawKey: string): StoredApiKey {
    const newKey: StoredApiKey = {
      id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      provider,
      label: label.trim() || `${provider.toUpperCase()} Key`,
      rawKey: rawKey.trim(),
      maskedKey: maskKey(rawKey),
      enabled: true,
      status: 'active',
      requestCount: 0,
      successCount: 0,
      failureCount: 0
    };
    this.data.apiKeys.push(newKey);
    this.persist();
    return newKey;
  }

  public updateApiKey(id: string, updates: Partial<{ label: string; enabled: boolean; status: StoredApiKey['status'] }>) {
    const key = this.data.apiKeys.find(k => k.id === id);
    if (key) {
      if (updates.label !== undefined) key.label = updates.label;
      if (updates.enabled !== undefined) key.enabled = updates.enabled;
      if (updates.status !== undefined) key.status = updates.status;
      this.persist();
      return true;
    }
    return false;
  }

  public deleteApiKey(id: string): boolean {
    const idx = this.data.apiKeys.findIndex(k => k.id === id);
    if (idx >= 0) {
      if (this.data.apiKeys[idx].isEnvKey) {
        // Can disable env key, but don't delete completely
        this.data.apiKeys[idx].enabled = false;
        this.persist();
        return true;
      }
      this.data.apiKeys.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  public recordKeyUsage(id: string, success: boolean, error?: string, isRateLimit?: boolean) {
    const key = this.data.apiKeys.find(k => k.id === id);
    if (key) {
      key.requestCount++;
      key.lastUsed = new Date().toISOString();
      if (success) {
        key.successCount++;
        key.status = 'active';
        key.lastError = undefined;
      } else {
        key.failureCount++;
        key.lastError = error;
        if (isRateLimit) {
          key.status = 'cooldown';
          key.cooldownUntil = Date.now() + 60000; // 1 minute cooldown
        } else {
          key.status = 'error';
        }
      }
      this.persist();
    }
  }

  public getStats(): ApiUsageStats {
    return this.data.stats;
  }

  public recordRequestStats(success: boolean, durationMs: number, isRateLimit: boolean, provider: string) {
    const s = this.data.stats;
    s.totalRequests++;
    if (success) {
      s.successfulRequests++;
      s.imagesProcessed++;
    } else {
      s.failedRequests++;
    }
    if (isRateLimit) {
      s.rateLimitedRequests++;
    }
    s.lastUsedProvider = provider;
    // Running average
    s.avgProcessingTimeMs = s.avgProcessingTimeMs === 0
      ? durationMs
      : Math.round((s.avgProcessingTimeMs * 0.8) + (durationMs * 0.2));

    this.persist();
  }

  public getSettings() {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<DatabaseSchema['settings']>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.persist();
    return this.data.settings;
  }
}

export const dbService = new DbService();
