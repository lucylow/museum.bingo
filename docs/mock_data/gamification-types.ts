export type EventType =
    | "tile_validated"
    | "hint_used"
    | "badge_unlocked"
    | "bingo_completed"
    | "room_joined"
    | "leaderboard_updated"
    | "scan_failed";

export type BadgeTier = "common" | "rare" | "epic" | "legendary";

export interface ScoreConfig {
    tileValidatedPoints: number;
    firstBingoLineBonus: number;
    fullCardBonus: number;
    streakBaseBonus: number;
    streakStepBonus: number;
    hintDeductionPoints: number;
    deductHintUsage: boolean;
}

export interface AchievementBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: BadgeTier;
    tier: BadgeTier;
    earnedAt: string;
}

export interface UserStatsDocument {
    userId: string;
    totalScans: number;
    totalBingos: number;
    totalMuseumsCompleted: number;
    bestStreak: number;
    badges: AchievementBadge[];
    updatedAt: string;
}

export interface BingoSessionDocument {
    sessionId: string;
    userId: string;
    museumId: string;
    roomId: string;
    startedAt: string;
    finishedAt?: string;
    points: number;
    completedTiles: number[];
    streak: number;
}

export interface RoomScoreDocument {
    roomId: string;
    userId: string;
    playerName: string;
    points: number;
    completedTiles: number;
    firstCompletionAt?: number;
    updatedAt: string;
}

export interface ScanEventDocument {
    id: string;
    sessionId: string;
    roomId: string;
    userId: string;
    type: EventType;
    timestamp: string;
    payload: Record<string, unknown>;
}

export interface DailyChallengeDocument {
    dateKey: string;
    museumId: string;
    promptSetId: string;
    bonusPoints: number;
    leaderboardType: "daily";
}
