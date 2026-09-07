import { StockMetadata, KeywordItem, Marketplace } from '../src/types';
import { MARKETPLACE_PROFILES } from '../src/utils/platforms';
import { calculateSeoScore } from '../src/utils/seoEngine';

const BANNED_FILLER_WORDS = new Set([
  'image', 'photo', 'picture', 'photography', 'stock', 'wallpaper',
  'high quality', 'hd', '4k', '8k', 'best', 'nice', 'great', 'awesome',
  'super', 'beautiful image', 'stock photo', 'generated', 'free'
]);

const BANNED_BRANDS = new Set([
  'apple', 'iphone', 'ipad', 'macbook', 'samsung', 'galaxy', 'nike', 'adidas',
  'coca cola', 'pepsi', 'mcdonalds', 'starbucks', 'disney', 'marvel', 'lego',
  'sony', 'playstation', 'xbox', 'microsoft', 'google', 'facebook', 'instagram'
]);

export function cleanKeyword(word: string): string {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove special punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateAndSanitizeMetadata(
  rawJson: any,
  options: { marketplace?: Marketplace; defaultAssetType?: any; defaultAiGenerated?: boolean } = {}
): StockMetadata {
  const marketplace = options.marketplace || 'generic';
  const profile = MARKETPLACE_PROFILES[marketplace] || MARKETPLACE_PROFILES.generic;

  // Title validation
  let title = typeof rawJson?.title === 'string' ? rawJson.title.trim() : '';
  title = title.replace(/\s+/g, ' ');
  if (title.length > profile.titleMaxLength) {
    // Cut cleanly at last word boundary
    const truncated = title.slice(0, profile.titleMaxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    title = lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated;
  }

  // Description validation
  let description = typeof rawJson?.description === 'string' ? rawJson.description.trim() : '';
  description = description.replace(/\s+/g, ' ');
  if (!description && title) {
    description = title;
  }

  // Keywords validation & deduplication
  const rawKeywords: any[] = Array.isArray(rawJson?.keywords) ? rawJson.keywords : [];
  const sanitizedKeywords: KeywordItem[] = [];
  const seenWords = new Set<string>();

  rawKeywords.forEach((item, index) => {
    let word = '';
    let score = 80;
    let priority: 'primary' | 'secondary' | 'supporting' = 'secondary';

    if (typeof item === 'string') {
      word = cleanKeyword(item);
      score = Math.max(50, 95 - index);
      priority = index < 8 ? 'primary' : index < 25 ? 'secondary' : 'supporting';
    } else if (item && typeof item === 'object') {
      word = cleanKeyword(item.word || item.tag || item.keyword || '');
      score = typeof item.score === 'number' ? Math.min(100, Math.max(0, item.score)) : 80;
      if (item.priority === 'primary' || item.priority === 'secondary' || item.priority === 'supporting') {
        priority = item.priority;
      } else {
        priority = index < 8 ? 'primary' : index < 25 ? 'secondary' : 'supporting';
      }
    }

    if (!word || word.length < 2 || word.length > 50) return;
    if (seenWords.has(word)) return;
    if (BANNED_FILLER_WORDS.has(word)) return;
    if (BANNED_BRANDS.has(word)) return;

    seenWords.add(word);
    sanitizedKeywords.push({ word, score, priority });
  });

  // Limit to platform max
  const finalKeywords = sanitizedKeywords.slice(0, profile.maxKeywords);

  // Category validation
  let category = typeof rawJson?.category === 'string' ? rawJson.category.trim() : '';
  if (!profile.allowedCategories.includes(category)) {
    // Find closest match or default to first
    const matched = profile.allowedCategories.find(c => c.toLowerCase() === category.toLowerCase());
    category = matched || profile.allowedCategories[0] || 'General';
  }

  // Orientation
  const validOrientations = ['horizontal', 'vertical', 'square', 'panoramic'];
  const orientation = validOrientations.includes(rawJson?.orientation) ? rawJson.orientation : 'horizontal';

  // Asset type
  const validAssetTypes = ['photo', 'vector', 'illustration', '3d_render'];
  const assetType = validAssetTypes.includes(rawJson?.assetType)
    ? rawJson.assetType
    : options.defaultAssetType || 'photo';

  const aiGenerated = typeof rawJson?.aiGenerated === 'boolean'
    ? rawJson.aiGenerated
    : Boolean(options.defaultAiGenerated);

  const partialMetadata: StockMetadata = {
    title,
    description,
    keywords: finalKeywords,
    category,
    assetType,
    orientation,
    aiGenerated,
    seoScore: 0
  };

  // Compute live SEO score & diagnostics
  const seoBreakdown = calculateSeoScore(partialMetadata, marketplace);
  partialMetadata.seoScore = seoBreakdown.score;
  partialMetadata.seoBreakdown = seoBreakdown;

  return partialMetadata;
}
