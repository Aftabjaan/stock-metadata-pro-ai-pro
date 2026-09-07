import { PromptBuildOptions, buildSystemInstruction, buildUserPrompt } from './promptBuilder';
import { validateAndSanitizeMetadata } from './metadataValidator';
import { StockMetadata } from '../src/types';

export class GroqService {
  private baseUrl = 'https://api.groq.com/openai/v1';

  public async generateMetadata(
    imageBase64: string,
    mimeType: string,
    options: PromptBuildOptions,
    apiKey: string,
    modelName: string = 'llama-3.2-11b-vision-preview'
  ): Promise<StockMetadata> {
    const systemInstruction = buildSystemInstruction(options);
    const userPrompt = buildUserPrompt(options);

    // Ensure proper data URL format for OpenAI-compatible vision
    let dataUrl = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      dataUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;
    }

    const payload = {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: systemInstruction,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    };

    let retries = 2;
    let delay = 1000;
    let lastError: any = null;

    while (retries >= 0) {
      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 429 && retries > 0) {
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
            retries--;
            continue;
          }
          throw new Error(`Groq API returned ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content || '{}';

        let parsed: any;
        try {
          parsed = JSON.parse(rawContent);
        } catch (jsonErr) {
          const match = rawContent.match(/```(?:json)?([\s\S]*?)```/);
          if (match) {
            parsed = JSON.parse(match[1].trim());
          } else {
            throw new Error(`Failed to parse Groq response as JSON: ${rawContent.slice(0, 100)}...`);
          }
        }

        return validateAndSanitizeMetadata(parsed, {
          marketplace: options.marketplace,
          defaultAssetType: options.assetType,
          defaultAiGenerated: options.aiGeneratedFlag,
        });
      } catch (err: any) {
        lastError = err;
        if (retries > 0 && err.message?.includes('429')) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          retries--;
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Groq generation failed');
  }

  public async testKey(apiKey: string, model: string = 'llama-3.2-11b-vision-preview'): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Groq key test failed (${res.status}): ${txt}`);
    }
    return true;
  }
}

export const groqService = new GroqService();
