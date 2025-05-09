import EMOJI_DATA from '@/lib/emojis-by-category.json';

const emojiCategories = {
  'Smileys & Emotion': '😀',
  'People & Body': '🙋',
  Component: '🧩',
  'Animals & Nature': '🐶',
  'Food & Drink': '🍕',
  'Travel & Places': '🗽',
  Activities: '⚽',
  Objects: '💡',
  Symbols: '♻️',
  Flags: '🇺🇳',
} as const;

type EmojiCategory = keyof typeof emojiCategories;

export type EmojiCategoryValue = (typeof emojiCategories)[EmojiCategory];

export type Emoji = {
  code: string[];
  emoji: string;
  name: string;
};

type EmojisByCategoryRaw = {
  '@version': string;
  '@author': string;
  '@copyright': string;
  '@see': string;
  '@license': string;
  emojis: Record<EmojiCategory, Emoji[]>;
};

export type EmojisByCategory = {
  '@version': string;
  '@author': string;
  '@copyright': string;
  '@see': string;
  '@license': string;
  emojis: Record<EmojiCategoryValue, Emoji[]>;
};

function convertRawToByEmoji(raw: EmojisByCategoryRaw): EmojisByCategory {
  const converted: EmojisByCategory = {
    '@version': raw['@version'],
    '@author': raw['@author'],
    '@copyright': raw['@copyright'],
    '@see': raw['@see'],
    '@license': raw['@license'],
    emojis: {} as Record<EmojiCategoryValue, Emoji[]>,
  };

  for (const key in raw.emojis) {
    const category = key as EmojiCategory;
    const emojiData = raw.emojis[category];

    let emojiKey: EmojiCategoryValue;

    switch (category) {
      case 'Smileys & Emotion':
        emojiKey = '😀';
        break;
      case 'People & Body':
        emojiKey = '🙋';
        break;
      case 'Component':
        emojiKey = '🧩';
        break;
      case 'Animals & Nature':
        emojiKey = '🐶';
        break;
      case 'Food & Drink':
        emojiKey = '🍕';
        break;
      case 'Travel & Places':
        emojiKey = '🗽';
        break;
      case 'Activities':
        emojiKey = '⚽';
        break;
      case 'Objects':
        emojiKey = '💡';
        break;
      case 'Symbols':
        emojiKey = '♻️';
        break;
      case 'Flags':
        emojiKey = '🇺🇳';
        break;
      default:
        throw new Error(`Unknown category: ${category}`);
    }

    converted.emojis[emojiKey] = emojiData;
  }

  return converted;
}

export async function loadEmojiData(filterOut?: EmojiCategory[]) {
  try {
    // data: EmojisByCategoryRaw
    const emojis: EmojisByCategoryRaw = { ...EMOJI_DATA };

    if (filterOut && filterOut.length > 0) {
      const filtered = filterOut.forEach((key) => delete emojis.emojis[key]);
    }

    return convertRawToByEmoji(emojis);
  } catch (error) {
    console.error('Error loading emoji data:', error);
  }
}
