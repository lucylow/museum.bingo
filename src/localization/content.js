/**
 * Localized museum educational content mapping.
 * Keeps source object stable and overlays localized strings.
 */

const EDUCATIONAL_CONTENT = Object.freeze({
    "Oil Painting": {
        en: {
            title: "Oil Painting",
            shortExplanation: "Layered pigments create depth and luminous color.",
            lookClosely: "Look for brushstroke texture and light transitions.",
            glossaryTerm: "Glaze",
            whyItMatters: "Oil techniques shaped visual storytelling in many museums."
        },
        es: {
            title: "Pintura al oleo",
            shortExplanation: "Capas de pigmento crean profundidad y color luminoso.",
            lookClosely: "Observa textura de pinceladas y cambios de luz.",
            glossaryTerm: "Veladura",
            whyItMatters: "La tecnica del oleo marco la historia del arte."
        },
        zh: {
            title: "油画",
            shortExplanation: "多层颜料带来深度与光泽。",
            lookClosely: "观察笔触纹理与光线过渡。",
            glossaryTerm: "罩染",
            whyItMatters: "油画技法影响了许多博物馆叙事。"
        }
    },
    "Ancient Statue": {
        en: {
            title: "Ancient Statue",
            shortExplanation: "Sculptures preserve memory, power, and ritual.",
            lookClosely: "Study stance, face, and tool marks.",
            glossaryTerm: "Relief",
            whyItMatters: "Stone sculpture carries cultural memory across centuries."
        },
        es: {
            title: "Estatua antigua",
            shortExplanation: "Las esculturas preservan memoria y simbolos de poder.",
            lookClosely: "Mira la postura, el rostro y las marcas de talla.",
            glossaryTerm: "Relieve",
            whyItMatters: "La escultura en piedra conserva memoria cultural."
        }
    }
});

function safeLocale(locale) {
    if (!locale) return "en";
    return String(locale).toLowerCase().split("-")[0];
}

function getLocalizedArtifactContent(source, locale) {
    const name = source && source.name ? source.name : "Artifact";
    const preferred = safeLocale(locale);
    const perArtifact = EDUCATIONAL_CONTENT[name] || {};
    const localized = perArtifact[preferred] || perArtifact.en || null;
    if (localized) {
        return {
            translationState: perArtifact[preferred] ? "complete" : "partial",
            content: localized
        };
    }

    const fallback = {
        title: name,
        shortExplanation: source && source.fact ? source.fact : "Museum object details are available.",
        lookClosely: "Focus on shape, material, and visual details.",
        glossaryTerm: "Artifact",
        whyItMatters: "Understanding context makes each scan more meaningful."
    };

    return {
        translationState: "missing",
        content: fallback
    };
}

window.ContentLocalization = {
    getLocalizedArtifactContent
};
