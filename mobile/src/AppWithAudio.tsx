import { NavigationContainer } from '@react-navigation/native';
import { NativeStackScreenProps, createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { audioManager } from './audio/AudioManager';
import { SignInScreen } from './components/SignInScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import { RootStackParamList } from './navigation/types';
import { AudioSettingsScreen } from './screens/AudioSettingsScreen';
import { FeedbackSettingsScreen } from './screens/FeedbackSettingsScreen';
import { GameScreenWithAudio } from './screens/GameScreenWithAudio';
import { HistoricalMuseumsMapScreen } from './screens/HistoricalMuseumsMapScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ImmersiveSettingsScreen } from './screens/ImmersiveSettingsScreen';
import { LocationSettingsScreen } from './screens/LocationSettingsScreen';
import { MultiplayerLobby } from './screens/MultiplayerLobby';
import { MultiplayerGameScreen } from './screens/MultiplayerGameScreen';
import { MuseumSelectorScreen } from './screens/MuseumSelectorScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { appTheme } from './theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();
type GameScreenRouteProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

const GameScreenRoute: React.FC<GameScreenRouteProps> = ({ route }) => {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  return (
    <GameScreenWithAudio
      museumId={route.params?.museumId ?? 'smithsonian_american_history'}
      userId={user.uid}
      sessionId={`session-${Date.now().toString()}`}
    />
  );
};

const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useVoiceGuidance();

  return <>{children}</>;
};

const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await audioManager.initialize();
      setAudioReady(true);
    };
    void setup();
  }, []);

  if (isLoading || !audioReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={appTheme.colors.accent} />
      </View>
    );
  }

  return (
    <AudioProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: appTheme.colors.bgElevated },
          headerTintColor: appTheme.colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: appTheme.colors.bg },
          headerShadowVisible: false,
        }}
      >
        {!user ? (
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Museum.Bingo', headerLargeTitle: true }}
            />
            <Stack.Screen name="Game" options={{ headerShown: false }}>
              {(props) => <GameScreenRoute {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="MuseumSelector"
              component={MuseumSelectorScreen}
              options={{ title: 'Select Museum' }}
            />
            <Stack.Screen
              name="LocationSettings"
              component={LocationSettingsScreen}
              options={{ title: 'Location Settings' }}
            />
            <Stack.Screen name="Map" component={HistoricalMuseumsMapScreen} options={{ title: 'Historical Map' }} />
            <Stack.Screen
              name="AudioSettings"
              component={AudioSettingsScreen}
              options={{ title: 'Audio and Voice' }}
            />
            <Stack.Screen
              name="FeedbackSettings"
              component={FeedbackSettingsScreen}
              options={{ title: 'Feedback Settings' }}
            />
            <Stack.Screen
              name="ImmersiveSettings"
              component={ImmersiveSettingsScreen}
              options={{ title: 'Immersive Mode' }}
            />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Membership and Rewards' }} />
            <Stack.Screen
              name="Multiplayer"
              component={MultiplayerLobby}
              initialParams={{ museumId: 'smithsonian_american_history' }}
              options={{ title: 'Multiplayer' }}
            />
            <Stack.Screen
              name="MultiplayerGame"
              component={MultiplayerGameScreen}
              options={{ title: 'Multiplayer Game' }}
            />
          </>
        )}
      </Stack.Navigator>
    </AudioProvider>
  );
};

const AppWithAudio: React.FC = () => {
  return (
    <AuthProvider>
      <LocationProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </LocationProvider>
    </AuthProvider>
  );
};

export default AppWithAudio;
