// app/(tabs)/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { useFavorites } from '../../src/contexts/FavoritesContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { favorites } = useFavorites();
  const router = useRouter();

  const [username, setUsername] = useState(user?.username || '');
  const [editingUsername, setEditingUsername] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);

  // Bar data - same as in index.tsx
  const bars = [
    {
      name: "MacDinton's Irish Pub",
      waitTime: 21,
      coverCharge: 10,
      image: require("../../assets/images/macdintons.jpg"),
      route: "/(bars)/MacDintons",
    },
    {
      name: "JJ's Tavern",
      waitTime: 11,
      coverCharge: 10,
      image: require("../../assets/images/jjs.jpg"),
      route: "/(bars)/JJsTavern",
    },
    {
      name: "Vivid Music Hall",
      waitTime: 0,
      coverCharge: 0,
      image: require("../../assets/images/vivid.jpg"),
      route: "/(bars)/VividMusicHall",
    },
    {
      name: "DTF",
      waitTime: 15,
      coverCharge: 20,
      image: require("../../assets/images/dtf.jpg"),
      route: "/(bars)/DTF",
    },
    {
      name: "Cantina",
      waitTime: 35,
      coverCharge: 20,
      image: require("../../assets/images/Cantina.jpg"),
      route: "/(bars)/Cantina",
    },
    {
      name: "Lil Rudy's",
      waitTime: 0,
      coverCharge: 5,
      image: require("../../assets/images/LilRudys.jpg"),
      route: "/(bars)/LilRudys",
    },
    {
      name: "Range",
      waitTime: 20,
      coverCharge: 10,
      image: require("../../assets/images/range.jpg"),
      route: "/(bars)/Range",
    },
  ];

  // Helper functions from index.tsx
  const getWaitColor = (minutes: number) => {
    if (minutes <= 10) return "limegreen";
    if (minutes <= 20) return "gold";
    return "red";
  };

  const getCoverColor = (amount: number) => {
    if (amount <= 9) return "limegreen";
    if (amount <= 19) return "gold";
    return "red";
  };

  const getCoverLabel = (amount: number) => {
    if (amount === 0) return "Free Entry 🎉";
    if (amount >= 20) return `$${amount} 🚨`;
    return `$${amount}`;
  };

  const getWaitLabel = (minutes: number) => {
    if (minutes <= 10) return "Short Wait ⏱️";
    if (minutes <= 20) return `${minutes} minutes`;
    return `${minutes} minutes ⚠️`;
  };

  const handlePickImage = async () => {
    try {
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled) return;

      // Show loading indicator
      setIsLoading(true);

      const uri = result.assets[0].uri;
      
      // First update local state for immediate UI feedback
      setProfilePic(uri);

      // Convert image to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload to Clerk
      await user?.setProfileImage({
        file: blob,
      });
      
      // Refresh user data to get the updated image URL
      await user?.reload();
      
      // FIX: Get the profile image URL more safely
      const primaryImage = user?.imageUrl;
      
      // Update state with the image URL if it exists, otherwise keep the local URI
      if (primaryImage) {
        setProfilePic(primaryImage);
      }
      
      // Show success message
      Alert.alert("Success", "Profile picture updated successfully");
    } catch (error) {
      console.error("Error updating profile image:", error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
      
      // Revert to previous image on error - safely
      const fallbackImage = user?.imageUrl || null;
      setProfilePic(fallbackImage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleUsernameSave = async () => {
    try {
      // Validate username
      if (!username.trim()) {
        Alert.alert("Error", "Username cannot be empty");
        return;
      }
      
      // Show loading indicator
      setIsLoading(true);
      
      // Update username in Clerk
      await user?.update({
        username: username,
      });
      
      // Refresh user data
      await user?.reload();
      
      // Exit editing mode
      setEditingUsername(false);
      
      // Show success message
      Alert.alert("Success", "Username updated successfully");
    } catch (error) {
      console.error("Error updating username:", error);
      Alert.alert("Error", "Failed to update username. Please try again.");
      
      // Revert to previous username on error
      setUsername(user?.username || '');
    } finally {
      setIsLoading(false);
    }
  };

  // Get only the favorited bars
  const favoritedBars = bars.filter(bar => favorites.includes(bar.name));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.profileSection}>
        <Pressable onPress={handlePickImage} disabled={isLoading}>
          {isLoading ? (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }]}>
              <Text style={{ color: 'white' }}>Loading...</Text>
            </View>
          ) : (
            <Image
              source={
                profilePic
                  ? { uri: profilePic }
                  : require('../../assets/images/default-profile.png')
              }
              style={styles.avatar}
            />
          )}
          <Text style={[styles.changePhotoText, isLoading && { opacity: 0.5 }]}>
            Change Profile Photo
          </Text>
        </Pressable>

        {editingUsername ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter Username"
              value={username}
              onChangeText={setUsername}
              editable={!isLoading}
            />
            <Pressable onPress={handleUsernameSave} disabled={isLoading}>
              <Text style={[styles.saveText, isLoading && { opacity: 0.5 }]}>
                {isLoading ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.username}>{username}</Text>
            <Pressable onPress={() => setEditingUsername(true)} disabled={isLoading}>
              <Text style={[styles.editText, isLoading && { opacity: 0.5 }]}>
                Edit Username
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Favorites Section */}
      <View style={styles.favoritesSection}>
        <Text style={styles.sectionTitle}>My Favorite Bars</Text>
        
        {favoritedBars.length === 0 ? (
          <View style={styles.emptyFavorites}>
            <Ionicons name="star-outline" size={40} color="#555" />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>Add favorites from the Bars tab</Text>
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {favoritedBars.map((bar) => (
              <Pressable 
                key={bar.name}
                style={styles.favoriteBar}
                onPress={() => router.push(bar.route as any)}
              >
                <Image 
                  source={bar.image} 
                  style={styles.barImage}
                  resizeMode="cover"
                />
                <View style={styles.barInfo}>
                  <Text style={styles.barName}>{bar.name}</Text>
                  <View style={styles.barStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color={getWaitColor(bar.waitTime)} />
                      <Text style={styles.statText}>
                        Wait: <Text style={{ color: getWaitColor(bar.waitTime) }}>{getWaitLabel(bar.waitTime)}</Text>
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="cash-outline" size={14} color={getCoverColor(bar.coverCharge)} />
                      <Text style={styles.statText}>
                        Cover: <Text style={{ color: getCoverColor(bar.coverCharge) }}>{getCoverLabel(bar.coverCharge)}</Text>
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" style={styles.chevron} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Pressable 
        onPress={handleSignOut} 
        style={[styles.signOutButton, isLoading && { opacity: 0.5 }]}
        disabled={isLoading}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 10,
  },
  changePhotoText: {
    color: '#00bfff',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  username: {
    color: 'white',
    fontSize: 20,
    marginBottom: 8,
  },
  editText: {
    color: '#00bfff',
    fontSize: 14,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#222',
    color: 'white',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    width: 200,
    textAlign: 'center',
  },
  saveText: {
    color: 'limegreen',
    fontSize: 14,
    marginBottom: 10,
  },
  signOutButton: {
    backgroundColor: 'orangered',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Favorites section styles
  favoritesSection: {
    padding: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyFavorites: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    padding: 30,
    borderRadius: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  favoritesList: {
    gap: 10,
  },
  favoriteBar: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 10,
    overflow: 'hidden',
    height: 80,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: 'limegreen',
  },
  barImage: {
    width: 80,
    height: 80,
  },
  barInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  barName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  barStats: {
    gap: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 4,
  },
  chevron: {
    marginRight: 10,
  },
});