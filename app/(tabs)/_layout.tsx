import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
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
            <Ionicons
              name="home-outline"
              size={28}
              color={focused ? Colors.tint : Colors.tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transcripts"
        options={{
          title: 'Notes',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name="document-text-outline" 
              size={28} 
              color={focused ? Colors.tint : Colors.tabIconDefault} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="mic-outline"
              size={28}
              color={focused ? Colors.tint : Colors.tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="person-outline"
              size={28}
              color={focused ? Colors.tint : Colors.tabIconDefault}
            />
          ),
        }}
      />
    </Tabs>
  );
}