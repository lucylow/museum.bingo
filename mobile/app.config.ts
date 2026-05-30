import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  plugins: [
    '@react-native-firebase/app',
    [
      'expo-build-properties',
      {
        ios: { useFrameworks: 'static' },
        android: {
          package: 'com.museumbingo.app',
          googleServicesFile: './google-services.json',
        },
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: 'com.googleusercontent.apps.YOUR_IOS_CLIENT_ID' },
    ],
  ],
});
