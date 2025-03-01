import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { AudioLinesIcon, HomeIcon, NotebookTabsIcon, NotepadTextDashedIcon, UserCircle } from 'lucide-react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
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
              color={focused ? Colors[theme].tint : Colors[theme].tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transcripts"
        options={{
          title: 'Transcripts',
          tabBarIcon: ({ focused }) => (
            
            <Ionicons name="document-text-outline" size={28} color={focused ? Colors[theme].tint : Colors[theme].tabIconDefault} />
            
          ),
        }}
      />
      {/* high light this button and little popout 3d effect */}
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: ({ focused }) => (
            <AudioLinesIcon
              size={40}
              color="#FF6B00"
              style={{
                
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
              color={focused ? Colors[theme].tint : Colors[theme].tabIconDefault}
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
              color={focused ? Colors[theme].tint : Colors[theme].tabIconDefault}
            />
          ),
        }}
      />
    </Tabs>
  );
}
