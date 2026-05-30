export type ClueDifficulty = "easy" | "standard" | "hard";
export type ClueCategory =
    | "visual"
    | "location"
    | "style"
    | "object"
    | "era"
    | "material"
    | "artist"
    | "detail"
    | "challenge"
    | "bonus";

export interface HuntClue {
    id: string;
    title: string;
    clueText: string;
    whyItMatters: string;
    whatToLookFor: string;
    difficulty: ClueDifficulty;
    difficultyValue: number;
    category: ClueCategory;
    targetRef: string;
    hintLevel: number;
    hintLabel: string;
    rewardValue: number;
    route: "main" | "bonus";
    completed: boolean;
    tileIndex: number;
    proximity: number;
    actionLabel: string;
}

export interface CurrentObjective {
    title: string;
    clueText: string;
    actionLabel: string;
    progress: string;
    clueId?: string;
    tileIndex?: number;
    route?: "main" | "bonus";
    category?: ClueCategory;
    proximityLabel?: string;
    proximity?: number;
}
