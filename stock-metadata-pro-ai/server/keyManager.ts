import { dbService, StoredApiKey } from './dbService';
import { geminiService } from './geminiService';
import { groqService } from './groqService';
import { AIProvider, PromptBuildOptions, StockMetadata } from '../src/types';

export class KeyManager {
  private geminiIndex = 0;
  private groqIndex = 0;

  public getAvailableKeys(provider: 'gemini' | 'groq'): StoredApiKey[] {
    let allKeys = dbService.getRawApiKeys().filter((k) => k.provider === provider && k.enabled);

    // If no enabled keys for Gemini, try ensuring the environment secret key is activated
    if (allKeys.length === 0 && provider === 'gemini') {
      const envKey = dbService.ensureEnvKeyActive('gemini');
      if (envKey) {
        allKeys = [envKey];
      }
    }

    if (allKeys.length === 0) return [];

    const now = Date.now();
    // Prioritize keys not currently in cooldown
    const notInCooldown = allKeys.filter((k) => {
      if (k.status === 'cooldown' && k.cooldownUntil && k.cooldownUntil > now) {
        return false;
      }
      return true;
    });

    if (notInCooldown.length > 0) {
      return notInCooldown;
    }

    // If all are in cooldown, sort by nearest cooldown expiry
    return [...allKeys].sort((a, b) => (a.cooldownUntil || 0) - (b.cooldownUntil || 0));
  }

  public getAvailableKey(provider: 'gemini' | 'groq'): StoredApiKey | null {
    const available = this.getAvailableKeys(provider);
    if (available.length === 0) return null;

    // Round-robin
    if (provider === 'gemini') {
      const selected = available[this.geminiIndex % available.length];
      this.geminiIndex = (this.geminiIndex + 1) % available.length;
      return selected;
    } else {
      const selected = available[this.groqIndex % available.length];
      this.groqIndex = (this.groqIndex + 1) % available.length;
      return selected;
    }
  }

  public async executeGeneration(
    imageBase64: string,
    mimeType: string,
    options: PromptBuildOptions,
    providerPref?: AIProvider
  ): Promise<{ metadata: StockMetadata; provider: string; keyLabel: string }> {
    const settings = dbService.getSettings();
    const effectiveProvider = providerPref || settings.preferredProvider;
    const startTime = Date.now();

    // Check which providers ACTUALLY have active keys
    const availableGemini = this.getAvailableKeys('gemini');
    const availableGroq = this.getAvailableKeys('groq');

    // Determine order of provider attempts based on real availability
    const providersToTry: ('gemini' | 'groq')[] = [];
    if (effectiveProvider === 'gemini') {
      providersToTry.push('gemini');
    } else if (effectiveProvider === 'groq') {
      providersToTry.push('groq');
    } else {
      // 'auto' mode: prefer providers that have at least one usable key
      if (availableGemini.length > 0) {
        providersToTry.push('gemini');
      }
      if (availableGroq.length > 0) {
        providersToTry.push('groq');
      }

      // If neither has keys yet, fallback to gemini (which will attempt env key or report helpful message)
      if (providersToTry.length === 0) {
        providersToTry.push('gemini');
      }
    }

    let lastError: any = null;

    for (const provider of providersToTry) {
      const candidateKeys = this.getAvailableKeys(provider);
      if (candidateKeys.length === 0) {
        if (!lastError) {
          lastError = new Error(`No active ${provider.toUpperCase()} API key configured in Key Manager.`);
        }
        continue;
      }

      // Try each available key for this provider before falling back to next provider
      for (const keyObj of candidateKeys) {
        try {
          let metadata: StockMetadata;
          if (provider === 'gemini') {
            metadata = await geminiService.generateMetadata(
              imageBase64,
              mimeType,
              options,
              keyObj.rawKey,
              settings.geminiModel || 'gemini-3.1-flash-lite'
            );
          } else {
            metadata = await groqService.generateMetadata(
              imageBase64,
              mimeType,
              options,
              keyObj.rawKey,
              settings.groqModel || 'llama-3.2-11b-vision-preview'
            );
          }

          const duration = Date.now() - startTime;
          dbService.recordKeyUsage(keyObj.id, true);
          dbService.recordRequestStats(true, duration, false, provider);

          return {
            metadata,
            provider,
            keyLabel: keyObj.label,
          };
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const isRateLimit = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');

          dbService.recordKeyUsage(keyObj.id, false, errMsg, isRateLimit);
          dbService.recordRequestStats(false, Date.now() - startTime, isRateLimit, provider);

          console.error(`Provider ${provider} (${keyObj.label}) error:`, errMsg);

          // If there are other candidate keys for this provider, try the next key
          continue;
        }
      }
    }

    throw lastError || new Error('All configured AI providers and keys failed.');
  }
}

export const keyManager = new KeyManager();
