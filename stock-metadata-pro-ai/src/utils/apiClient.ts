import {
  Project,
  ApiKeyEntry,
  ApiUsageStats,
  ProcessingSettings,
  StockAsset,
  Marketplace,
  PromptBuildOptions,
  StockMetadata,
  AIProvider,
} from '../types';

export async function checkApiHealth() {
  const res = await fetch('/api/health');
  return res.json();
}

export async function requestGenerateMetadata(
  imageBase64: string,
  mimeType: string,
  options: PromptBuildOptions,
  provider?: AIProvider
): Promise<{ metadata: StockMetadata; provider: string; keyLabel: string }> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      options,
      provider,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Generation failed with HTTP ${res.status}`);
  }

  return res.json();
}

export async function requestOptimizeTitle(
  currentTitle: string,
  context: { category?: string; keywords?: string[]; marketplace?: string }
): Promise<string> {
  const res = await fetch('/api/optimize-title', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentTitle, context }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to optimize title');
  }
  const json = await res.json();
  return json.optimizedTitle;
}

export async function requestOptimizeDescription(
  currentDescription: string,
  title: string
): Promise<string> {
  const res = await fetch('/api/optimize-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentDescription, title }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to optimize description');
  }
  const json = await res.json();
  return json.optimizedDescription;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function saveProjectApi(project: Project): Promise<Project> {
  const res = await fetch(`/api/projects/${project.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to save project');
  return res.json();
}

export async function deleteProjectApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchApiKeys(): Promise<ApiKeyEntry[]> {
  const res = await fetch('/api/keys');
  if (!res.ok) throw new Error('Failed to fetch API keys');
  return res.json();
}

export async function addApiKeyApi(
  provider: 'gemini' | 'groq',
  label: string,
  key: string
): Promise<ApiKeyEntry> {
  const res = await fetch('/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, label, key }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to add key');
  }
  return res.json();
}

export async function updateApiKeyApi(
  id: string,
  updates: Partial<{ label: string; enabled: boolean; status: string; lastError?: string }>
): Promise<boolean> {
  const res = await fetch(`/api/keys/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.ok;
}

export async function deleteApiKeyApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function testApiKeyApi(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch('/api/keys/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function fetchUsageStats(): Promise<ApiUsageStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch usage stats');
  return res.json();
}

export async function fetchSettingsApi(): Promise<ProcessingSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettingsApi(
  settings: Partial<ProcessingSettings>
): Promise<ProcessingSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
}

/**
 * Downloads a real CSV file directly in browser.
 * Filename in CSV strictly uses originalFilename.
 */
export async function downloadCsvFile(
  assets: StockAsset[],
  marketplace: Marketplace,
  customFileName?: string
) {
  const res = await fetch('/api/csv/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assets, marketplace }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate CSV export');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  const fileName =
    customFileName || `stock_metadata_${marketplace}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.setAttribute('download', fileName);
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function importCsvApi(csvText: string) {
  const res = await fetch('/api/csv/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvText }),
  });
  if (!res.ok) {
    throw new Error('Failed to parse CSV');
  }
  return res.json();
}
