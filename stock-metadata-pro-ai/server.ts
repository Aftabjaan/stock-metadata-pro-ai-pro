import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { dbService } from './server/dbService';
import { keyManager } from './server/keyManager';
import { geminiService } from './server/geminiService';
import { groqService } from './server/groqService';
import { generateCsv, parseCsv } from './server/csvService';
import { calculateSeoScore } from './src/utils/seoEngine';
import { validateAndSanitizeMetadata } from './server/metadataValidator';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limit for image thumbnails/base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGroqKey: !!process.env.GROQ_API_KEY,
  });
});

// 2. Generate metadata for an image
app.post('/api/generate', async (req, res) => {
  try {
    const { imageBase64, mimeType, options, provider } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const result = await keyManager.executeGeneration(
      imageBase64,
      mimeType || 'image/jpeg',
      options || {
        marketplace: 'generic',
        assetType: 'photo',
        titleSettings: { mode: 'seo_balanced', length: 'medium' },
        keywordSettings: { targetCount: 40, minCount: 25, maxCount: 49, strategy: 'balanced' },
      },
      provider
    );

    res.json(result);
  } catch (err: any) {
    console.error('Error generating metadata:', err);
    res.status(500).json({
      error: err.message || 'Metadata generation failed. Please check your API keys or try again.',
    });
  }
});

// 3. Quick Title Optimizer
app.post('/api/optimize-title', async (req, res) => {
  try {
    const { currentTitle, context, provider } = req.body;
    const geminiKey = keyManager.getAvailableKey('gemini');
    if (!geminiKey) {
      return res.status(400).json({ error: 'No active Gemini API key available for optimization.' });
    }

    const optimized = await geminiService.optimizeTitle(currentTitle, context || {}, geminiKey.rawKey);
    res.json({ optimizedTitle: optimized });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Title optimization failed' });
  }
});

// 4. Quick Description Optimizer
app.post('/api/optimize-description', async (req, res) => {
  try {
    const { currentDescription, title } = req.body;
    const geminiKey = keyManager.getAvailableKey('gemini');
    if (!geminiKey) {
      return res.status(400).json({ error: 'No active Gemini API key available for optimization.' });
    }

    const optimized = await geminiService.optimizeDescription(currentDescription, title || '', geminiKey.rawKey);
    res.json({ optimizedDescription: optimized });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Description optimization failed' });
  }
});

// 5. SEO score calculation endpoint
app.post('/api/seo-score', (req, res) => {
  try {
    const { metadata, marketplace } = req.body;
    const result = calculateSeoScore(metadata || {}, marketplace || 'generic');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'SEO calculation error' });
  }
});

// 6. Project endpoints
app.get('/api/projects', (req, res) => {
  res.json(dbService.getProjects());
});

app.get('/api/projects/:id', (req, res) => {
  const proj = dbService.getProject(req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  res.json(proj);
});

app.post('/api/projects', (req, res) => {
  try {
    const proj = req.body;
    if (!proj.id) proj.id = `proj-${Date.now()}`;
    const saved = dbService.saveProject(proj);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const proj = req.body;
    proj.id = req.params.id;
    const saved = dbService.saveProject(proj);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  const ok = dbService.deleteProject(req.params.id);
  res.json({ success: ok });
});

// 7. API Keys management endpoints (Server masks raw keys)
app.get('/api/keys', (req, res) => {
  res.json(dbService.getClientApiKeys());
});

app.post('/api/keys', (req, res) => {
  try {
    const { provider, label, key } = req.body;
    if (!key || !provider) {
      return res.status(400).json({ error: 'Provider and Key are required' });
    }
    const added = dbService.addApiKey(provider, label || '', key);
    res.json({
      id: added.id,
      provider: added.provider,
      label: added.label,
      maskedKey: added.maskedKey,
      enabled: added.enabled,
      status: added.status,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/keys/:id', (req, res) => {
  const ok = dbService.updateApiKey(req.params.id, req.body);
  res.json({ success: ok });
});

app.delete('/api/keys/:id', (req, res) => {
  const ok = dbService.deleteApiKey(req.params.id);
  res.json({ success: ok });
});

app.post('/api/keys/test', async (req, res) => {
  try {
    const { id } = req.body;
    const keyObj = dbService.getRawApiKeys().find((k) => k.id === id);
    if (!keyObj) return res.status(404).json({ error: 'Key not found' });

    let ok = false;
    if (keyObj.provider === 'gemini') {
      ok = await geminiService.testKey(keyObj.rawKey);
    } else {
      ok = await groqService.testKey(keyObj.rawKey);
    }

    dbService.recordKeyUsage(keyObj.id, ok);
    res.json({ success: ok, message: `${keyObj.provider.toUpperCase()} key is valid and responsive!` });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Key test failed' });
  }
});

// 8. Statistics and settings
app.get('/api/stats', (req, res) => {
  res.json(dbService.getStats());
});

app.get('/api/settings', (req, res) => {
  res.json(dbService.getSettings());
});

app.put('/api/settings', (req, res) => {
  const updated = dbService.updateSettings(req.body);
  res.json(updated);
});

// 9. CSV Export endpoint
app.post('/api/csv/export', (req, res) => {
  try {
    const { assets, marketplace } = req.body;
    if (!Array.isArray(assets)) {
      return res.status(400).json({ error: 'Assets array required' });
    }

    const csvContent = generateCsv(assets, marketplace || 'generic');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="stock_metadata_${marketplace || 'generic'}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. CSV Import endpoint
app.post('/api/csv/import', (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText) {
      return res.status(400).json({ error: 'CSV text is required' });
    }
    const result = parseCsv(csvText);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Stock Metadata Pro AI server running on http://localhost:${PORT}`);
  });
}

// Automatically start server in standalone / container / Cloud Run mode.
// In Vercel serverless functions, the exported app is handled by api/index.ts.
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export { app };
export default app;
