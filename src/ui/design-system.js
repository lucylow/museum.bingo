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
    neutral: "#cbd5e1",
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#fb7185",
    accent: "#a78bfa",
    arGlow: "#22d3ee"
});

const rarityStyle = Object.freeze({
    common: "rarity-common",
    uncommon: "rarity-uncommon",
    rare: "rarity-rare",
    epic: "rarity-epic",
    legendary: "rarity-legendary"
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

function StatusPill({ label, tone = "neutral" } = {}) {
    const safeTone = ["neutral", "success", "warning", "danger", "accent", "ar"].includes(tone) ? tone : "neutral";
    return createElement("span", `status-pill status-pill--${safeTone}`, label || "Status");
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

function AvatarRing({ initials = "P", active = false } = {}) {
    return createElement(
        "div",
        `avatar-ring ${active ? "avatar-ring--active" : ""}`,
        `<span>${initials.slice(0, 2).toUpperCase()}</span>`
    );
}

function GlowFrame({ tone = "warning", html = "" } = {}) {
    return createElement("div", `glow-frame glow-frame--${tone}`, html);
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
    tokens: { spacing, radius, motion, colors },
    SectionHeader,
    ScoreChip,
    StatusPill,
    GlassCard,
    ProgressBar,
    CelebrationBanner,
    BadgeIcon,
    AvatarRing,
    GlowFrame,
    EmptyState
};
