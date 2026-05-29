export type TileState = "locked" | "active" | "matched" | "bonus" | "hinted" | "missed";
export type CompletionState = "no_line" | "one_line" | "two_lines" | "blackout";
export type DifficultyMode = "easy" | "standard" | "challenge";
export type RoomMode = "solo" | "multiplayer" | "family";
export type EventType =
    | "tile_validated"
    | "tile_failed"
    | "hint_used"
    | "streak_updated"
    | "badge_unlocked"
    | "bingo_completed"
    | "room_joined"
    | "room_left"
    | "leaderboard_changed";

export interface BingoTile {
    id: number;
    prompt: string;
    icon?: string;
    state: TileState;
    isBonus?: boolean;
    progress?: number;
}

export interface BingoCard {
    id: string;
    size: 3 | 4;
    tiles: BingoTile[];
    completionState: CompletionState;
}

export interface BingoStreak {
    current: number;
    best: number;
    changed: "increased" | "decreased" | "unchanged";
    lastSuccessAt?: string;
}

export interface BingoScore {
    pointsEarned: number;
    tilePoints: number;
    streakBonus: number;
    lineBonus: number;
    fullCardBonus: number;
    hintPenalty: number;
}

export interface BingoBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    earnedAt?: string;
}

export interface BingoEvent {
    id: string;
    type: EventType;
    timestamp: string;
    payload?: Record<string, unknown>;
}

export interface RoomState {
    roomId: string;
    mode: RoomMode;
    hostUserId?: string;
    startedAt?: string;
    endedAt?: string;
}

export interface BingoSession {
    id: string;
    roomId: string;
    userId: string;
    difficulty: DifficultyMode;
    roomMode: RoomMode;
    dailyChallengeEnabled: boolean;
    card: BingoCard;
    score: number;
    streak: BingoStreak;
    badges: BingoBadge[];
}
