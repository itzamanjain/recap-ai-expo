import { useCallback } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_PREFERENCE_KEY = '@theme_preference';

export function useThemeManager() {
  const deviceColorScheme = useDeviceColorScheme();
  
  const setThemePreference = useCallback(async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  const getThemePreference = useCallback(async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      return (savedPreference || deviceColorScheme) as 'light' | 'dark';
    } catch (error) {
      console.error('Failed to get theme preference:', error);
      return deviceColorScheme as 'light' | 'dark';
    }
  }, [deviceColorScheme]);

  return {
    setThemePreference,
    getThemePreference,
  };
}