export type Tone = "neutral" | "success" | "warning" | "danger" | "accent" | "ar";

export interface ProgressBarProps {
  label?: string;
  value?: number;
  max?: number;
  tone?: Tone;
  compact?: boolean;
}

export interface BadgeIconProps {
  icon?: string;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  label?: string;
}

export interface DesignSystemContract {
  tokens: Record<string, unknown>;
  SectionHeader(input?: Record<string, string>): HTMLElement;
  LanguagePill(input?: { code?: string; label?: string; active?: boolean }): HTMLElement;
  LocaleSwitcher(input?: { id?: string; options?: Array<{ code: string; label: string }> }): HTMLElement;
  TranslationBadge(input?: { label?: string; state?: "complete" | "partial" | "missing" }): HTMLElement;
  DirectionLabel(input?: { direction?: "ltr" | "rtl"; label?: string }): HTMLElement;
  GlossaryTerm(input?: { term?: string; definition?: string }): HTMLElement;
  TextFitContainer(input?: { text?: string; className?: string }): HTMLElement;
  MultiLingualNotice(input?: { title?: string; body?: string; tone?: Tone }): HTMLElement;
  SubtitleToggle(input?: { checked?: boolean; label?: string; id?: string }): HTMLElement;
  VoiceHintButton(input?: { label?: string; icon?: string }): HTMLElement;
  SpaceCard(input?: Record<string, string>): HTMLElement;
  PlanetCard(input?: Record<string, string>): HTMLElement;
  StarfieldPanel(input?: Record<string, string>): HTMLElement;
  OrbitalRing(input?: Record<string, string>): HTMLElement;
  ScoreChip(input?: Record<string, string>): HTMLElement;
  StatusPill(input?: { label?: string; tone?: Tone }): HTMLElement;
  ProgressBar(input?: ProgressBarProps): HTMLElement;
  CelebrationBanner(input?: Record<string, string>): HTMLElement;
  BadgeIcon(input?: BadgeIconProps): HTMLElement;
  AvatarRing(input?: { initials?: string; active?: boolean }): HTMLElement;
  GuideAvatar(input?: { emoji?: string; active?: boolean; size?: "sm" | "md" | "lg" }): HTMLElement;
  GuideNameTag(input?: { name?: string; role?: string; tone?: Tone }): HTMLElement;
  GuideBadge(input?: { label?: string; tone?: Tone; icon?: string }): HTMLElement;
  GuideBubble(input?: { text?: string; beat?: string; compact?: boolean }): HTMLElement;
  GuideCard(input?: { name?: string; role?: string; text?: string; emoji?: string; beat?: string; tone?: Tone }): HTMLElement;
  GuidePicker(input?: { guides?: Array<{ id: string; name: string; avatar?: string }>; selectedGuideId?: string }): HTMLElement;
  GuideActionRow(input?: { actions?: Array<{ id?: string; label?: string }> }): HTMLElement;
  DepthFrame(input?: Record<string, string>): HTMLElement;
  InfoPanel(input?: Record<string, string>): HTMLElement;
  MissionLabel(input?: Record<string, string>): HTMLElement;
  CosmicGlow(input?: Record<string, string>): HTMLElement;
  LessonCard(input?: { title?: string; text?: string; icon?: string }): HTMLElement;
  QuestLabel(input?: { label?: string; value?: string }): HTMLElement;
}

declare global {
  interface Window {
    DesignSystem: DesignSystemContract;
  }
}
