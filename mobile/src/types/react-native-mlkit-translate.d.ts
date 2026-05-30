declare module 'react-native-mlkit-translate' {
  export type TranslateProgressCallback = (progress: number) => void;
  export type Translator = {
    translate: (text: string) => Promise<string>;
  };

  export type TranslateOptions = {
    sourceLanguage: string;
    targetLanguage: string;
  };

  const MLKitTranslate: {
    isModelDownloaded: (languageCode: string) => Promise<boolean>;
    downloadModel: (languageCode: string, onProgress?: TranslateProgressCallback) => Promise<void>;
    createTranslator: (options: TranslateOptions) => Promise<Translator>;
  };

  export default MLKitTranslate;
}
