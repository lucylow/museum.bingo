import AsyncStorage from '@react-native-async-storage/async-storage';
import MLKitTranslate from 'react-native-mlkit-translate';

type TranslateOptions = { sourceLanguage: SupportedLanguage; targetLanguage: SupportedLanguage };
type Translator = { translate: (text: string) => Promise<string> };

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh';

interface LanguageModel {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  downloaded: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageModel[] = [
  { code: 'en', name: 'English', nativeName: 'English', downloaded: true },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol', downloaded: false },
  { code: 'fr', name: 'French', nativeName: 'Francais', downloaded: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', downloaded: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', downloaded: false },
];

class TranslationService {
  private static instance: TranslationService;
  private currentLanguage: SupportedLanguage = 'en';
  private translators: Map<SupportedLanguage, Translator> = new Map();
  private modelDownloadPromises: Map<SupportedLanguage, Promise<void>> = new Map();

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  async initialize(defaultLanguage?: SupportedLanguage): Promise<void> {
    const saved = await AsyncStorage.getItem('appLanguage');
    this.currentLanguage = (saved as SupportedLanguage) || defaultLanguage || 'en';

    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang.code === 'en') {
        lang.downloaded = true;
        continue;
      }
      try {
        lang.downloaded = await MLKitTranslate.isModelDownloaded(lang.code);
      } catch {
        lang.downloaded = false;
      }
    }
  }

  async downloadModel(language: SupportedLanguage, onProgress?: (progress: number) => void): Promise<void> {
    if (language === 'en') {
      return;
    }
    if (this.translators.has(language)) {
      return;
    }
    if (this.modelDownloadPromises.has(language)) {
      return this.modelDownloadPromises.get(language);
    }

    const downloadPromise = MLKitTranslate.downloadModel(language, onProgress)
      .then(async () => {
        const options: TranslateOptions = { sourceLanguage: 'en', targetLanguage: language };
        const translator = await MLKitTranslate.createTranslator(options);
        this.translators.set(language, translator);
        const langModel = SUPPORTED_LANGUAGES.find((item) => item.code === language);
        if (langModel) {
          langModel.downloaded = true;
        }
      })
      .finally(() => {
        this.modelDownloadPromises.delete(language);
      });

    this.modelDownloadPromises.set(language, downloadPromise);
    await downloadPromise;
  }

  async translate(text: string, targetLanguage?: SupportedLanguage): Promise<string> {
    const lang = targetLanguage || this.currentLanguage;
    if (!text || !text.trim()) {
      return text;
    }
    if (lang === 'en') {
      return text;
    }

    let translator = this.translators.get(lang);
    if (!translator) {
      await this.downloadModel(lang);
      translator = this.translators.get(lang);
      if (!translator) {
        return text;
      }
    }

    try {
      return await translator.translate(text);
    } catch (error) {
      console.warn('Translation failed:', error);
      return text;
    }
  }

  async batchTranslate(texts: string[], targetLanguage?: SupportedLanguage): Promise<string[]> {
    return Promise.all(texts.map((item) => this.translate(item, targetLanguage)));
  }

  async translateBingoCard(card: string[][], targetLanguage?: SupportedLanguage): Promise<string[][]> {
    const flat = card.flat();
    const translatedFlat = await this.batchTranslate(flat, targetLanguage);
    const size = card.length;
    const result: string[][] = [];
    for (let i = 0; i < size; i += 1) {
      result.push(translatedFlat.slice(i * size, (i + 1) * size));
    }
    return result;
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    if (language === this.currentLanguage) {
      return;
    }
    await this.downloadModel(language);
    this.currentLanguage = language;
    await AsyncStorage.setItem('appLanguage', language);
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  isModelDownloaded(language: SupportedLanguage): boolean {
    return SUPPORTED_LANGUAGES.find((item) => item.code === language)?.downloaded || false;
  }
}

export const translationService = TranslationService.getInstance();
