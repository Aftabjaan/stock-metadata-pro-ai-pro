export type Marketplace = 'generic' | 'adobe' | 'shutterstock' | 'freepik' | 'istock';

export type AssetType = 'photo' | 'vector' | 'illustration' | '3d_render';

export type Orientation = 'horizontal' | 'vertical' | 'square' | 'panoramic';

export type TitleMode = 'seo_balanced' | 'descriptive' | 'commercial' | 'minimal' | 'custom';

export type TitleLength = 'short' | 'medium' | 'long' | 'custom';

export interface TitleSettings {
  mode: TitleMode;
  length: TitleLength;
  customMaxLength?: number;
  customPrompt?: string;
}

export type KeywordStrategy = 'balanced' | 'highly_relevant' | 'commercial' | 'concept_focused' | 'minimal';

export type KeywordPriority = 'primary' | 'secondary' | 'supporting';

export interface KeywordItem {
  word: string;
  score: number; // 0-100
  priority: KeywordPriority;
}

export interface KeywordSettings {
  targetCount: number; // 10, 20, 30, 35, 40, 45, 49, 50, or custom
  minCount: number;
  maxCount: number;
  strategy: KeywordStrategy;
  customInstruction?: string;
}

export type AssetStatus = 'waiting' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PromptBuildOptions {
  marketplace: Marketplace;
  assetType: AssetType;
  titleSettings: TitleSettings;
  keywordSettings: KeywordSettings;
  aiGeneratedFlag?: boolean;
}

export interface SeoCheck {
  label: string;
  passed: boolean;
  tip?: string;
  details?: string;
  category?: 'title' | 'keywords' | 'description' | 'platform';
}

export interface SeoBreakdown {
  score: number;
  rating?: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor';
  grade?: string;
  checks: SeoCheck[];
  recommendations: string[];
}

export interface StockMetadata {
  title: string;
  description: string;
  keywords: KeywordItem[];
  category: string;
  assetType: AssetType;
  orientation: Orientation;
  aiGenerated: boolean;
  seoScore: number;
  seoBreakdown?: SeoBreakdown;
}

export interface MetadataVersion {
  version?: number;
  versionNumber?: number;
  timestamp: string;
  title?: string;
  description?: string;
  keywords?: KeywordItem[];
  category?: string;
  seoScore?: number;
  metadata?: StockMetadata;
  note?: string;
}

export interface StockAsset {
  id: string; // Internal identifier only
  originalFilename: string; // CRITICAL: exact File.name, strictly preserved everywhere in UI & CSV
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string; // WebP or JPEG thumbnail for efficient memory usage
  metadata?: StockMetadata;
  versions: MetadataVersion[];
  status: AssetStatus;
  error?: string;
  errorMessage?: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  marketplace: Marketplace;
  assetType: AssetType;
  titleSettings: TitleSettings;
  keywordSettings: KeywordSettings;
  items: StockAsset[];
  createdAt: string;
  updatedAt: string;
}

export type AIProvider = 'gemini' | 'groq' | 'auto';

export interface ApiKeyEntry {
  id: string;
  provider: 'gemini' | 'groq';
  label: string;
  maskedKey: string;
  enabled: boolean;
  isEnvKey?: boolean;
  status: 'active' | 'cooldown' | 'error' | 'untested';
  requestCount: number;
  successCount: number;
  failureCount: number;
  lastUsed?: string;
  lastError?: string;
}

export interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  imagesProcessed: number;
  avgProcessingTimeMs: number;
  averageProcessingTimeMs?: number;
  lastUsedProvider?: string;
}

export interface MarketplaceProfile {
  id: Marketplace;
  name: string;
  badge: string;
  titleMinLength: number;
  titleMaxLength: number;
  descriptionMinLength: number;
  descriptionMaxLength: number;
  minKeywords: number;
  maxKeywords: number;
  allowedCategories: string[];
  csvColumns: { key: keyof StockMetadata | 'originalFilename'; header: string }[];
  rules: string[];
  notes: string;
}

export interface ProcessingSettings {
  concurrency: number; // e.g. 2, 3, 5
  retryCount: number;
  provider?: AIProvider;
  preferredProvider?: AIProvider;
  groqModel: string;
  geminiModel: string;
  enableAutoSave?: boolean;
}
