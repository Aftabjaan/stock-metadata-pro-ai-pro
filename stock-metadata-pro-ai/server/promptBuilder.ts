import { Marketplace, AssetType, TitleSettings, KeywordSettings } from '../src/types';
import { MARKETPLACE_PROFILES } from '../src/utils/platforms';

export interface PromptBuildOptions {
  marketplace: Marketplace;
  assetType: AssetType;
  titleSettings: TitleSettings;
  keywordSettings: KeywordSettings;
  aiGeneratedFlag?: boolean;
}

export function buildSystemInstruction(options: PromptBuildOptions): string {
  const profile = MARKETPLACE_PROFILES[options.marketplace] || MARKETPLACE_PROFILES.generic;

  return `You are a world-class professional stock metadata specialist and microstock SEO expert.
Your mission is to generate rigorously accurate, commercially viable stock metadata (Title, Description, Keywords, Category, Orientation) strictly based on the provided image.

CRITICAL NON-HALLUCINATION DIRECTIVES:
1. FACTUAL HONESTY: Only describe what is visibly evident in the image. Never invent specific people identities, celebrity names, brand names, registered trademarks, copyrighted characters, fictitious events, or exact locations unless unmistakably identifiable (e.g. Eiffel Tower).
2. ACCURACY OVER SPAM: Stock search algorithms (Adobe Stock, Shutterstock, Freepik, Getty Images) severely penalize keyword stuffing, deceptive tags, and irrelevant popular buzzwords.
3. STRUCTURED JSON: You must output ONLY a valid JSON object matching the requested schema. No markdown formatting, no code fences, no introductory or concluding text.

TARGET MARKETPLACE: ${profile.name}
Platform Rules & Guidelines:
${profile.rules.map(r => `- ${r}`).join('\n')}
Supported Categories: ${profile.allowedCategories.join(', ')}`;
}

export function buildUserPrompt(options: PromptBuildOptions): string {
  const profile = MARKETPLACE_PROFILES[options.marketplace] || MARKETPLACE_PROFILES.generic;
  const { titleSettings, keywordSettings, assetType } = options;

  // Title section instructions
  let titleInstruction = '';
  switch (titleSettings.mode) {
    case 'seo_balanced':
      titleInstruction = 'Create an SEO-balanced commercial title clearly stating the primary subject, setting, and action. Do not repeat words.';
      break;
    case 'descriptive':
      titleInstruction = 'Provide a factual, descriptive title depicting the scene with visual precision and natural phrasing.';
      break;
    case 'commercial':
      titleInstruction = 'Focus on the commercial stock application, industry utility, concept, and business context.';
      break;
    case 'minimal':
      titleInstruction = 'Provide a clean, concise, minimal title highlighting only the core subject matter.';
      break;
    case 'custom':
      titleInstruction = titleSettings.customPrompt || 'Create a tailored commercial stock title.';
      break;
  }

  let titleLengthRule = '';
  switch (titleSettings.length) {
    case 'short':
      titleLengthRule = 'Length: approximately 30 to 50 characters.';
      break;
    case 'medium':
      titleLengthRule = `Length: approximately 50 to 90 characters (must be between ${profile.titleMinLength} and ${profile.titleMaxLength} chars).`;
      break;
    case 'long':
      titleLengthRule = `Length: approximately 90 to 140 characters (up to platform max of ${profile.titleMaxLength} chars).`;
      break;
    case 'custom':
      titleLengthRule = `Length: maximum ${titleSettings.customMaxLength || profile.titleMaxLength} characters.`;
      break;
  }

  // Keyword section instructions
  let keywordStrategyInstruction = '';
  switch (keywordSettings.strategy) {
    case 'balanced':
      keywordStrategyInstruction = 'Provide a balanced mix of subject specifics, conceptual terms, environment, mood, and industry keywords.';
      break;
    case 'highly_relevant':
      keywordStrategyInstruction = 'Strictly focus on visible objects, colors, actions, and direct physical components.';
      break;
    case 'commercial':
      keywordStrategyInstruction = 'Emphasize advertising concepts, copy space, lifestyle/business themes, and marketing search terms.';
      break;
    case 'concept_focused':
      keywordStrategyInstruction = 'Emphasize metaphorical, abstract, and emotional concepts represented by the visual (e.g., success, growth, serenity).';
      break;
    case 'minimal':
      keywordStrategyInstruction = 'Supply only the most essential, high-converting core keywords without filler.';
      break;
  }

  const targetCount = Math.min(keywordSettings.targetCount || 40, profile.maxKeywords);
  const minCount = Math.max(keywordSettings.minCount || 20, profile.minKeywords);

  return `Please analyze this stock image and generate metadata adhering to the following distinct specifications:

=== ASSET CLASSIFICATION ===
Asset Type: ${assetType}
Flag AI-Generated: ${options.aiGeneratedFlag ? 'Yes' : 'No'}

=== TITLE INSTRUCTIONS ===
${titleInstruction}
${titleLengthRule}
Important: Never use commas or keyword lists in the title. Write a natural sentence fragment.

=== KEYWORD INSTRUCTIONS ===
Keyword Strategy: ${keywordStrategyInstruction}
Target Keyword Count: Exactly ${targetCount} keywords (minimum ${minCount}, maximum ${profile.maxKeywords}).
Order: Strongest, most directly relevant keywords must come FIRST.
Keyword Priority Classification:
- Mark the top 5 to 10 most essential subject keywords as "primary"
- Mark the next 10 to 20 contextual/environmental keywords as "secondary"
- Mark the remaining conceptual/style keywords as "supporting"
Assign an internal relevance score from 0 to 100 for each keyword.

=== DESCRIPTION INSTRUCTIONS ===
Write an accurate, natural, professional stock description (1 to 2 sentences) describing the composition, lighting, subject, and atmosphere.

=== CATEGORY & ORIENTATION ===
Select the single best fitting category from: ${profile.allowedCategories.join(', ')}.
Detect orientation: "horizontal" | "vertical" | "square" | "panoramic".

OUTPUT MUST BE VALID RAW JSON with this exact schema:
{
  "title": "string",
  "description": "string",
  "category": "string",
  "assetType": "${assetType}",
  "orientation": "horizontal | vertical | square | panoramic",
  "aiGenerated": ${options.aiGeneratedFlag ? 'true' : 'false'},
  "keywords": [
    {
      "word": "string (lowercase, clean)",
      "score": number (0-100),
      "priority": "primary | secondary | supporting"
    }
  ]
}`;
}
