import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        {/* Header */}
     
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageIcon}>👤</Text>
            </View>
          </View>
          <ThemedText style={styles.userName}>John Doe</ThemedText>
          <ThemedText style={styles.userPlan}>Premium Plan</ThemedText>
          <View style={styles.proUserBadge}>
            <ThemedText style={styles.proUserText}>Pro User</ThemedText>
          </View>
        </View>

        {/* App Preferences */}
        <ThemedView 
          style={styles.preferencesCard}
          lightColor={Colors.light.cardBackground}
          darkColor={Colors.dark.cardBackground}
        >
          <ThemedText style={styles.cardTitle}>App Preferences</ThemedText>
          
          <View style={styles.preferenceItem}>
            <ThemedText style={styles.preferenceText}>Dark Mode</ThemedText>
            <Switch
              trackColor={{ false: '#e0e0e0', true: '#FF6B00' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#e0e0e0"
              value={theme === 'dark'}
              onValueChange={toggleTheme}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <ThemedText style={styles.preferenceText}>Notifications</ThemedText>
            <Switch
              trackColor={{ false: '#e0e0e0', true: '#FF6B00' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#e0e0e0"
              value={true}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <ThemedText style={styles.preferenceText}>Auto-transcribe</ThemedText>
            <Switch
              trackColor={{ false: '#e0e0e0', true: '#FF6B00' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#e0e0e0"
              value={true}
            />
          </View>
        </ThemedView>

        {/* Account Stats */}
        <ThemedView 
          style={styles.statsCard}
          lightColor={Colors.light.cardBackground}
          darkColor={Colors.dark.cardBackground}
        >
          <ThemedText style={styles.cardTitle}>Account Stats</ThemedText>
          
          <View style={styles.statsGrid}>
            <ThemedView 
              style={styles.statItem}
              lightColor={Colors.light.background}
              darkColor={Colors.dark.background}
            >
              <ThemedText style={styles.statNumber}>12</ThemedText>
              <ThemedText style={styles.statLabel}>Recordings</ThemedText>
            </ThemedView>
            
            <ThemedView 
              style={styles.statItem}
              lightColor={Colors.light.background}
              darkColor={Colors.dark.background}
            >
              <ThemedText style={styles.statNumber}>8</ThemedText>
              <ThemedText style={styles.statLabel}>Transcripts</ThemedText>
            </ThemedView>
            
            <ThemedView 
              style={styles.statItem}
              lightColor={Colors.light.background}
              darkColor={Colors.dark.background}
            >
              <ThemedText style={styles.statNumber}>4.2</ThemedText>
              <ThemedText style={styles.statLabel}>Hours Saved</ThemedText>
            </ThemedView>
            
            <ThemedView 
              style={styles.statItem}
              lightColor={Colors.light.background}
              darkColor={Colors.dark.background}
            >
              <ThemedText style={styles.statNumber}>24</ThemedText>
              <ThemedText style={styles.statLabel}>AI Queries</ThemedText>
            </ThemedView>
          </View>
        </ThemedView>
      </ScrollView>

      {/* Float Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageIcon: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userPlan: {
    fontSize: 16,
    marginBottom: 8,
  },
  proUserBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  proUserText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '500',
  },
  preferencesCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  preferenceText: {
    fontSize: 16,
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});