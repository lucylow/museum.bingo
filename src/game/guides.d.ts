export type GuideBeat =
  | "welcome"
  | "explain"
  | "hint"
  | "celebrate"
  | "nudge"
  | "compare"
  | "recap"
  | "ask"
  | "encourage"
  | "focus";

export type GuideMood = "playful" | "calm" | "expert" | "energetic" | "story";

export interface GuideProfile {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  visualStyle: { gradient: string; accent: string; surface: string };
  voiceTone: GuideMood;
  expertiseFocus: string;
  favoriteClueKinds: string[];
  introLine: string;
  celebrateLine: string;
  hintLine: string;
  recapLine: string;
  moodVariants: Record<GuideMood, string>;
  a11yShort: string;
}

export interface GuideSelectionContext {
  selectedGuideId?: string;
  userMode?: string;
  ageFriendlyMode?: boolean;
  sessionType?: "family" | "school" | "solo" | "returning" | "first_time" | "competitive";
  museumTheme?: "art" | "history" | "science";
  difficulty?: "easy" | "standard" | "challenge";
  multiplayer?: boolean;
  energyPreference?: "calm" | "energetic";
}

export interface GuideLineContext {
  itemName?: string;
  rowHint?: string;
  nextTile?: number;
  nudge?: string;
  altNudge?: string;
  hintAction?: string;
  recapFocus?: string;
  distance?: string;
  energyPreference?: "calm" | "energetic";
  ageFriendlyMode?: boolean;
  sessionType?: string;
  difficulty?: string;
}

export interface GuideRuntimeMeta {
  beat?: GuideBeat;
  now?: number;
  lastLineAt?: number;
  lastBeat?: GuideBeat | null;
  minGapMs?: number;
}

