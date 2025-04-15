"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { COLORS } from "@/constants/theme"

const { width } = Dimensions.get("window")

// Post type definition
interface Post {
  id: string
  imageUri: string
  caption: string
  username: string
  userImageUrl: string | null
  timestamp: number
  likes: string[] // array of user IDs who liked the post
  comments: Comment[]
  barTag: string | null
}

interface Comment {
  id: string
  userId: string
  username: string
  text: string
  timestamp: number
}

export default function Create() {
  const { user } = useUser()
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBarTag, setSelectedBarTag] = useState<string | null>(null)
  const [showBarPicker, setShowBarPicker] = useState(false)

  // Bar data for tags
  const bars = [
    { name: "MacDinton's Irish Pub", image: require("../../assets/images/macdintons.jpg") },
    { name: "JJ's Tavern", image: require("../../assets/images/jjs.jpg") },
    { name: "Vivid Music Hall", image: require("../../assets/images/vivid.jpg") },
    { name: "DTF", image: require("../../assets/images/dtf.jpg") },
    { name: "Cantina", image: require("../../assets/images/Cantina.jpg") },
    { name: "Lil Rudy's", image: require("../../assets/images/LilRudys.jpg") },
    { name: "Range", image: require("../../assets/images/range.jpg") },
  ]

  // Load posts from AsyncStorage
  const loadPosts = async () => {
    try {
      const storedPosts = await AsyncStorage.getItem("posts")
      return storedPosts ? JSON.parse(storedPosts) : []
    } catch (error) {
      console.error("Error loading posts:", error)
      return []
    }
  }

  // Save posts to AsyncStorage
  const savePosts = async (updatedPosts: Post[]) => {
    try {
      await AsyncStorage.setItem("posts", JSON.stringify(updatedPosts))
    } catch (error) {
      console.error("Error saving posts:", error)
    }
  }

  // Pick an image from the library
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  // Create a new post
  const createPost = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image")
      return
    }

    if (!caption.trim()) {
      Alert.alert("Error", "Please add a caption")
      return
    }

    if (!selectedBarTag) {
      Alert.alert("Error", "Please tag a bar for your post")
      return
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to create a post")
      return
    }

    setIsLoading(true)

    try {
      // Load existing posts
      const existingPosts = await loadPosts()

      // Create new post object
      const newPost: Post = {
        id: Date.now().toString(),
        imageUri: selectedImage,
        caption: caption.trim(),
        username: user.username || user.firstName || "Anonymous",
        userImageUrl: user.imageUrl,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        barTag: selectedBarTag,
      }

      // Add to posts array
      const updatedPosts = [newPost, ...existingPosts]

      // Save to storage
      await savePosts(updatedPosts)

      // Reset form
      setSelectedImage(null)
      setCaption("")
      setSelectedBarTag(null)

      Alert.alert("Success", "Your post has been created!", [
        {
          text: "View on Profile",
          onPress: () => router.push("/(tabs)/profile"),
        },
        {
          text: "Back to Home",
          onPress: () => router.push("/(tabs)"),
        },
      ])
    } catch (error) {
      console.error("Error creating post:", error)
      Alert.alert("Error", "Failed to create post. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Create New Post</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Create Post Section */}
        <View style={styles.createSection}>
          {/* Image Picker */}
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="image-outline" size={40} color="#666" />
                <Text style={styles.placeholderText}>Tap to select an image</Text>
              </View>
            )}
          </Pressable>

          {/* Caption Input */}
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#666"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
          />

          {/* Character Count */}
          <Text style={styles.charCount}>{caption.length}/200</Text>

          {/* Bar Tag Selection */}
          <Pressable style={styles.barTagButton} onPress={() => setShowBarPicker(!showBarPicker)}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
            <Text style={styles.barTagText}>{selectedBarTag ? selectedBarTag : "Tag a Bar (Required)"}</Text>
            <Ionicons name={showBarPicker ? "chevron-up" : "chevron-down"} size={20} color="#999" />
          </Pressable>

          {/* Bar Picker */}
          {showBarPicker && (
            <View style={styles.barPickerContainer}>
              {bars.map((bar) => (
                <Pressable
                  key={bar.name}
                  style={[styles.barItem, selectedBarTag === bar.name && styles.selectedBarItem]}
                  onPress={() => {
                    setSelectedBarTag(bar.name)
                    setShowBarPicker(false)
                  }}
                >
                  <Image source={bar.image} style={styles.barItemImage} />
                  <Text style={[styles.barItemText, selectedBarTag === bar.name && styles.selectedBarItemText]}>
                    {bar.name}
                  </Text>
                  {selectedBarTag === bar.name && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </Pressable>
              ))}
            </View>
          )}

          {/* Post Button */}
          <Pressable
            style={[
              styles.postButton,
              (!selectedImage || !caption.trim() || !selectedBarTag || isLoading) && styles.disabledButton,
            ]}
            onPress={createPost}
            disabled={!selectedImage || !caption.trim() || !selectedBarTag || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  createSection: {
    padding: 20,
  },
  imagePicker: {
    width: "100%",
    height: 250,
    backgroundColor: "#222",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#888",
    marginTop: 10,
  },
  captionInput: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 15,
    color: "white",
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    color: "#666",
    fontSize: 12,
    textAlign: "right",
    marginTop: 5,
    marginBottom: 15,
  },
  barTagButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  barTagText: {
    color: "white",
    flex: 1,
    marginLeft: 10,
  },
  barPickerContainer: {
    backgroundColor: "#222",
    borderRadius: 10,
    marginBottom: 15,
    maxHeight: 200,
  },
  barItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  barItemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedBarItem: {
    backgroundColor: "rgba(74, 222, 128, 0.1)",
  },
  barItemText: {
    color: "white",
    fontSize: 16,
    flex: 1,
  },
  selectedBarItemText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  postButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  postButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
})
