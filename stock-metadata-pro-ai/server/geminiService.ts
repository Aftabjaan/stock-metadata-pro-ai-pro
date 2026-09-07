import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { PromptBuildOptions, buildSystemInstruction, buildUserPrompt } from './promptBuilder';
import { validateAndSanitizeMetadata } from './metadataValidator';
import { StockMetadata } from '../src/types';

export class GeminiService {
  public async generateMetadata(
    imageBase64: string,
    mimeType: string,
    options: PromptBuildOptions,
    apiKey: string,
    modelName: string = 'gemini-3.1-flash-lite'
  ): Promise<StockMetadata> {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = buildSystemInstruction(options);
    const prompt = buildUserPrompt(options);

    // Strip data url prefix if present
    let rawBase64 = imageBase64;
    let finalMime = mimeType;
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      finalMime = parts[0].replace('data:', '');
      rawBase64 = parts[1];
    }

    const imagePart = {
      inlineData: {
        mimeType: finalMime || 'image/jpeg',
        data: rawBase64,
      },
    };

    const textPart = {
      text: prompt,
    };

    // Candidate models to try in sequence if a model experiences high demand or rate limits
    const candidateModels = Array.from(
      new Set([
        modelName,
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash',
      ].filter(Boolean))
    );

    let lastError: any = null;

    for (const currentModel of candidateModels) {
      let retries = 2;
      let delay = 1000;

      while (retries >= 0) {
        try {
          const response: GenerateContentResponse = await ai.models.generateContent({
            model: currentModel,
            contents: { parts: [imagePart, textPart] },
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.3, // Low temperature for high factual consistency
            },
          });

          const rawText = response.text || '{}';
          let parsed: any;
          try {
            parsed = JSON.parse(rawText);
          } catch (jsonErr) {
            // Attempt markdown fence extraction if present
            const match = rawText.match(/```(?:json)?([\s\S]*?)```/);
            if (match) {
              parsed = JSON.parse(match[1].trim());
            } else {
              throw new Error(`Failed to parse AI output as JSON: ${rawText.slice(0, 100)}...`);
            }
          }

          return validateAndSanitizeMetadata(parsed, {
            marketplace: options.marketplace,
            defaultAssetType: options.assetType,
            defaultAiGenerated: options.aiGeneratedFlag,
          });
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || String(err);
          const isTransientOrQuota =
            msg.includes('429') ||
            msg.includes('quota') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('503') ||
            msg.includes('500') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('high demand') ||
            msg.includes('overloaded');

          if (isTransientOrQuota && retries > 0) {
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
            retries--;
            continue;
          }

          // If model is experiencing high demand (503), immediately try next candidate model
          if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
            console.warn(`Model ${currentModel} returned 503/high demand, trying fallback model...`);
            break;
          }

          break; // move to next model if available
        }
      }
    }

    throw lastError || new Error('Gemini generation failed on all available models.');
  }

  // Quick optimizer functions (Title, Keywords, Description)
  public async optimizeTitle(
    currentTitle: string,
    context: { category?: string; keywords?: string[]; marketplace?: string },
    apiKey: string
  ): Promise<string> {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `You are a microstock SEO specialist. Optimize the following stock image title for higher search conversion and algorithmic relevance on ${context.marketplace || 'stock marketplaces'}.
Current Title: "${currentTitle}"
Context Keywords: ${(context.keywords || []).slice(0, 8).join(', ')}
Requirements:
- Preserve factual meaning completely; do not invent new elements.
- Keep it concise, natural, professional, and free of commas or keyword stuffing.
- Return ONLY the optimized title string, no quotes, no commentary.`,
        });

        return (response.text || currentTitle).trim().replace(/^["']|["']$/g, '');
      } catch (err) {
        console.warn(`optimizeTitle failed on ${model}, trying fallback...`);
      }
    }

    return currentTitle;
  }

  public async optimizeDescription(
    currentDescription: string,
    title: string,
    apiKey: string
  ): Promise<string> {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `You are a microstock editor. Optimize the following stock image description.
Title: "${title}"
Current Description: "${currentDescription}"
Requirements:
- Ensure 1-2 grammatically impeccable, stock-friendly sentences.
- Factual and professional; zero buzzwords or keyword stuffing.
- Return ONLY the description text, no quotes, no extra remarks.`,
        });

        return (response.text || currentDescription).trim().replace(/^["']|["']$/g, '');
      } catch (err) {
        console.warn(`optimizeDescription failed on ${model}, trying fallback...`);
      }
    }

    return currentDescription;
  }

  public async testKey(apiKey: string): Promise<boolean> {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of modelsToTry) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: 'Ping',
        });
        if (res.text) return true;
      } catch (err) {
        console.warn(`testKey failed on ${model}, trying fallback...`);
      }
    }
    return false;
  }
}

export const geminiService = new GeminiService();
