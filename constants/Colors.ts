/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColor = '#FF6B00';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: tintColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColor,
    cardBackground: '#F5F5F5',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1C1C1C',
    tint: tintColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColor,
    cardBackground: 'rgba(255, 245, 235, 0.08)',
  },
};
