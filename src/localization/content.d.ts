import type { ContentTranslationState, LocaleCode } from "./i18n";

export interface EducationalChunk {
    title: string;
    shortExplanation: string;
    lookClosely: string;
    glossaryTerm?: string;
    whyItMatters?: string;
    deeperNote?: string;
    comparePrompt?: string;
}

export interface LocalizedEducationalResult {
    translationState: ContentTranslationState;
    content: EducationalChunk;
}

export interface ContentLocalizationApi {
    getLocalizedArtifactContent(source: { name?: string; fact?: string }, locale?: LocaleCode): LocalizedEducationalResult;
}

declare global {
    interface Window {
        ContentLocalization: ContentLocalizationApi;
    }
}
