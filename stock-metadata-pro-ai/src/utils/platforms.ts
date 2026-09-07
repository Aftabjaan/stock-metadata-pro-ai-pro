import { Marketplace, MarketplaceProfile } from '../types';

export const MARKETPLACE_PROFILES: Record<Marketplace, MarketplaceProfile> = {
  adobe: {
    id: 'adobe',
    name: 'Adobe Stock',
    badge: 'Adobe Stock Contributor',
    titleMinLength: 15,
    titleMaxLength: 120,
    descriptionMinLength: 15,
    descriptionMaxLength: 200,
    minKeywords: 5,
    maxKeywords: 49, // Adobe Stock accepts up to 49-50, first 10 carry highest algorithmic weight
    allowedCategories: [
      'Animals', 'Buildings and Architecture', 'Business', 'Drinks', 'Environment',
      'States of Mind', 'Food', 'Graphic Resources', 'Hobbies and Leisure', 'Industry',
      'Landscape', 'Lifestyle', 'People', 'Plants and Flowers', 'Culture and Religion',
      'Science', 'Social Issues', 'Sports', 'Technology', 'Transport', 'Travel'
    ],
    csvColumns: [
      { key: 'originalFilename', header: 'Filename' },
      { key: 'title', header: 'Title' },
      { key: 'keywords', header: 'Keywords' },
      { key: 'category', header: 'Category' }
    ],
    rules: [
      'Top 10 keywords carry the highest search rank weight on Adobe Stock',
      'Max 49-50 keywords strictly enforced; duplicates will cause upload rejection',
      'No brand names, trademarks, or copyrighted terms',
      'Natural, professional titles without keyword stuffing'
    ],
    notes: 'Requires exact matching original filename. Keywords separated by commas.'
  },
  shutterstock: {
    id: 'shutterstock',
    name: 'Shutterstock',
    badge: 'Shutterstock Contributor',
    titleMinLength: 20,
    titleMaxLength: 200,
    descriptionMinLength: 20,
    descriptionMaxLength: 200,
    minKeywords: 7,
    maxKeywords: 50,
    allowedCategories: [
      'Abstract', 'Animals/Wildlife', 'The Arts', 'Backgrounds/Textures', 'Beauty/Fashion',
      'Buildings/Landmarks', 'Business/Finance', 'Celebrities', 'Education', 'Food and Drink',
      'Healthcare/Medical', 'Holidays', 'Illustrations/Clip-Art', 'Industrial', 'Interiors',
      'Miscellaneous', 'Nature', 'Parks/Outdoor', 'People', 'Religion', 'Science',
      'Signs/Symbols', 'Sports/Recreation', 'Technology', 'Transportation', 'Vectors', 'Vintage'
    ],
    csvColumns: [
      { key: 'originalFilename', header: 'Filename' },
      { key: 'description', header: 'Description' },
      { key: 'keywords', header: 'Keywords' },
      { key: 'category', header: 'Categories' }
    ],
    rules: [
      'Shutterstock uses Description as primary title (minimum 5 words/20 characters)',
      'Up to 50 keywords allowed (recommended 25-45 highly relevant tags)',
      'Select up to 2 primary categories',
      'Do not include camera technical specs in the description'
    ],
    notes: 'Uses Description as the main metadata field along with Keywords.'
  },
  freepik: {
    id: 'freepik',
    name: 'Freepik',
    badge: 'Freepik Contributor',
    titleMinLength: 10,
    titleMaxLength: 100,
    descriptionMinLength: 15,
    descriptionMaxLength: 150,
    minKeywords: 5,
    maxKeywords: 50,
    allowedCategories: [
      'Vectors', 'Photos', 'PSD', 'Icons', 'Business', 'Technology', 'Nature',
      'People', 'Backgrounds', 'Abstract', 'Food', 'Travel', 'Celebration', 'Education'
    ],
    csvColumns: [
      { key: 'originalFilename', header: 'File name' },
      { key: 'title', header: 'Title' },
      { key: 'keywords', header: 'Tags' }
    ],
    rules: [
      'Tags must be in English and accurately describe the vector or image elements',
      'Titles must describe the main subject and purpose directly',
      'Commercial relevance is prioritized over general descriptive concepts'
    ],
    notes: 'CSV format requires "File name", "Title", and "Tags".'
  },
  istock: {
    id: 'istock',
    name: 'iStock / Getty Images',
    badge: 'ESP Contributor Portal',
    titleMinLength: 15,
    titleMaxLength: 150,
    descriptionMinLength: 20,
    descriptionMaxLength: 250,
    minKeywords: 5,
    maxKeywords: 50,
    allowedCategories: [
      'Creative Stock', 'Editorial', 'Business & Finance', 'Healthcare & Medicine',
      'Science & Technology', 'Lifestyle & Culture', 'Nature & Landscapes', 'Travel & Destinations'
    ],
    csvColumns: [
      { key: 'originalFilename', header: 'original_filename' },
      { key: 'title', header: 'title' },
      { key: 'description', header: 'description' },
      { key: 'keywords', header: 'keywords' }
    ],
    rules: [
      'iStock matches keywords to Getty vocabulary disambiguation database',
      'Prioritize single concept words over long multi-word phrases',
      'Accurate depiction of ethnicity/age requires model release compliance'
    ],
    notes: 'Getty ESP CSV template uses lower-case snake_case headers.'
  },
  generic: {
    id: 'generic',
    name: 'Generic Stock',
    badge: 'Standard Universal CSV',
    titleMinLength: 15,
    titleMaxLength: 120,
    descriptionMinLength: 20,
    descriptionMaxLength: 200,
    minKeywords: 5,
    maxKeywords: 50,
    allowedCategories: [
      'Business', 'Technology', 'People', 'Nature', 'Food', 'Travel', 'Lifestyle',
      'Medical', 'Education', 'Backgrounds', 'Objects', 'Abstract', 'Animals',
      'Architecture', 'Industry', 'Fashion', 'Sports', 'Science'
    ],
    csvColumns: [
      { key: 'originalFilename', header: 'Filename' },
      { key: 'title', header: 'Title' },
      { key: 'description', header: 'Description' },
      { key: 'keywords', header: 'Keywords' },
      { key: 'category', header: 'Category' },
      { key: 'assetType', header: 'Asset Type' },
      { key: 'orientation', header: 'Orientation' },
      { key: 'aiGenerated', header: 'AI Generated' },
      { key: 'seoScore', header: 'SEO Score' }
    ],
    rules: [
      'Standard universal format compatible with all major microstock agencies and aggregators',
      'Includes orientation and AI-generation disclosure columns for platforms requiring AI flags'
    ],
    notes: 'Complete metadata export with all properties included.'
  }
};

export const DEFAULT_CATEGORIES = [
  'Business', 'Technology', 'People', 'Nature', 'Food', 'Travel', 'Lifestyle',
  'Medical', 'Education', 'Backgrounds', 'Objects', 'Abstract', 'Animals',
  'Architecture', 'Industry', 'Fashion', 'Sports', 'Science'
];
