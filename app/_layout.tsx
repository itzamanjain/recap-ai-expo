import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function hideSplash() {
      try {
        if (loaded) {
          console.log('[Debug] Hiding splash screen - Fonts loaded:', loaded);
          await SplashScreen.hideAsync();
          console.log('[Debug] Splash screen hidden successfully');
        }
      } catch (error) {
        console.warn('[Debug] Error hiding splash screen:', error);
        // Try hiding again after a short delay as a fallback
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            console.log('[Debug] Splash screen hidden after retry');
          } catch (retryError) {
            console.warn('[Debug] Failed to hide splash screen after retry:', retryError);
          }
        }, 1000);
      }
    }

    hideSplash();
  }, [loaded]);

  // Don't render anything until everything is ready
  if (!loaded) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            headerTitle: "Recap AI",
            headerStyle: {
              backgroundColor: '#fff', // Use a single background color
            },
            headerTitleStyle: {
              color: '#FF6B00',
              fontSize: 24,
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" /> 
    </>
  );
}