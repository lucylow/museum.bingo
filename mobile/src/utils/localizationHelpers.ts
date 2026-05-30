import { SupportedLanguage, translationService } from '../services/TranslationService';

export interface LocalizedContent {
  en: string;
  es?: string;
  fr?: string;
  de?: string;
  zh?: string;
}

export async function getLocalizedText(
  content: LocalizedContent | string,
  targetLang?: SupportedLanguage
): Promise<string> {
  const lang = targetLang || translationService.getCurrentLanguage();
  if (typeof content === 'string') {
    return translationService.translate(content, lang);
  }
  if (content[lang]) {
    return content[lang] as string;
  }
  return content.en;
}

class TranslationCache {
  private cache: Map<string, Map<SupportedLanguage, string>> = new Map();

  async get(original: string, lang: SupportedLanguage): Promise<string> {
    if (!this.cache.has(original)) {
      this.cache.set(original, new Map());
    }
    const langCache = this.cache.get(original)!;
    if (langCache.has(lang)) {
      return langCache.get(lang)!;
    }
    const translated = await translationService.translate(original, lang);
    langCache.set(lang, translated);
    return translated;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const translationCache = new TranslationCache();

export async function t(key: string, fallback: string, lang?: SupportedLanguage): Promise<string> {
  void key;
  return translationCache.get(fallback, lang || translationService.getCurrentLanguage());
}

export async function detectDeviceLanguage(): Promise<SupportedLanguage> {
  const { getLocales } = require('react-native-localize');
  const locales = getLocales();
  if (locales.length > 0) {
    const languageCode = locales[0].languageCode;
    const supported: SupportedLanguage[] = ['en', 'es', 'fr', 'de', 'zh'];
    if (supported.includes(languageCode as SupportedLanguage)) {
      return languageCode as SupportedLanguage;
    }
  }
  return 'en';
}

export async function preDownloadPopularLanguages(): Promise<void> {
  const popular: SupportedLanguage[] = ['es', 'zh', 'fr'];
  for (const lang of popular) {
    if (!translationService.isModelDownloaded(lang)) {
      translationService.downloadModel(lang).catch((err) => {
        console.warn(`Failed to pre-download ${lang}:`, err);
      });
    }
  }
}

export function safeTranslate(text: string, lang?: SupportedLanguage): Promise<string> {
  return translationService.translate(text, lang).catch((err) => {
    console.error('Translation error:', err);
    return text;
  });
}
