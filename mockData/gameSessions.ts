import { Timestamp } from "firebase/firestore";

export interface GameSession {
  sessionId: string;
  userId: string;
  museumId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  completedTiles: string[];
  score: number;
  status: "active" | "completed" | "abandoned";
}

export const NY_GAME_SESSIONS: GameSession[] = [
  {
    sessionId: "sess_met_001",
    userId: "user_alex",
    museumId: "met_nyc",
    startTime: Timestamp.fromDate(new Date("2025-05-25T10:15:00Z")),
    endTime: Timestamp.fromDate(new Date("2025-05-25T11:45:00Z")),
    completedTiles: ["0_0", "0_1", "0_2", "1_0", "1_1"],
    score: 50,
    status: "completed",
  },
  {
    sessionId: "sess_moma_002",
    userId: "user_jordan",
    museumId: "moma_nyc",
    startTime: Timestamp.fromDate(new Date("2025-05-26T14:00:00Z")),
    completedTiles: ["0_0", "1_2"],
    score: 20,
    status: "active",
  },
  {
    sessionId: "sess_met_003",
    userId: "user_taylor",
    museumId: "met_nyc",
    startTime: Timestamp.fromDate(new Date("2025-05-27T09:30:00Z")),
    endTime: Timestamp.fromDate(new Date("2025-05-27T10:00:00Z")),
    completedTiles: ["0_0", "0_1", "0_2", "1_0", "1_1", "1_2", "2_0"],
    score: 70,
    status: "completed",
  },
  {
    sessionId: "sess_gug_004",
    userId: "user_maya",
    museumId: "guggenheim_nyc",
    startTime: Timestamp.fromDate(new Date("2025-05-27T11:00:00Z")),
    completedTiles: ["0_0"],
    score: 10,
    status: "active",
  },
];
