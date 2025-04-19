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
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { COLORS } from "@/constants/theme"
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import * as FileSystem from "expo-file-system"

const { width, height } = Dimensions.get("window")

export default function Create() {
  const { user } = useUser()
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBarTag, setSelectedBarTag] = useState<string | null>(null)
  const [showBarPicker, setShowBarPicker] = useState(false)

  // Convex mutations
  const generatedUploadUrl = useMutation(api.posts.generatedUploadUrl)
  const createPost = useMutation(api.posts.createPost)

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

  // Upload image to Convex storage
  const uploadImageToConvex = async (uri: string) => {
    try {
      // Get upload URL from Convex
      const uploadUrl = await generatedUploadUrl()

      if (Platform.OS === "web") {
        // For web, we need to fetch the image and upload it as a blob
        const response = await fetch(uri)
        const blob = await response.blob()

        // Upload the blob directly
        const result = await fetch(uploadUrl, {
          method: "POST",
          body: blob,
        })

        if (!result.ok) {
          throw new Error(`Upload failed with status ${result.status}`)
        }

        const data = await result.json()
        return data.storageId
      } else {
        // For native platforms, use FileSystem
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          mimeType: "image/jpeg",
        })

        if (uploadResult.status !== 200) {
          throw new Error(`Upload failed with status ${uploadResult.status}`)
        }

        const { storageId } = JSON.parse(uploadResult.body)
        return storageId
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    }
  }

  // Handle post creation
  const handleCreatePost = async () => {
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
      console.log("Starting post creation process...")

      // Step 1: Upload image to Convex storage
      console.log("Uploading image...")
      const storageId = await uploadImageToConvex(selectedImage)

      if (!storageId) {
        throw new Error("Failed to get storage ID after upload")
      }

      console.log("Image uploaded successfully, storageId:", storageId)

      // Step 2: Create the post in Convex
      console.log("Creating post with caption, storageId, and barTag...")
      const postId = await createPost({
        caption: caption.trim(),
        storageId,
        barTag: selectedBarTag,
      })

      console.log("Post created successfully:", postId)

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
      Alert.alert("Error", `Failed to create post: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle bar picker modal
  const toggleBarPicker = () => {
    setShowBarPicker(!showBarPicker)
  }

  // Select a bar and close the picker
  const selectBar = (barName: string) => {
    setSelectedBarTag(barName)
    setShowBarPicker(false)
  }

  // Render a bar item
  const renderBarItem = ({ item }: { item: { name: string; image: any } }) => (
    <TouchableOpacity
      style={[styles.barItem, selectedBarTag === item.name && styles.selectedBarItem]}
      onPress={() => selectBar(item.name)}
      activeOpacity={0.7}
    >
      <Image source={item.image} style={styles.barItemImage} />
      <Text style={[styles.barItemText, selectedBarTag === item.name && styles.selectedBarItemText]}>{item.name}</Text>
      {selectedBarTag === item.name && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <Pressable style={styles.barTagButton} onPress={toggleBarPicker}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
            <Text style={styles.barTagText}>{selectedBarTag ? selectedBarTag : "Tag a Bar (Required)"}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </Pressable>

          {/* Post Button */}
          <Pressable
            style={[
              styles.postButton,
              (!selectedImage || !caption.trim() || !selectedBarTag || isLoading) && styles.disabledButton,
            ]}
            onPress={handleCreatePost}
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

      {/* Bar Picker Modal */}
      <Modal
        visible={showBarPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Bar</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowBarPicker(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <FlatList
              key="create-bar-list"
              data={bars}
              renderItem={renderBarItem}
              keyExtractor={(item) => item.name}
              style={styles.barList}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#222",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  barList: {
    maxHeight: height * 0.6,
  },
  barItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
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
})
