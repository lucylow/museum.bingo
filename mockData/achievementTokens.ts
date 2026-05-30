export interface CollectibleAttribute {
  trait_type: string;
  value: string | number;
}

export interface CollectibleGameplay {
  unlockEvent: string;
  requiredCount: number;
  playableWithoutWallet: boolean;
  mintable: boolean;
  mintStatus: "unminted" | "minted" | "locked";
  specialCondition?: string;
}

export interface CollectibleToken {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  animation_url: string;
  external_url: string;
  attributes: CollectibleAttribute[];
  gameplay: CollectibleGameplay;
}

export interface WalletDemoUser {
  userId: string;
  displayName: string;
  walletAddress: string;
  inventory: string[];
  featuredTokenId: string;
}

export interface MintHistoryRecord {
  mintId: string;
  tokenId: string;
  userId: string;
  status: "confirmed" | "pending" | "failed";
  txHash: string;
  mintedAt: string;
}

export interface AchievementTokenDataset {
  collection: {
    name: string;
    symbol: string;
    chain: string;
    contractAddress: string;
    network: string;
    description: string;
    totalSupply: number;
    season: string;
  };
  tokens: CollectibleToken[];
  walletDemoUsers: WalletDemoUser[];
  mintHistory: MintHistoryRecord[];
  seasonConfig: {
    seasonId: string;
    seasonName: string;
    startDate: string;
    endDate: string;
    featuredReward: string;
    dailyChallengeReward: string;
    roomVictoryReward: string;
  };
}

export const MBINGO_ACHIEVEMENT_TOKENS: AchievementTokenDataset = {
  collection: {
    name: "Museum.Bingo Achievement Tokens",
    symbol: "MBINGO",
    chain: "ethereum",
    contractAddress: "0x8A12bF3d91c4A7eE0D2bA9f5C7d8aF11B2c8D901",
    network: "sepolia",
    description: "A collectible achievement set for Museum.Bingo players. Earned through gameplay milestones, not purchased.",
    totalSupply: 5000,
    season: "Season 01 - Gallery Quest",
  },
  tokens: [
    {
      tokenId: "1001",
      name: "First Scan Badge",
      description: "Earned after your first successful artwork scan.",
      image: "ipfs://bafybeifirstscan0001",
      animation_url: "ipfs://bafybeifirstscananim0001",
      external_url: "https://museumbingo.example/collectibles/1001",
      attributes: [
        { trait_type: "Rarity", value: "Common" },
        { trait_type: "Type", value: "Achievement Badge" },
        { trait_type: "Unlock Method", value: "Complete 1 scan" },
        { trait_type: "Points Bonus", value: 25 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "scan_success",
        requiredCount: 1,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "unminted",
      },
    },
    {
      tokenId: "1002",
      name: "First Tile Found",
      description: "Awarded for completing your first bingo tile.",
      image: "ipfs://bafybeifirsttile0002",
      animation_url: "ipfs://bafybeifirsttileanim0002",
      external_url: "https://museumbingo.example/collectibles/1002",
      attributes: [
        { trait_type: "Rarity", value: "Common" },
        { trait_type: "Type", value: "Achievement Badge" },
        { trait_type: "Unlock Method", value: "Complete 1 bingo tile" },
        { trait_type: "Points Bonus", value: 50 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "tile_completed",
        requiredCount: 1,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "unminted",
      },
    },
    {
      tokenId: "1003",
      name: "Line Runner",
      description: "Unlocked when you complete your first bingo line.",
      image: "ipfs://bafybeilinerunner0003",
      animation_url: "ipfs://bafybeilineanim0003",
      external_url: "https://museumbingo.example/collectibles/1003",
      attributes: [
        { trait_type: "Rarity", value: "Uncommon" },
        { trait_type: "Type", value: "Line Reward" },
        { trait_type: "Unlock Method", value: "Complete 1 line" },
        { trait_type: "Points Bonus", value: 100 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "line_completed",
        requiredCount: 1,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "unminted",
      },
    },
    {
      tokenId: "1004",
      name: "Streak Master",
      description: "Awarded for building a 5-scan streak without missing.",
      image: "ipfs://bafybeistreakmaster0004",
      animation_url: "ipfs://bafybeistreakanim0004",
      external_url: "https://museumbingo.example/collectibles/1004",
      attributes: [
        { trait_type: "Rarity", value: "Uncommon" },
        { trait_type: "Type", value: "Streak Reward" },
        { trait_type: "Unlock Method", value: "Reach 5 streak" },
        { trait_type: "Points Bonus", value: 125 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "streak_updated",
        requiredCount: 5,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "unminted",
      },
    },
    {
      tokenId: "1005",
      name: "Bingo Champion",
      description: "Given for completing a full bingo board.",
      image: "ipfs://bafybeibingochampion0005",
      animation_url: "ipfs://bafybeibingoanim0005",
      external_url: "https://museumbingo.example/collectibles/1005",
      attributes: [
        { trait_type: "Rarity", value: "Rare" },
        { trait_type: "Type", value: "Board Completion" },
        { trait_type: "Unlock Method", value: "Complete full board" },
        { trait_type: "Points Bonus", value: 250 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "bingo_completed",
        requiredCount: 1,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "minted",
      },
    },
    {
      tokenId: "1006",
      name: "Room Champion",
      description: "Earned by placing first in a multiplayer room.",
      image: "ipfs://bafybeiroomchampion0006",
      animation_url: "ipfs://bafybeiroomanim0006",
      external_url: "https://museumbingo.example/collectibles/1006",
      attributes: [
        { trait_type: "Rarity", value: "Rare" },
        { trait_type: "Type", value: "Multiplayer Trophy" },
        { trait_type: "Unlock Method", value: "Win a room" },
        { trait_type: "Points Bonus", value: 300 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "room_victory",
        requiredCount: 1,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "unminted",
      },
    },
    {
      tokenId: "1007",
      name: "Daily Explorer",
      description: "Unlocked after completing a daily challenge card.",
      image: "ipfs://bafybeidailyexplorer0007",
      animation_url: "ipfs://bafybeidailyanim0007",
      external_url: "https://museumbingo.example/collectibles/1007",
      attributes: [
        { trait_type: "Rarity", value: "Rare" },
        { trait_type: "Type", value: "Daily Reward" },
        { trait_type: "Unlock Method", value: "Complete daily challenge" },
        { trait_type: "Points Bonus", value: 200 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "daily_challenge_completed",
        requiredCount: 1,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "unminted",
      },
    },
    {
      tokenId: "1008",
      name: "Museum Master",
      description: "A legendary token for completing a full card with no hints.",
      image: "ipfs://bafybeimuseummaster0008",
      animation_url: "ipfs://bafybeimuseumanim0008",
      external_url: "https://museumbingo.example/collectibles/1008",
      attributes: [
        { trait_type: "Rarity", value: "Epic" },
        { trait_type: "Type", value: "Perfect Run" },
        { trait_type: "Unlock Method", value: "Full card, 0 hints" },
        { trait_type: "Points Bonus", value: 500 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "bingo_completed",
        requiredCount: 1,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "unminted",
        specialCondition: "no_hints_used",
      },
    },
    {
      tokenId: "1009",
      name: "Gallery Gold",
      description: "Seasonal collectible for completing 10 museum sessions.",
      image: "ipfs://bafybeigallerygold0009",
      animation_url: "ipfs://bafybeigoldanim0009",
      external_url: "https://museumbingo.example/collectibles/1009",
      attributes: [
        { trait_type: "Rarity", value: "Epic" },
        { trait_type: "Type", value: "Seasonal" },
        { trait_type: "Unlock Method", value: "Complete 10 sessions" },
        { trait_type: "Points Bonus", value: 600 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "session_completed",
        requiredCount: 10,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "unminted",
      },
    },
    {
      tokenId: "1010",
      name: "Founder's Frame",
      description: "A legendary founder collectible for elite seasonal completion.",
      image: "ipfs://bafybeifoundersframe0010",
      animation_url: "ipfs://bafybeifoundersanim0010",
      external_url: "https://museumbingo.example/collectibles/1010",
      attributes: [
        { trait_type: "Rarity", value: "Legendary" },
        { trait_type: "Type", value: "Founder Edition" },
        { trait_type: "Unlock Method", value: "Complete seasonal mastery" },
        { trait_type: "Points Bonus", value: 1000 },
        { trait_type: "Season", value: "Season 01" },
      ],
      gameplay: {
        unlockEvent: "season_mastered",
        requiredCount: 1,
        playableWithoutWallet: true,
        mintable: true,
        mintStatus: "locked",
        specialCondition: "season_master_completion",
      },
    },
  ],
  walletDemoUsers: [
    {
      userId: "u_1024",
      displayName: "Maya R.",
      walletAddress: "0x7f4A9b2c1C1C4fB8D2B6AFe9C2A111e3a4D9cB10",
      inventory: ["1001", "1002", "1005"],
      featuredTokenId: "1005",
    },
    {
      userId: "u_2048",
      displayName: "Liam T.",
      walletAddress: "0x3b2c8E4fA1c77A2b9d9d0E8D7f1dA21B4eD44A22",
      inventory: ["1001", "1003", "1004", "1007"],
      featuredTokenId: "1004",
    },
  ],
  mintHistory: [
    {
      mintId: "mint_9001",
      tokenId: "1005",
      userId: "u_1024",
      status: "confirmed",
      txHash: "0x4f2a8f91c1d66bb8f8d0c7d0be9d1b7e0f51d0c9c2f2e7a6c4d1b8c4a7f0aa12",
      mintedAt: "2026-05-28T18:14:22Z",
    },
  ],
  seasonConfig: {
    seasonId: "s01",
    seasonName: "Gallery Quest",
    startDate: "2026-05-25",
    endDate: "2026-06-30",
    featuredReward: "Founder's Frame",
    dailyChallengeReward: "Daily Explorer",
    roomVictoryReward: "Room Champion",
  },
};
