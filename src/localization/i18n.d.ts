export type LocaleCode =
    | "en"
    | "es"
    | "zh"
    | "ar"
    | "ru"
    | "bn"
    | "ht"
    | "ko"
    | "tl"
    | "yi"
    | "it"
    | `${string}-${string}`;

export type Directionality = "ltr" | "rtl";
export type NumberFormatStyle = "decimal" | "percent" | "compact";
export type DateFormatStyle = "short" | "long";
export type FallbackPolicy = "strict_english" | "base_locale_then_english";
export type ContentTranslationState = "complete" | "partial" | "missing";

export interface LocaleDisplayName {
    displayName: string;
    englishName: string;
    nativeName: string;
}

export interface SupportedLanguage extends LocaleDisplayName {
    code: LocaleCode;
    direction: Directionality;
    priority: boolean;
    state: ContentTranslationState;
}

export type TranslationKey = string;
export type TranslationBundle = Record<string, unknown>;

export interface LanguagePack {
    locale: LocaleCode;
    direction: Directionality;
    translationState: ContentTranslationState;
    bundle: TranslationBundle;
    fallbackBundle: TranslationBundle;
}

export interface LocalizedContent<T = string> {
    locale: LocaleCode;
    value: T;
    translationState: ContentTranslationState;
}

export type PluralizationRule = (count: number) => "one" | "other";

export interface I18nApi {
    t(key: TranslationKey, params?: Record<string, unknown>, options?: { locale?: LocaleCode }): string;
    setLocale(locale: LocaleCode): void;
    getLocale(): LocaleCode;
    getDirection(locale?: LocaleCode): Directionality;
    onChange(listener: (locale: LocaleCode) => void): () => void;
    hasTranslation(key: TranslationKey, locale?: LocaleCode): boolean;
    getLanguagePack(locale?: LocaleCode): LanguagePack;
    getSupportedLanguages(): SupportedLanguage[];
    normalizeLocale(locale: LocaleCode): LocaleCode;
    formatters(): {
        number(value: number, style?: NumberFormatStyle): string;
        date(value: Date | number | string, style?: DateFormatStyle): string;
    };
}

declare global {
    interface Window {
        I18n: I18nApi;
    }
}
