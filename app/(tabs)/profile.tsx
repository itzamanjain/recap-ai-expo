import React from 'react';
import { StyleSheet, View, Text, Switch, ScrollView } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageIcon}>👻</Text>
            </View>
          </View>
          <Text style={styles.userName}>Coming Soon</Text>
          <Text style={styles.userPlan}>Premium Plan</Text>
          <View style={styles.proUserBadge}>
            <Text style={styles.proUserText}>Pro User</Text>
          </View>
        </View>

        {/* App Preferences */}
        {/* Account Stats */}
        {/* <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Account Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Recordings</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Transcripts</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.2</Text>
              <Text style={styles.statLabel}>Hours Saved</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>AI Queries</Text>
            </View>
          </View>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  profileSection: {
    alignItems: 'center',
    height: '100%',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
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
    color: '#333333',
  },
  userPlan: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666666',
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333333',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  preferenceText: {
    fontSize: 16,
    color: '#333333',
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#F5F5F5',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  }
});