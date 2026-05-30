import { useCallback, useEffect, useRef, useState } from 'react';
import { SupportedLanguage, translationService } from '../services/TranslationService';

interface UseTranslatedTextOptions {
  debounceMs?: number;
  skipIfEmpty?: boolean;
}

export function useTranslatedText(
  originalText: string,
  options: UseTranslatedTextOptions = {}
): { translated: string; isTranslating: boolean; error: Error | null } {
  const { debounceMs = 100, skipIfEmpty = true } = options;
  const [translated, setTranslated] = useState(originalText);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const currentLangRef = useRef<SupportedLanguage>('en');

  const performTranslation = useCallback(
    async (text: string) => {
      const currentLang = translationService.getCurrentLanguage();
      currentLangRef.current = currentLang;
      if (currentLang === 'en' || (skipIfEmpty && !text?.trim())) {
        setTranslated(text);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translationService.translate(text, currentLang);
        if (currentLangRef.current === currentLang) {
          setTranslated(result);
          setError(null);
        }
      } catch (err) {
        setError(err as Error);
        setTranslated(text);
      } finally {
        setIsTranslating(false);
      }
    },
    [skipIfEmpty]
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      void performTranslation(originalText);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debounceMs, originalText, performTranslation]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (translationService.getCurrentLanguage() !== currentLangRef.current) {
        void performTranslation(originalText);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [originalText, performTranslation]);

  return { translated, isTranslating, error };
}
