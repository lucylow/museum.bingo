export interface MultilingualUser {
  uid: string;
  email: string;
  displayName: string;
  preferredLanguage: string;
  isPremium: boolean;
}

export const NY_USERS_MULTILINGUAL: MultilingualUser[] = [
  { uid: "user_emma", email: "emma@example.com", displayName: "Emma González", preferredLanguage: "es", isPremium: true },
  { uid: "user_pierre", email: "pierre@example.com", displayName: "Pierre Dubois", preferredLanguage: "fr", isPremium: false },
  { uid: "user_klaus", email: "klaus@example.com", displayName: "Klaus Schmidt", preferredLanguage: "de", isPremium: true },
  { uid: "user_li", email: "li@example.com", displayName: "Li Wei", preferredLanguage: "zh", isPremium: false },
  { uid: "user_john", email: "john@example.com", displayName: "John Carter", preferredLanguage: "en", isPremium: true },
];
