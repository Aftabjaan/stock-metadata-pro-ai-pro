import { StockMetadata, SeoBreakdown, SeoCheck, Marketplace } from '../types';
import { MARKETPLACE_PROFILES } from './platforms';

export function calculateSeoScore(
  metadata: Partial<StockMetadata>,
  platform: Marketplace = 'generic'
): SeoBreakdown {
  const profile = MARKETPLACE_PROFILES[platform] || MARKETPLACE_PROFILES.generic;
  const checks: SeoCheck[] = [];
  const recommendations: string[] = [];

  let score = 100;

  const title = (metadata.title || '').trim();
  const description = (metadata.description || '').trim();
  const keywords = metadata.keywords || [];
  const keywordStrings = keywords.map(k => (typeof k === 'string' ? k : k.word).toLowerCase().trim()).filter(Boolean);

  // 1. Title Checks
  if (!title) {
    score -= 30;
    checks.push({
      label: 'Title exists',
      passed: false,
      tip: 'Provide an accurate, descriptive commercial title.',
      category: 'title'
    });
    recommendations.push('Title is missing. Stock agencies require a descriptive title.');
  } else {
    if (title.length < profile.titleMinLength) {
      score -= 10;
      checks.push({
        label: `Title length (min ${profile.titleMinLength} chars)`,
        passed: false,
        tip: `Current length is ${title.length}. Stock buyers search for more descriptive detail.`,
        category: 'title'
      });
      recommendations.push(`Title is too short (${title.length} chars). Aim for at least ${profile.titleMinLength} characters.`);
    } else if (title.length > profile.titleMaxLength) {
      score -= 8;
      checks.push({
        label: `Title within limit (max ${profile.titleMaxLength} chars)`,
        passed: false,
        tip: `Title is ${title.length} chars, which exceeds the ${profile.titleMaxLength} character ceiling.`,
        category: 'title'
      });
      recommendations.push(`Title exceeds ${profile.titleMaxLength} chars. Trim unnecessary words.`);
    } else {
      checks.push({
        label: `Optimal title length (${profile.titleMinLength}-${profile.titleMaxLength} chars)`,
        passed: true,
        tip: 'Title length is well-balanced for search indexers.',
        category: 'title'
      });
    }

    // Check for comma stuffing in title (e.g. "dog, cat, pet, puppy")
    const commaCount = (title.match(/,/g) || []).length;
    if (commaCount > 3) {
      score -= 15;
      checks.push({
        label: 'No comma keyword stuffing in title',
        passed: false,
        tip: 'Avoid list-like titles. Write natural English sentences.',
        category: 'title'
      });
      recommendations.push('Avoid comma-separated keyword lists in titles; write natural descriptions.');
    } else {
      checks.push({
        label: 'Natural title phrasing',
        passed: true,
        tip: 'Title avoids artificial keyword stuffing patterns.',
        category: 'title'
      });
    }
  }

  // 2. Keyword Count & Duplication Checks
  const uniqueKeywords = new Set(keywordStrings);
  const duplicateCount = keywordStrings.length - uniqueKeywords.size;

  if (duplicateCount > 0) {
    score -= Math.min(15, duplicateCount * 5);
    checks.push({
      label: 'No duplicate keywords',
      passed: false,
      tip: `Found ${duplicateCount} duplicate keyword(s). Stock platforms reject files with duplicates.`,
      category: 'keywords'
    });
    recommendations.push(`Remove ${duplicateCount} duplicate keyword(s) to avoid platform rejection.`);
  } else {
    checks.push({
      label: 'Zero duplicate keywords',
      passed: true,
      tip: 'All keywords are distinct.',
      category: 'keywords'
    });
  }

  if (keywordStrings.length < profile.minKeywords) {
    score -= 25;
    checks.push({
      label: `Minimum keywords (${profile.minKeywords}+)`,
      passed: false,
      tip: `Only ${keywordStrings.length} keywords provided. Stock engines require at least ${profile.minKeywords}.`,
      category: 'keywords'
    });
    recommendations.push(`Add more keywords. At least ${profile.minKeywords} required for ${profile.name}.`);
  } else if (keywordStrings.length > profile.maxKeywords) {
    score -= 15;
    checks.push({
      label: `Within keyword ceiling (max ${profile.maxKeywords})`,
      passed: false,
      tip: `Provided ${keywordStrings.length} keywords. ${profile.name} allows max ${profile.maxKeywords}.`,
      category: 'keywords'
    });
    recommendations.push(`Keyword count exceeds limit (${profile.maxKeywords}). Truncate ${keywordStrings.length - profile.maxKeywords} tags.`);
  } else {
    checks.push({
      label: `Keyword quantity (${profile.minKeywords}-${profile.maxKeywords})`,
      passed: true,
      tip: `Good tag density (${keywordStrings.length} keywords).`,
      category: 'keywords'
    });
  }

  // Check top 10 primary keywords
  const primaryCount = keywords.filter(k => (typeof k === 'object' ? k.priority === 'primary' : false)).length;
  if (keywords.length >= 10 && primaryCount < 3) {
    score -= 5;
    checks.push({
      label: 'High-weight primary keywords defined',
      passed: false,
      tip: 'Top keywords carry the strongest search weight in Adobe Stock and Shutterstock algorithms.',
      category: 'keywords'
    });
    recommendations.push('Organize top 5-10 core subject keywords as Primary tags.');
  } else {
    checks.push({
      label: 'Strong primary keyword hierarchy',
      passed: true,
      tip: 'Primary keywords are appropriately prioritized.',
      category: 'keywords'
    });
  }

  // 3. Description Checks
  if (platform === 'shutterstock' || platform === 'istock' || platform === 'generic') {
    if (!description || description.length < profile.descriptionMinLength) {
      score -= 10;
      checks.push({
        label: `Description length (${profile.descriptionMinLength}+ chars)`,
        passed: false,
        tip: `${profile.name} relies on descriptions for buyer search queries.`,
        category: 'description'
      });
      recommendations.push(`Add a detailed description for better visibility on ${profile.name}.`);
    } else {
      checks.push({
        label: 'Comprehensive description',
        passed: true,
        tip: 'Description provides good context without spam.',
        category: 'description'
      });
    }
  }

  // 4. Category Check
  if (!metadata.category) {
    score -= 5;
    checks.push({
      label: 'Category selected',
      passed: false,
      tip: 'Stock catalogs categorize files for filtered browsing.',
      category: 'platform'
    });
    recommendations.push('Assign a primary category to assist agency taxonomy filters.');
  } else {
    checks.push({
      label: 'Category assigned',
      passed: true,
      tip: `Mapped to "${metadata.category}".`,
      category: 'platform'
    });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let rating: SeoBreakdown['rating'] = 'Poor';
  if (finalScore >= 90) rating = 'Excellent';
  else if (finalScore >= 75) rating = 'Good';
  else if (finalScore >= 50) rating = 'Needs Improvement';

  return {
    score: finalScore,
    rating,
    checks,
    recommendations
  };
}
