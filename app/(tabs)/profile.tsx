import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Profile Screen</Text>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    // If your app background is black, keep it or set another color for clarity
    backgroundColor: 'black',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24, 
    color: 'white',
    marginBottom: 40,
  },
  signOutButton: {
    // Use a bright color for a black background
    backgroundColor: '#FF5722',   // Bright orange
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    // Add some margin to separate from other content
    marginVertical: 10,

    // Optional: Add a little shadow (iOS/Android)
    shadowColor: '#fff',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  signOutButtonText: {
    color: 'white',    // Contrasts with orange background
    fontSize: 16,
    fontWeight: 'bold',
  },
});
