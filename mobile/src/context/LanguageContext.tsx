import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  translationService,
} from '../services/TranslationService';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  availableLanguages: typeof SUPPORTED_LANGUAGES;
  isModelDownloading: boolean;
  downloadProgress: Record<SupportedLanguage, number>;
  refreshTranslations: () => void;
  refreshKey: number;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isModelDownloading, setIsModelDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<SupportedLanguage, number>>({
    en: 1,
    es: 0,
    fr: 0,
    de: 0,
    zh: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const initialize = async () => {
      await translationService.initialize();
      setCurrentLanguage(translationService.getCurrentLanguage());

      for (const lang of SUPPORTED_LANGUAGES) {
        if (lang.code === 'en') {
          continue;
        }
        const downloaded = translationService.isModelDownloaded(lang.code);
        setDownloadProgress((prev) => ({ ...prev, [lang.code]: downloaded ? 1 : 0 }));
      }
    };

    void initialize();
  }, []);

  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      if (lang === currentLanguage) {
        return;
      }
      setIsModelDownloading(true);
      try {
        await translationService.downloadModel(lang, (progress) => {
          setDownloadProgress((prev) => ({ ...prev, [lang]: progress }));
        });
        await translationService.setLanguage(lang);
        setCurrentLanguage(lang);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error('Failed to set language', error);
      } finally {
        setIsModelDownloading(false);
      }
    },
    [currentLanguage]
  );

  const refreshTranslations = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        availableLanguages: SUPPORTED_LANGUAGES,
        isModelDownloading,
        downloadProgress,
        refreshTranslations,
        refreshKey,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
