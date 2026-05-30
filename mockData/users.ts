import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isPremium: boolean;
  totalBingos: number;
  createdAt: Timestamp;
}

export const NY_USERS: UserProfile[] = [
  {
    uid: "user_alex",
    email: "alex@example.com",
    displayName: "Alex Martinez",
    photoURL: "https://randomuser.me/api/portraits/men/1.jpg",
    isPremium: true,
    totalBingos: 12,
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    uid: "user_jordan",
    email: "jordan@example.com",
    displayName: "Jordan Lee",
    photoURL: "https://randomuser.me/api/portraits/women/2.jpg",
    isPremium: false,
    totalBingos: 3,
    createdAt: Timestamp.fromDate(new Date("2025-04-10")),
  },
  {
    uid: "user_taylor",
    email: "taylor@example.com",
    displayName: "Taylor Smith",
    isPremium: false,
    totalBingos: 7,
    createdAt: Timestamp.fromDate(new Date("2025-05-20")),
  },
  {
    uid: "user_maya",
    email: "maya@example.com",
    displayName: "Maya Gupta",
    photoURL: "https://randomuser.me/api/portraits/women/3.jpg",
    isPremium: true,
    totalBingos: 22,
    createdAt: Timestamp.fromDate(new Date("2025-01-15")),
  },
];
