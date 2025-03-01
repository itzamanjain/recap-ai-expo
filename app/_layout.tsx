import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React,{ useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/hooks/ThemeContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme, isThemeReady } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function hideSplash() {
      try {
        if (loaded && isThemeReady) {
          console.log('[Debug] Hiding splash screen - Fonts loaded:', loaded, 'Theme ready:', isThemeReady);
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
  }, [loaded, isThemeReady]);

  // Don't render anything until everything is ready
  if (!loaded || !isThemeReady) {
    return null;
  }

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            headerTitle: "Recap AI",
            headerStyle: {
              backgroundColor: theme === 'dark' ? '#000' : '#fff',
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
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
