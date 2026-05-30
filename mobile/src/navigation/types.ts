export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  Map: undefined;
  Game: { museumId?: string; museumName?: string } | undefined;
  MuseumSelector: undefined;
  LocationSettings: undefined;
  AudioSettings: undefined;
  FeedbackSettings: undefined;
  Subscription: undefined;
  Multiplayer: { museumId?: string };
  MultiplayerGame: { roomId: string; museumId: string; isHost: boolean };
};
