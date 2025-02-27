import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { AudioLinesIcon, HomeIcon, NotebookTabsIcon, NotepadTextDashedIcon, UserCircle } from 'lucide-react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <HomeIcon
              size={28}
              color={focused ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transcripts"
        options={{
          title: 'Transcripts',
          tabBarIcon: ({ focused }) => (
            <NotepadTextDashedIcon
              size={28}
              color={focused ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <AudioLinesIcon
              size={40}
              color="#FF6B00"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="summaries"
        options={{
          title: 'Summaries',
          tabBarIcon: ({ focused }) => (
            <NotebookTabsIcon
              size={28}
              color={focused ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <UserCircle
              size={28}
              color={focused ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          ),
        }}
      />
    </Tabs>
  );
}
