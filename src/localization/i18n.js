/**
 * Museum Bingo localization core.
 * Pure lookups + formatting helpers with graceful fallback.
 */

const RTL_LOCALES = new Set(["ar"]);
const DEFAULT_LOCALE = "en";
const STORAGE_KEY = "museumBingoLocale";

const SUPPORTED_LANGUAGES = Object.freeze([
    { code: "en", displayName: "English", englishName: "English", nativeName: "English", direction: "ltr", priority: true, state: "complete" },
    { code: "es", displayName: "Espanol", englishName: "Spanish", nativeName: "Espanol", direction: "ltr", priority: true, state: "complete" },
    { code: "zh", displayName: "中文", englishName: "Chinese", nativeName: "中文", direction: "ltr", priority: true, state: "complete" },
    { code: "ar", displayName: "العربية", englishName: "Arabic", nativeName: "العربية", direction: "rtl", priority: true, state: "partial" },
    { code: "ru", displayName: "Русский", englishName: "Russian", nativeName: "Русский", direction: "ltr", priority: true, state: "partial" },
    { code: "bn", displayName: "বাংলা", englishName: "Bengali", nativeName: "বাংলা", direction: "ltr", priority: true, state: "partial" },
    { code: "ht", displayName: "Kreyol Ayisyen", englishName: "Haitian Creole", nativeName: "Kreyol Ayisyen", direction: "ltr", priority: true, state: "partial" },
    { code: "ko", displayName: "한국어", englishName: "Korean", nativeName: "한국어", direction: "ltr", priority: true, state: "partial" },
    { code: "tl", displayName: "Tagalog", englishName: "Tagalog", nativeName: "Tagalog", direction: "ltr", priority: false, state: "partial" },
    { code: "yi", displayName: "ייִדיש", englishName: "Yiddish", nativeName: "ייִדיש", direction: "rtl", priority: false, state: "partial" },
    { code: "it", displayName: "Italiano", englishName: "Italian", nativeName: "Italiano", direction: "ltr", priority: false, state: "partial" }
]);

const TRANSLATION_BUNDLES = {
    en: {
        language: {
            title: "Language",
            switcherLabel: "Language",
            searchPlaceholder: "Search language",
            current: "Current language: {language}",
            incomplete: "Partial translation",
            roomLanguage: "Room language"
        },
        onboarding: {
            welcomeTitle: "Welcome Explorer!",
            welcomeBody: "Ready to discover the secrets of the museum? Let's show you how to use your AI scanner.",
            next: "Next",
            skip: "Skip",
            stepPickTitle: "Pick an Object",
            stepPickBody: "Tap any tile on the bingo board to select an art piece. You will get a clue to solve.",
            stepScanTitle: "Scan and Find",
            stepScanBody: "Tap AI Scan and point your camera at the object. Confirm when details appear."
        },
        gameplay: {
            selectTilePrompt: "Select an art piece to begin your journey.",
            tileFound: "Great! You found {name}!",
            noSelection: "Please select an art piece first.",
            validating: "Validating...",
            foundIt: "Found it",
            levelUp: "Level up! You are now level {level}.",
            nextBestAny: "Next best tile: any",
            nextBestOne: "Next best tile: #{tile}",
            roomCode: "Room {roomId}",
            scanButton: "AI Scan",
            resetButton: "Reset",
            objectiveDone: "Mission complete. Share your recap.",
            objectiveLock: "Lock target tile #{tile}. {remaining} to go.",
            objectiveStart: "Start a line. {remaining} to go.",
            noClues: "No clues available",
            resetTrail: "Reset to generate a new hunt trail.",
            oneLine: "Line complete",
            twoLines: "Multiple lines complete",
            fullCard: "Full card complete",
            streakFire: "Streak active",
            streakBody: "Streak {streak}. Keep momentum for bonus points."
        },
        scan: {
            aiming: "Aiming",
            scanning: "Scanning",
            almostRecognized: "Almost recognized",
            mysteryTarget: "Target selected",
            hintActive: "Hint active",
            recognized: "Recognized",
            signalLocked: "Signal locked",
            scannerError: "Scanner error",
            guidanceAiming: "Frame the object and keep your phone steady.",
            guidanceAlmost: "Almost there. Hold steady and center the object.",
            guidanceMoveCloser: "Move closer to fill the frame.",
            guidanceGlare: "Too much glare. Tilt slightly to reduce reflection.",
            guidanceTryAngle: "Try another angle and isolate one object.",
            guidanceNoMatch: "Not a match yet. Reframe and scan a nearby object.",
            guidanceError: "Scanner error. Try another angle or restart scan.",
            successTitle: "Scan success",
            successContinue: "Continue",
            helpMe: "Help me",
            fallbackMissingContent: "More detail is available in English."
        },
        multiplayer: {
            title: "Multiplayer room",
            lobbyReady: "Lobby ready",
            invitePlayers: "Invite players to join.",
            translatedBadge: "Translated",
            languageMismatch: "Room language differs from your display language.",
            playerFallback: "Player",
            nowPlaying: "Now playing",
            milestoneToGo: "{points} pts to next milestone",
            leaderboardUnavailable: "Leaderboard unavailable right now."
        },
        rewards: {
            newBadge: "New badge",
            unlockedThisSession: "Unlocked this session",
            noBadgesThisRound: "No badges unlocked this round.",
            rewardUnlocked: "Reward unlocked",
            replay: "Play again",
            share: "Share card",
            shareCopied: "Share text copied.",
            missionComplete: "Mission complete",
            bingoComplete: "Bingo complete"
        },
        accessibility: {
            switchLanguage: "Switch app language",
            languageDirection: "Direction: {direction}",
            rtl: "Right-to-left",
            ltr: "Left-to-right",
            translatedContent: "Translated content available",
            fallbackNotice: "Some items appear in English while translation finishes.",
            subtitleToggle: "Show subtitles",
            voiceHint: "Play voice hint"
        },
        stats: {
            tiles: "{count} tile | {count} tiles",
            points: "{count} pt | {count} pts",
            scans: "{found}/{attempts} scans",
            streak: "Streak {count}",
            seconds: "{count}s",
            rank: "Rank #{count}"
        },
        settings: {
            title: "Game settings",
            difficulty: "Difficulty",
            roomMode: "Room mode",
            cardSize: "Card size",
            dailyChallenge: "Daily challenge",
            compact: "Compact card",
            contrast: "High contrast",
            reducedMotion: "Reduced motion",
            sound: "Sound",
            vibration: "Vibration"
        }
    },
    es: {
        language: {
            title: "Idioma",
            switcherLabel: "Idioma",
            current: "Idioma actual: {language}",
            incomplete: "Traduccion parcial",
            roomLanguage: "Idioma de la sala"
        },
        onboarding: {
            welcomeTitle: "Bienvenido explorador",
            welcomeBody: "Listo para descubrir el museo? Te mostramos como usar el escaner.",
            next: "Siguiente",
            skip: "Omitir",
            stepPickTitle: "Elige un objeto",
            stepPickBody: "Toca una casilla para seleccionar una pieza.",
            stepScanTitle: "Escanea y encuentra",
            stepScanBody: "Pulsa Escaneo AI y confirma cuando aparezcan detalles."
        },
        gameplay: {
            selectTilePrompt: "Selecciona una pieza para comenzar.",
            tileFound: "Genial! Encontraste {name}.",
            noSelection: "Primero selecciona una pieza.",
            validating: "Validando...",
            foundIt: "Encontrado",
            levelUp: "Subiste de nivel! Ahora eres nivel {level}.",
            nextBestAny: "Mejor casilla: cualquiera",
            nextBestOne: "Mejor casilla: #{tile}",
            roomCode: "Sala {roomId}",
            scanButton: "Escaneo AI",
            resetButton: "Reiniciar"
        },
        rewards: {
            shareCopied: "Texto para compartir copiado."
        },
        scan: {
            aiming: "Apuntando",
            scanning: "Escaneando",
            almostRecognized: "Casi reconocido",
            mysteryTarget: "Objetivo seleccionado",
            hintActive: "Pista activa",
            recognized: "Reconocido",
            signalLocked: "Senal fijada",
            scannerError: "Error de escaner",
            helpMe: "Ayudame",
            guidanceAiming: "Enfoca el objeto y manten el telefono estable.",
            guidanceNoMatch: "Aun no coincide. Intenta otro angulo."
        },
        multiplayer: {
            title: "Sala multijugador",
            lobbyReady: "Sala lista",
            invitePlayers: "Invita jugadores para comenzar.",
            translatedBadge: "Traducido",
            languageMismatch: "El idioma de la sala es distinto al tuyo."
        },
        rewards: {
            newBadge: "Nueva insignia",
            unlockedThisSession: "Desbloqueadas en esta sesion",
            noBadgesThisRound: "No desbloqueaste insignias en esta ronda."
        },
        accessibility: {
            switchLanguage: "Cambiar idioma",
            rtl: "Derecha a izquierda",
            ltr: "Izquierda a derecha",
            fallbackNotice: "Algunas partes aparecen en ingles temporalmente."
        }
    },
    zh: {
        language: {
            title: "语言",
            switcherLabel: "语言",
            current: "当前语言: {language}",
            incomplete: "部分翻译",
            roomLanguage: "房间语言"
        },
        onboarding: {
            welcomeTitle: "欢迎探索者",
            welcomeBody: "准备好开始博物馆探索了吗？我们来介绍扫描流程。",
            next: "下一步",
            skip: "跳过"
        },
        gameplay: {
            selectTilePrompt: "先选择一个目标开始。",
            tileFound: "太好了！你找到了{name}。",
            noSelection: "请先选择一个目标。",
            validating: "验证中...",
            foundIt: "已确认",
            levelUp: "升级了！你现在是 {level} 级。",
            nextBestAny: "下一最佳格: 任意",
            nextBestOne: "下一最佳格: #{tile}",
            roomCode: "房间 {roomId}",
            scanButton: "AI 扫描",
            resetButton: "重置"
        },
        rewards: {
            shareCopied: "分享文本已复制"
        },
        scan: {
            aiming: "对准中",
            scanning: "扫描中",
            almostRecognized: "快识别到了",
            mysteryTarget: "已选择目标",
            hintActive: "提示已开启",
            recognized: "已识别",
            signalLocked: "已锁定",
            scannerError: "扫描错误",
            helpMe: "帮助",
            guidanceAiming: "对准目标并保持手机稳定。",
            guidanceNoMatch: "暂未匹配，请换个角度重试。"
        },
        multiplayer: {
            title: "多人房间",
            lobbyReady: "房间已就绪",
            invitePlayers: "邀请成员一起开始。",
            translatedBadge: "已翻译"
        },
        rewards: {
            newBadge: "新徽章",
            unlockedThisSession: "本局解锁",
            noBadgesThisRound: "本局暂无徽章解锁"
        }
    },
    ar: {
        language: {
            title: "اللغة",
            switcherLabel: "اللغة",
            current: "اللغة الحالية: {language}",
            incomplete: "ترجمة جزئية",
            roomLanguage: "لغة الغرفة"
        },
        onboarding: {
            welcomeTitle: "اهلا بالمستكشف",
            welcomeBody: "جاهز لاكتشاف المتحف؟ سنشرح طريقة المسح.",
            next: "التالي",
            skip: "تخطي"
        },
        gameplay: {
            selectTilePrompt: "اختر هدفا للبدء.",
            tileFound: "رائع! لقد وجدت {name}.",
            noSelection: "يرجى اختيار هدف اولا.",
            validating: "جار التحقق...",
            foundIt: "تم العثور",
            levelUp: "ترقية! مستواك الان {level}.",
            nextBestAny: "افضل خانة: اي خانة",
            nextBestOne: "افضل خانة: #{tile}",
            roomCode: "الغرفة {roomId}",
            scanButton: "مسح بالذكاء الاصطناعي",
            resetButton: "اعادة"
        },
        rewards: {
            shareCopied: "تم نسخ نص المشاركة"
        },
        scan: {
            aiming: "توجيه",
            scanning: "مسح",
            almostRecognized: "على وشك التعرف",
            mysteryTarget: "تم اختيار الهدف",
            hintActive: "التلميح مفعل",
            recognized: "تم التعرف",
            signalLocked: "تم القفل",
            scannerError: "خطا في المسح",
            helpMe: "ساعدني",
            guidanceAiming: "وجه الهاتف نحو الهدف وثبته.",
            guidanceNoMatch: "لا يوجد تطابق بعد. جرب زاوية اخرى."
        },
        accessibility: {
            switchLanguage: "تغيير اللغة",
            rtl: "من اليمين الى اليسار",
            ltr: "من اليسار الى اليمين"
        }
    }
};

function getLanguageByCode(locale) {
    const code = String(locale || DEFAULT_LOCALE).toLowerCase();
    return SUPPORTED_LANGUAGES.find((lang) => lang.code === code) || SUPPORTED_LANGUAGES[0];
}

function normalizeLocale(locale) {
    const safe = String(locale || DEFAULT_LOCALE).toLowerCase();
    const exact = getLanguageByCode(safe);
    if (exact) return exact.code;
    const root = safe.split("-")[0];
    return getLanguageByCode(root).code;
}

function deepGet(bundle, path) {
    return path.split(".").reduce((acc, segment) => {
        if (!acc || typeof acc !== "object") return undefined;
        return acc[segment];
    }, bundle);
}

function interpolate(template, params = {}) {
    if (typeof template !== "string") return "";
    return template.replace(/\{(\w+)\}/g, (_m, token) => {
        if (params[token] === undefined || params[token] === null) return "";
        return String(params[token]);
    });
}

function resolvePlural(message, count) {
    if (typeof message !== "string") return "";
    if (!message.includes("|")) return message;
    const [single, plural] = message.split("|").map((part) => part.trim());
    return Number(count) === 1 ? single : plural;
}

function formatNumber(value, locale, style = "decimal") {
    const safeLocale = normalizeLocale(locale);
    const options = style === "percent"
        ? { style: "percent", maximumFractionDigits: 0 }
        : style === "compact"
            ? { notation: "compact", maximumFractionDigits: 1 }
            : {};
    try {
        return new Intl.NumberFormat(safeLocale, options).format(value);
    } catch (_err) {
        return String(value);
    }
}

function formatDate(value, locale, style = "short") {
    const safeLocale = normalizeLocale(locale);
    const options = style === "long"
        ? { dateStyle: "long", timeStyle: "short" }
        : { dateStyle: "medium", timeStyle: "short" };
    try {
        return new Intl.DateTimeFormat(safeLocale, options).format(value);
    } catch (_err) {
        return String(value);
    }
}

function createI18n() {
    let locale = normalizeLocale(localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE);
    const listeners = new Set();

    function t(key, params = {}, options = {}) {
        const requestedLocale = normalizeLocale(options.locale || locale);
        const requestedBundle = TRANSLATION_BUNDLES[requestedLocale] || {};
        const fallbackBundle = TRANSLATION_BUNDLES[DEFAULT_LOCALE] || {};
        const raw = deepGet(requestedBundle, key);
        const fallback = deepGet(fallbackBundle, key) || key;
        const message = raw !== undefined ? raw : fallback;
        const pluralized = resolvePlural(message, params.count);
        return interpolate(pluralized, params);
    }

    function setLocale(nextLocale) {
        const normalized = normalizeLocale(nextLocale);
        locale = normalized;
        localStorage.setItem(STORAGE_KEY, normalized);
        const dir = getDirection(normalized);
        document.documentElement.setAttribute("lang", normalized);
        document.documentElement.setAttribute("dir", dir);
        listeners.forEach((listener) => {
            try {
                listener(normalized);
            } catch (err) {
                console.warn("Locale listener failed:", err);
            }
        });
    }

    function getLocale() {
        return locale;
    }

    function getDirection(requested = locale) {
        const lang = getLanguageByCode(normalizeLocale(requested));
        if (lang && lang.direction) return lang.direction;
        return RTL_LOCALES.has(normalizeLocale(requested)) ? "rtl" : "ltr";
    }

    function onChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    function getLanguagePack(requested = locale) {
        const normalized = normalizeLocale(requested);
        const language = getLanguageByCode(normalized);
        return {
            locale: normalized,
            direction: getDirection(normalized),
            translationState: language.state,
            bundle: TRANSLATION_BUNDLES[normalized] || {},
            fallbackBundle: TRANSLATION_BUNDLES[DEFAULT_LOCALE] || {}
        };
    }

    function hasTranslation(key, requested = locale) {
        const pack = getLanguagePack(requested);
        return deepGet(pack.bundle, key) !== undefined;
    }

    function formatters() {
        return {
            number: (value, style) => formatNumber(value, locale, style),
            date: (value, style) => formatDate(value, locale, style)
        };
    }

    setLocale(locale);

    return {
        t,
        setLocale,
        getLocale,
        getDirection,
        onChange,
        formatters,
        hasTranslation,
        getLanguagePack,
        getSupportedLanguages: () => SUPPORTED_LANGUAGES.slice(),
        normalizeLocale
    };
}

window.I18n = createI18n();
