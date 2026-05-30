/**
 * Lightweight design tokens and UI primitives for Museum Bingo.
 * Framework-agnostic so current architecture remains unchanged.
 */

const spacing = Object.freeze({
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28
});

const radius = Object.freeze({
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 999
});

const motion = Object.freeze({
    fast: 160,
    medium: 280,
    dramatic: 520
});

const colors = Object.freeze({
    void: "#050816",
    starfield: "#0f172a",
    nebula: "#7c3aed",
    planet: "#22d3ee",
    comet: "#38bdf8",
    laser: "#f472b6",
    neutral: "#cbd5e1",
    neutralStrong: "#e2e8f0",
    parchment: "#fef3c7",
    bronze: "#b45309",
    gold: "#fbbf24",
    slate: "#334155",
    stone: "#78716c",
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#fb7185",
    clue: "#60a5fa",
    discovery: "#a78bfa",
    huntProgress: "#22c55e",
    accent: "#a78bfa",
    arGlow: "#22d3ee",
    guide: "#38bdf8",
    help: "#f59e0b"
});

const shadows = Object.freeze({
    soft: "0 10px 28px rgba(2, 6, 23, 0.34)",
    glow: "0 14px 38px rgba(251, 191, 36, 0.18)",
    deep: "0 20px 48px rgba(2, 6, 23, 0.5)"
});

const borders = Object.freeze({
    subtle: "1px solid rgba(251, 191, 36, 0.2)",
    strong: "1px solid rgba(251, 191, 36, 0.4)",
    discovery: "1px solid rgba(167, 139, 250, 0.45)"
});

const typography = Object.freeze({
    title: "800 1.15rem/1.2 Inter, system-ui, sans-serif",
    body: "500 0.9rem/1.5 Inter, system-ui, sans-serif",
    caption: "600 0.7rem/1.3 Inter, system-ui, sans-serif"
});

const iconSizes = Object.freeze({
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
});

const depth = Object.freeze({
    base: 0,
    raised: 6,
    floating: 14,
    orbital: 24
});

const orbitalLayers = Object.freeze({
    near: 1,
    mid: 2,
    far: 3
});

const glowIntensity = Object.freeze({
    low: 0.18,
    medium: 0.3,
    high: 0.45
});

const parallaxOffsets = Object.freeze({
    subtle: 3,
    medium: 7,
    dramatic: 12
});

const rarityStyle = Object.freeze({
    common: "rarity-common",
    uncommon: "rarity-uncommon",
    rare: "rarity-rare",
    epic: "rarity-epic",
    legendary: "rarity-legendary"
});

const guideBehavior = Object.freeze({
    welcome: { tone: "accent", icon: "👋" },
    explain: { tone: "neutral", icon: "🧠" },
    hint: { tone: "warning", icon: "🧩" },
    celebrate: { tone: "success", icon: "🎉" },
    nudge: { tone: "accent", icon: "➡️" },
    compare: { tone: "neutral", icon: "📊" },
    recap: { tone: "accent", icon: "📝" },
    ask: { tone: "neutral", icon: "❓" },
    encourage: { tone: "success", icon: "💛" },
    focus: { tone: "warning", icon: "🎯" }
});

function createElement(tag, className, html) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof html === "string") el.innerHTML = html;
    return el;
}

function SectionHeader({ title, subtitle, rightLabel } = {}) {
    return createElement(
        "div",
        "section-header",
        `
            <div>
                <p class="section-header__subtitle">${subtitle || ""}</p>
                <h3 class="section-header__title">${title || ""}</h3>
            </div>
            ${rightLabel ? `<span class="status-pill status-pill--neutral">${rightLabel}</span>` : ""}
        `
    );
}

function LanguagePill({ code = "en", label = "English", active = false } = {}) {
    return createElement(
        "span",
        `language-pill ${active ? "language-pill--active" : ""}`.trim(),
        `<strong>${code.toUpperCase()}</strong><span>${label}</span>`
    );
}

function TranslationBadge({ label = "Translated", state = "complete" } = {}) {
    const tone = state === "complete" ? "success" : state === "partial" ? "warning" : "neutral";
    return createElement("span", `status-pill status-pill--${tone}`, label);
}

function DirectionLabel({ direction = "ltr", label = "" } = {}) {
    return createElement(
        "span",
        "direction-label",
        `<strong>${direction.toUpperCase()}</strong>${label ? `<span>${label}</span>` : ""}`
    );
}

function GlossaryTerm({ term = "", definition = "" } = {}) {
    return createElement(
        "div",
        "glossary-term",
        `
            <p class="glossary-term__name">${term}</p>
            <p class="glossary-term__definition">${definition}</p>
        `
    );
}

function TextFitContainer({ text = "", className = "" } = {}) {
    return createElement("div", `text-fit ${className}`.trim(), text);
}

function MultiLingualNotice({ title = "", body = "", tone = "warning" } = {}) {
    return createElement(
        "div",
        `multilingual-notice multilingual-notice--${tone}`,
        `
            <p class="multilingual-notice__title">${title}</p>
            <p class="multilingual-notice__body">${body}</p>
        `
    );
}

function SubtitleToggle({ checked = true, label = "Subtitles", id = "subtitle-toggle" } = {}) {
    return createElement(
        "label",
        "subtitle-toggle",
        `
            <span>${label}</span>
            <input id="${id}" type="checkbox" class="ui-switch" ${checked ? "checked" : ""} />
        `
    );
}

function VoiceHintButton({ label = "Voice hint", icon = "🗣️" } = {}) {
    return createElement("button", "glass-btn-sm", `${icon} ${label}`);
}

function LocaleSwitcher({ id = "locale-switcher", options = [] } = {}) {
    const select = createElement("select", "glass-btn-sm locale-switcher");
    select.id = id;
    options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.code;
        option.textContent = opt.label;
        select.appendChild(option);
    });
    return select;
}

function ScoreChip({ icon, label, value } = {}) {
    return createElement(
        "div",
        "score-chip",
        `
            <span class="score-chip__icon">${icon || "★"}</span>
            <span class="score-chip__label">${label || "Score"}</span>
            <strong class="score-chip__value">${value || "0"}</strong>
        `
    );
}

function ScorePill({ icon, label, value } = {}) {
    return ScoreChip({ icon, label, value });
}

function StatusPill({ label, tone = "neutral" } = {}) {
    const safeTone = ["neutral", "success", "warning", "danger", "accent", "ar"].includes(tone) ? tone : "neutral";
    return createElement("span", `status-pill status-pill--${safeTone}`, label || "Status");
}

function StatusChip({ label, tone = "neutral" } = {}) {
    return StatusPill({ label, tone });
}

function GlassCard({ className = "", title = "", content = "" } = {}) {
    return createElement(
        "div",
        `glass-card premium-glow ${className}`.trim(),
        `
            ${title ? `<h4 class="text-sm font-black text-amber-300 mb-2">${title}</h4>` : ""}
            ${content}
        `
    );
}

function SpaceCard({ className = "", title = "", content = "" } = {}) {
    return GlassCard({ className: `space-card ${className}`.trim(), title, content });
}

function PlanetCard({ icon = "🪐", title = "Planet Zone", subtitle = "", details = "" } = {}) {
    return ArtifactCard({
        icon,
        title,
        subtitle,
        details
    });
}

function StarfieldPanel({ title = "", text = "" } = {}) {
    return createElement(
        "div",
        "starfield-panel",
        `
            <p class="starfield-panel__title">${title}</p>
            <p class="starfield-panel__text">${text}</p>
        `
    );
}

function OrbitalRing({ label = "Orbit", value = "0%" } = {}) {
    return createElement(
        "div",
        "orbital-ring",
        `
            <span class="orbital-ring__label">${label}</span>
            <strong class="orbital-ring__value">${value}</strong>
        `
    );
}

function MuseumCard({ className = "", title = "", content = "" } = {}) {
    return GlassCard({ className, title, content });
}

function ArtifactCard({ icon = "🏺", title = "Artifact", subtitle = "", rarity = "common", details = "" } = {}) {
    const rarityClass = rarityStyle[rarity] || rarityStyle.common;
    return createElement(
        "div",
        `artifact-card ${rarityClass}`,
        `
            <div class="artifact-card__head">
                <span class="artifact-card__icon">${icon}</span>
                <div>
                    <p class="artifact-card__title">${title}</p>
                    <p class="artifact-card__subtitle">${subtitle}</p>
                </div>
            </div>
            ${details ? `<p class="artifact-card__details">${details}</p>` : ""}
        `
    );
}

function ProgressBar({ label = "", value = 0, max = 100, tone = "warning", compact = false } = {}) {
    const pct = Math.max(0, Math.min(100, Math.round((Number(value) / Math.max(1, Number(max))) * 100)));
    return createElement(
        "div",
        `progress-wrap ${compact ? "progress-wrap--compact" : ""}`.trim(),
        `
            ${label ? `<div class="progress-wrap__label">${label}<span>${pct}%</span></div>` : ""}
            <div class="progress-track">
                <div class="progress-fill progress-fill--${tone}" style="width:${pct}%"></div>
            </div>
        `
    );
}

function CelebrationBanner({ title = "", text = "", tone = "warning" } = {}) {
    return createElement(
        "div",
        `celebration-banner celebration-banner--${tone}`,
        `
            <p class="celebration-banner__title">${title}</p>
            <p class="celebration-banner__text">${text}</p>
        `
    );
}

function HuntCard({ title = "", subtitle = "", content = "", tone = "accent" } = {}) {
    return createElement(
        "div",
        `hunt-card hunt-card--${tone}`,
        `
            <p class="hunt-card__subtitle">${subtitle}</p>
            <h4 class="hunt-card__title">${title}</h4>
            <div class="hunt-card__content">${content}</div>
        `
    );
}

function ClueCard({
    title = "",
    clueText = "",
    category = "visual",
    difficulty = "standard",
    route = "main",
    actionLabel = "Scan this",
    whyItMatters = "",
    whatToLookFor = "",
    proximityLabel = "Searching"
} = {}) {
    return createElement(
        "article",
        `clue-card clue-card--${route}`,
        `
            <div class="clue-card__head">
                <span class="hint-chip hint-chip--accent">${category}</span>
                <span class="mystery-label mystery-label--warning">${difficulty}</span>
            </div>
            <h4 class="clue-card__title">${title}</h4>
            <p class="clue-card__text">${clueText}</p>
            <p class="clue-card__meta">${whyItMatters}</p>
            <p class="clue-card__meta clue-card__meta--focus">${whatToLookFor}</p>
            <div class="clue-card__foot">
                <span class="status-pill status-pill--${route === "bonus" ? "accent" : "warning"}">${route} route</span>
                <span class="clue-card__action">${proximityLabel} · ${actionLabel}</span>
            </div>
        `
    );
}

function DiscoveryBadge({ icon = "🔎", label = "Discovery", tone = "accent" } = {}) {
    return createElement(
        "span",
        `discovery-badge discovery-badge--${tone}`,
        `<span>${icon}</span><strong>${label}</strong>`
    );
}

function BadgeIcon({ icon = "🏅", rarity = "common", label = "Badge" } = {}) {
    const rarityClass = rarityStyle[rarity] || rarityStyle.common;
    return createElement(
        "div",
        `badge-icon ${rarityClass}`,
        `
            <span class="badge-icon__emoji">${icon}</span>
            <span class="badge-icon__label">${label}</span>
        `
    );
}

function MapPin({ icon = "📍", label = "Gallery target", tone = "neutral" } = {}) {
    return createElement(
        "span",
        `map-pin map-pin--${tone}`,
        `<span class="map-pin__icon">${icon}</span><span>${label}</span>`
    );
}

function HintChip({ text = "Hint 1", tone = "warning" } = {}) {
    return createElement("span", `hint-chip hint-chip--${tone}`, text);
}

function MysteryLabel({ text = "Mystery", tone = "accent" } = {}) {
    return createElement("span", `mystery-label mystery-label--${tone}`, text);
}

function AvatarRing({ initials = "P", active = false } = {}) {
    return createElement(
        "div",
        `avatar-ring ${active ? "avatar-ring--active" : ""}`,
        `<span>${initials.slice(0, 2).toUpperCase()}</span>`
    );
}

function GuideAvatar({ emoji = "🧭", active = false, size = "md" } = {}) {
    const className = `guide-avatar guide-avatar--${size} ${active ? "guide-avatar--active" : ""}`.trim();
    return createElement("div", className, `<span>${emoji}</span>`);
}

function GuideNameTag({ name = "Guide", role = "", tone = "accent" } = {}) {
    return createElement(
        "div",
        `guide-name-tag guide-name-tag--${tone}`,
        `<strong>${name}</strong>${role ? `<span>${role}</span>` : ""}`
    );
}

function GuideBadge({ label = "Guide", tone = "accent", icon = "🧭" } = {}) {
    return createElement(
        "span",
        `guide-badge guide-badge--${tone}`,
        `<span>${icon}</span><strong>${label}</strong>`
    );
}

function GuideBubble({ text = "", beat = "encourage", compact = false } = {}) {
    const beatToken = guideBehavior[beat] || guideBehavior.encourage;
    return createElement(
        "div",
        `guide-bubble guide-bubble--${beatToken.tone} ${compact ? "guide-bubble--compact" : ""}`.trim(),
        `
            <div class="guide-bubble__meta">${beatToken.icon} ${beat}</div>
            <p class="guide-bubble__text">${text}</p>
        `
    );
}

function GuideCard({ name = "Guide", role = "", text = "", emoji = "🧭", beat = "encourage", tone = "accent" } = {}) {
    const card = createElement("div", "guide-card");
    const top = createElement("div", "guide-card__top");
    top.appendChild(GuideAvatar({ emoji, active: true }));
    top.appendChild(GuideNameTag({ name, role, tone }));
    card.appendChild(top);
    card.appendChild(GuideBubble({ text, beat }));
    return card;
}

function GuideActionRow({ actions = [] } = {}) {
    const row = createElement("div", "guide-action-row");
    actions.forEach((action) => {
        const button = createElement("button", "glass-btn-sm guide-action-row__button", action.label || "Action");
        if (action.id) button.dataset.action = action.id;
        row.appendChild(button);
    });
    return row;
}

function GuidePicker({ guides = [], selectedGuideId = "" } = {}) {
    const wrap = createElement("div", "guide-picker");
    guides.forEach((guide) => {
        const active = guide.id === selectedGuideId;
        const chip = createElement(
            "button",
            `guide-picker__chip ${active ? "guide-picker__chip--active" : ""}`,
            `
                <span class="guide-picker__emoji">${guide.avatar || "🧭"}</span>
                <span class="guide-picker__label">${guide.name || "Guide"}</span>
            `
        );
        chip.dataset.guideId = guide.id;
        wrap.appendChild(chip);
    });
    return wrap;
}

function LessonCard({ title = "What you learned", text = "", icon = "📘" } = {}) {
    return createElement(
        "div",
        "lesson-card",
        `
            <p class="lesson-card__title">${icon} ${title}</p>
            <p class="lesson-card__text">${text}</p>
        `
    );
}

function QuestLabel({ label = "Mission", value = "" } = {}) {
    return createElement(
        "div",
        "quest-label",
        `<span>${label}</span><strong>${value}</strong>`
    );
}

function DepthFrame({ tone = "warning", html = "" } = {}) {
    return GlowFrame({ tone, html });
}

function GlowFrame({ tone = "warning", html = "" } = {}) {
    return createElement("div", `glow-frame glow-frame--${tone}`, html);
}

function MissionLabel({ label = "Mission", value = "" } = {}) {
    return createElement(
        "div",
        "mission-label",
        `
            <span class="mission-label__label">${label}</span>
            <strong class="mission-label__value">${value}</strong>
        `
    );
}

function CosmicGlow({ tone = "accent", content = "" } = {}) {
    return createElement("div", `cosmic-glow cosmic-glow--${tone}`, content);
}

function DiscoveryTag({ label = "Discovery", tone = "accent" } = {}) {
    return createElement("span", `discovery-tag discovery-tag--${tone}`, label);
}

function InfoPanel({ title = "", text = "", icon = "🧭" } = {}) {
    return createElement(
        "div",
        "info-panel",
        `
            <div class="info-panel__head">
                <span class="info-panel__icon">${icon}</span>
                <p class="info-panel__title">${title}</p>
            </div>
            <p class="info-panel__text">${text}</p>
        `
    );
}

function EmptyState({ icon = "🧭", title = "Nothing yet", text = "Play a round to see updates here." } = {}) {
    return createElement(
        "div",
        "empty-state",
        `
            <div class="empty-state__icon">${icon}</div>
            <p class="empty-state__title">${title}</p>
            <p class="empty-state__text">${text}</p>
        `
    );
}

window.DesignSystem = {
    tokens: {
        spacing,
        radius,
        motion,
        colors,
        shadows,
        borders,
        typography,
        iconSizes,
        depth,
        orbitalLayers,
        glowIntensity,
        parallaxOffsets,
        guideBehavior
    },
    SectionHeader,
    LanguagePill,
    LocaleSwitcher,
    TranslationBadge,
    DirectionLabel,
    GlossaryTerm,
    TextFitContainer,
    MultiLingualNotice,
    SubtitleToggle,
    VoiceHintButton,
    SpaceCard,
    PlanetCard,
    StarfieldPanel,
    OrbitalRing,
    ArtifactCard,
    ScoreChip,
    ScorePill,
    StatusPill,
    StatusChip,
    GlassCard,
    MuseumCard,
    ProgressBar,
    CelebrationBanner,
    HuntCard,
    ClueCard,
    DiscoveryBadge,
    MapPin,
    HintChip,
    MysteryLabel,
    BadgeIcon,
    AvatarRing,
    GuideAvatar,
    GuideNameTag,
    GuideBadge,
    GuideBubble,
    GuideCard,
    GuidePicker,
    GuideActionRow,
    DepthFrame,
    GlowFrame,
    MissionLabel,
    CosmicGlow,
    DiscoveryTag,
    InfoPanel,
    EmptyState,
    LessonCard,
    QuestLabel
};
