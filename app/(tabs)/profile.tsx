// app/(tabs)/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useClerk, useUser } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const [username, setUsername] = useState(user?.username || '');
  const [editingUsername, setEditingUsername] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.imageUrl || null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);

      // TODO: Upload image to Clerk or a remote storage
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleUsernameSave = () => {
    setEditingUsername(false);
    // TODO: Save username to Clerk user metadata or a backend
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePickImage}>
        <Image
          source={
            profilePic
              ? { uri: profilePic }
              : require('../../assets/images/default-profile.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.changePhotoText}>Change Profile Photo</Text>
      </Pressable>

      {editingUsername ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter Username"
            value={username}
            onChangeText={setUsername}
          />
          <Pressable onPress={handleUsernameSave}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.username}>{username}</Text>
          <Pressable onPress={() => setEditingUsername(true)}>
            <Text style={styles.editText}>Edit Username</Text>
          </Pressable>
        </>
      )}

      <Pressable onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
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
  },
  username: {
    color: 'white',
    fontSize: 20,
    marginBottom: 8,
  },
  editText: {
    color: '#00bfff',
    fontSize: 14,
    marginBottom: 30,
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
    marginBottom: 30,
  },
  signOutButton: {
    backgroundColor: 'orangered',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
