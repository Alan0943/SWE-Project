"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  FlatList,
  SafeAreaView,
  Dimensions,
  TextInput,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Share,
} from "react-native"
import { useUser, useAuth } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"

const { width, height } = Dimensions.get("window")
const isPhone = width < 600 // Simple check for screen width

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

// Friend type definition
type Friend = {
  id: string
  name: string
  username: string
  image: any
  favorites: string[]
}

// User type definition for search
interface AppUser {
  id: string
  name: string
  username: string
  imageUrl: string | null
}

// Bar type definition
interface Bar {
  name: string
  waitTime: number
  coverCharge: number
  image: any
  route: string
}

// Mock friends data
const MOCK_FRIENDS: Friend[] = [
  {
    id: "1",
    name: "Alex Johnson",
    username: "alexj",
    image: require("../../assets/images/default-profile.png"),
    favorites: ["MacDinton's Irish Pub", "JJ's Tavern"],
  },
  {
    id: "2",
    name: "Sam Wilson",
    username: "samw",
    image: require("../../assets/images/default-profile.png"),
    favorites: ["Vivid Music Hall", "DTF"],
  },
  {
    id: "3",
    name: "Taylor Smith",
    username: "taylors",
    image: require("../../assets/images/default-profile.png"),
    favorites: ["Cantina", "Range"],
  },
]

// Mock users for search
const MOCK_USERS: AppUser[] = [
  {
    id: "user1",
    name: "John Doe",
    username: "johndoe",
    imageUrl: null,
  },
  {
    id: "user2",
    name: "Jane Smith",
    username: "janesmith",
    imageUrl: null,
  },
  {
    id: "user3",
    name: "Mike Johnson",
    username: "mikej",
    imageUrl: null,
  },
  {
    id: "user4",
    name: "Sarah Williams",
    username: "sarahw",
    imageUrl: null,
  },
  {
    id: "user5",
    name: "Chris Evans",
    username: "chrise",
    imageUrl: null,
  },
  {
    id: "user6",
    name: "Emma Stone",
    username: "emmas",
    imageUrl: null,
  },
  {
    id: "user7",
    name: "Tom Hardy",
    username: "tomh",
    imageUrl: null,
  },
  {
    id: "user8",
    name: "Scarlett Johansson",
    username: "scarlettj",
    imageUrl: null,
  },
]

// Mock bars data
const BARS = [
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
]

export default function Profile() {
  const { user } = useUser()
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("posts")
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS)
  const [showEditUsername, setShowEditUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [username, setUsername] = useState(user?.username || "")
  const [addedFriends, setAddedFriends] = useState<string[]>([])
  const [showFriendProfile, setShowFriendProfile] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchResults, setSearchResults] = useState<AppUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Refs for FlatLists to avoid the nesting error
  const postsListRef = useRef(null)
  const friendsListRef = useRef(null)

  // Load profile image from AsyncStorage
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const storedImage = await AsyncStorage.getItem("profileImage")
        if (storedImage) {
          setProfileImage(storedImage)
        }
      } catch (error) {
        console.error("Error loading profile image:", error)
      }
    }

    loadProfileImage()
  }, [])

  // Load favorites from AsyncStorage
  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem("favorites")
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites))
      }
    } catch (error) {
      console.error("Error loading favorites:", error)
    }
  }

  // Load posts from AsyncStorage
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const storedPosts = await AsyncStorage.getItem("posts")
        if (storedPosts) {
          const parsedPosts = JSON.parse(storedPosts)
          // Filter posts to only show the current user's posts
          const userPosts = parsedPosts.filter((post: Post) => post.username === (username || user?.username || "User"))
          setPosts(userPosts)
        }
      } catch (error) {
        console.error("Error loading posts:", error)
      }
    }

    loadPosts()
  }, [username, user?.username])

  // Load added friends from AsyncStorage on mount
  useEffect(() => {
    const loadAddedFriends = async () => {
      try {
        console.log("Loading added friends from AsyncStorage...")
        const storedFriends = await AsyncStorage.getItem("addedFriends")
        if (storedFriends) {
          const parsedFriends = JSON.parse(storedFriends)
          console.log("Loaded added friends:", parsedFriends)
          setAddedFriends(parsedFriends)
        } else {
          console.log("No added friends found in AsyncStorage")
        }
      } catch (error) {
        console.error("Error loading added friends:", error)
      }
    }

    loadAddedFriends()
  }, [])

  // Update friends list when addedFriends changes
  useEffect(() => {
    // Create a combined list of mock friends and added friends
    const updatedFriends = [...MOCK_FRIENDS]

    // Log for debugging
    console.log("Added friends IDs:", addedFriends)

    // Add any friends from addedFriends that aren't in MOCK_FRIENDS
    addedFriends.forEach((friendId) => {
      // Check if this friend is already in our list
      const existingFriend = updatedFriends.find((f) => f.id === friendId)

      if (!existingFriend) {
        // Find the user in MOCK_USERS
        const user = MOCK_USERS.find((u) => u.id === friendId)

        if (user) {
          // This is a new friend from our mock users
          updatedFriends.push({
            id: friendId,
            name: user.name,
            username: user.username,
            image: user.imageUrl || require("../../assets/images/default-profile.png"),
            favorites: [],
          })
        } else {
          // Fallback for any old friends that might not be in our mock users
          updatedFriends.push({
            id: friendId,
            name: `Friend ${friendId}`,
            username: `user${friendId}`,
            image: require("../../assets/images/default-profile.png"),
            favorites: [],
          })
        }
      }
    })

    setFriends(updatedFriends)
    console.log("Updated friends list:", updatedFriends)
  }, [addedFriends])

  // Search for users
  useEffect(() => {
    if (searchUsername.trim().length > 0) {
      setIsSearching(true)

      // Simulate API call with setTimeout
      const timeoutId = setTimeout(() => {
        const results = MOCK_USERS.filter(
          (user) =>
            user.username.toLowerCase().includes(searchUsername.toLowerCase()) ||
            user.name.toLowerCase().includes(searchUsername.toLowerCase()),
        )

        // Filter out users that are already friends
        const filteredResults = results.filter(
          (user) => !addedFriends.includes(user.id) && !MOCK_FRIENDS.some((friend) => friend.id === user.id),
        )

        setSearchResults(filteredResults)
        setIsSearching(false)
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchUsername, addedFriends])

  const handleEditUsername = () => {
    if (newUsername.trim()) {
      setUsername(newUsername)
      setShowEditUsername(false)
      setNewUsername("")
    }
  }

  const viewFriendProfile = (friend: Friend) => {
    setSelectedFriend(friend)
    setShowFriendProfile(true)
  }

  const removeFriend = async (friendId: string) => {
    // Update local state
    const updatedAddedFriends = addedFriends.filter((id) => id !== friendId)
    setAddedFriends(updatedAddedFriends)

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem("addedFriends", JSON.stringify(updatedAddedFriends))
      console.log("Friend removed and saved to AsyncStorage:", friendId)
    } catch (error) {
      console.error("Error saving updated friends list:", error)
    }

    // Close the modal if open
    if (selectedFriend?.id === friendId) {
      setShowFriendProfile(false)
    }
  }

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Handle like post
  const handleLikePost = async (postId: string) => {
    try {
      // Get all posts
      const storedPosts = await AsyncStorage.getItem("posts")
      if (storedPosts) {
        const allPosts = JSON.parse(storedPosts)

        // Find the post to update
        const updatedPosts = allPosts.map((post: Post) => {
          if (post.id === postId) {
            // Check if user already liked the post
            const userLiked = post.likes.includes(user?.id || "anonymous")

            if (userLiked) {
              // Unlike the post
              return {
                ...post,
                likes: post.likes.filter((id: string) => id !== (user?.id || "anonymous")),
              }
            } else {
              // Like the post
              return {
                ...post,
                likes: [...post.likes, user?.id || "anonymous"],
              }
            }
          }
          return post
        })

        // Save updated posts
        await AsyncStorage.setItem("posts", JSON.stringify(updatedPosts))

        // Update local state with user's posts
        const userPosts = updatedPosts.filter((post: Post) => post.username === (username || user?.username || "User"))
        setPosts(userPosts)

        // Update selected post if in detail view
        if (selectedPost && selectedPost.id === postId) {
          const updatedPost = updatedPosts.find((post: Post) => post.id === postId)
          if (updatedPost) {
            setSelectedPost(updatedPost)
          }
        }
      }
    } catch (error) {
      console.error("Error updating post likes:", error)
    }
  }

  // Add comment to post
  const addComment = async () => {
    if (!selectedPost || !newComment.trim()) return

    try {
      // Get all posts
      const storedPosts = await AsyncStorage.getItem("posts")
      if (storedPosts) {
        const allPosts = JSON.parse(storedPosts)

        // Create new comment
        const comment = {
          id: Date.now().toString(),
          userId: user?.id || "anonymous",
          username: username || user?.username || "User",
          text: newComment.trim(),
          timestamp: Date.now(),
        }

        // Find the post to update
        const updatedPosts = allPosts.map((post: Post) => {
          if (post.id === selectedPost.id) {
            return {
              ...post,
              comments: [...post.comments, comment],
            }
          }
          return post
        })

        // Save updated posts
        await AsyncStorage.setItem("posts", JSON.stringify(updatedPosts))

        // Update local state with user's posts
        const userPosts = updatedPosts.filter((post: Post) => post.username === (username || user?.username || "User"))
        setPosts(userPosts)

        // Update selected post
        const updatedPost = updatedPosts.find((post: Post) => post.id === selectedPost.id)
        if (updatedPost) {
          setSelectedPost(updatedPost)
        }

        // Clear comment input
        setNewComment("")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  // View post details
  const viewPostDetails = (post: Post) => {
    setSelectedPost(post)
    setShowPostDetail(true)
  }

  // Delete post
  const deletePost = async (postId: string) => {
    try {
      // Get all posts
      const storedPosts = await AsyncStorage.getItem("posts")
      if (storedPosts) {
        const allPosts = JSON.parse(storedPosts)

        // Filter out the post to delete
        const updatedPosts = allPosts.filter((post: Post) => post.id !== postId)

        // Save updated posts to AsyncStorage
        await AsyncStorage.setItem("posts", JSON.stringify(updatedPosts))

        // Update local state with user's posts
        const userPosts = updatedPosts.filter((post: Post) => post.username === (username || user?.username || "User"))
        setPosts(userPosts)

        // Close the modal if open
        if (selectedPost?.id === postId) {
          setShowPostDetail(false)
        }

        // Show success message
        Alert.alert("Success", "Post deleted successfully")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      Alert.alert("Error", "Failed to delete post")
    }
  }

  // Share post
  const sharePost = async (post: Post) => {
    try {
      const result = await Share.share({
        message: `Check out this post from ${post.username}${post.barTag ? ` at ${post.barTag}` : ""}!`,
        url: post.imageUri, // This may not work on all platforms, but will be included when available
      })

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log(`Shared with ${result.activityType}`)
        } else {
          // shared
          console.log("Shared successfully")
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log("Share dismissed")
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong sharing this post")
      console.error("Error sharing:", error)
    }
  }

  // Change profile picture
  const changeProfilePicture = async (source: "camera" | "gallery") => {
    try {
      // Request permissions
      if (Platform.OS !== "web") {
        if (source === "camera") {
          const { status } = await ImagePicker.requestCameraPermissionsAsync()
          if (status !== "granted") {
            Alert.alert("Permission needed", "Camera permission is required to take photos")
            return
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
          if (status !== "granted") {
            Alert.alert("Permission needed", "Media library permission is required to select photos")
            return
          }
        }
      }

      // Launch camera or image picker
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri

        // Save to AsyncStorage
        await AsyncStorage.setItem("profileImage", imageUri)

        // Update state
        setProfileImage(imageUri)

        // Close modal
        setShowImageOptions(false)
      }
    } catch (error) {
      console.error("Error changing profile picture:", error)
      Alert.alert("Error", "Failed to change profile picture")
    }
  }

  // Add friend
  const addFriend = async (userId: string, name: string, username: string) => {
    // Update local state
    const updatedAddedFriends = [...addedFriends, userId]
    setAddedFriends(updatedAddedFriends)

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem("addedFriends", JSON.stringify(updatedAddedFriends))
      console.log("Friend added and saved to AsyncStorage:", userId)

      // Clear search and close modal
      setSearchUsername("")
      setSearchResults([])
      setShowAddFriend(false)

      // Show success message
      Alert.alert("Success", `${name} added to your friends`)
    } catch (error) {
      console.error("Error saving updated friends list:", error)
      Alert.alert("Error", "Failed to add friend")
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      setShowSettings(false)
      // The Clerk SDK will handle the redirect to the sign-in page
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Error", "Failed to sign out. Please try again.")
    }
  }

  // Handle delete account
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // In a real app, you would call an API to delete the user's account
              if (user) {
                // Delete user data from AsyncStorage
                await AsyncStorage.removeItem("profileImage")
                await AsyncStorage.removeItem("addedFriends")

                // Sign out the user
                await signOut()
                setShowSettings(false)

                // The Clerk SDK will handle the redirect to the sign-in page
              } else {
                Alert.alert("Error", "User not found. Please try again.")
              }
            } catch (error) {
              console.error("Error deleting account:", error)
              Alert.alert("Error", "Failed to delete account. Please try again.")
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)

    try {
      if (activeTab === "posts") {
        // Reload posts
        const storedPosts = await AsyncStorage.getItem("posts")
        if (storedPosts) {
          const parsedPosts = JSON.parse(storedPosts)
          const userPosts = parsedPosts.filter((post: Post) => post.username === (username || user?.username || "User"))
          setPosts(userPosts)
        }
      } else if (activeTab === "friends") {
        // Reload friends
        const storedFriends = await AsyncStorage.getItem("addedFriends")
        if (storedFriends) {
          setAddedFriends(JSON.parse(storedFriends))
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }, [activeTab, username, user?.username])

  // Render post grid item
  const renderPostGridItem = ({ item }: { item: Post }) => (
    <Pressable style={styles.postGridItem} onPress={() => viewPostDetails(item)}>
      <Image source={{ uri: item.imageUri }} style={styles.postGridImage} />
      <View style={styles.postGridOverlay}>
        <View style={styles.postGridStats}>
          <View style={styles.postGridStat}>
            <Ionicons name="bookmark" size={14} color="white" />
            <Text style={styles.postGridStatText}>{item.likes.length}</Text>
          </View>
          <View style={styles.postGridStat}>
            <Ionicons name="chatbubble" size={14} color="white" />
            <Text style={styles.postGridStatText}>{item.comments.length}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )

  // Render user search result
  const renderUserSearchResult = ({ item }: { item: AppUser }) => (
    <TouchableOpacity style={styles.searchResultItem} onPress={() => addFriend(item.id, item.name, item.username)}>
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : require("../../assets/images/default-profile.png")}
        style={styles.searchResultImage}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultUsername}>@{item.username}</Text>
      </View>
      <Ionicons name="add-circle" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  )

  // Render favorite bar item
  const renderFavoriteBar = ({ item }: { item: string }) => {
    const bar = BARS.find((b) => b.name === item)
    if (!bar) return null

    const getWaitColor = (minutes: number) => {
      if (minutes <= 10) return "limegreen"
      if (minutes <= 20) return "gold"
      return "red"
    }

    const getCoverColor = (amount: number) => {
      if (amount <= 9) return "limegreen"
      if (amount <= 19) return "gold"
      return "red"
    }

    const getCoverLabel = (amount: number) => {
      if (amount === 0) return "Free Entry 🎉"
      if (amount >= 20) return `$${amount} 🚨`
      return `$${amount}`
    }

    const getWaitLabel = (minutes: number) => {
      if (minutes <= 10) return "Short Wait ⏱️"
      if (minutes <= 20) return `${minutes} minutes`
      return `${minutes} minutes ⚠️`
    }

    return (
      <View style={styles.favoriteBarItem}>
        <Image source={bar.image} style={styles.favoriteBarImage} />
        <View style={styles.favoriteBarInfo}>
          <Text style={styles.favoriteBarName}>{bar.name}</Text>
          <View style={styles.favoriteBarDetails}>
            <View style={styles.favoriteBarDetail}>
              <Ionicons name="time-outline" size={14} color={getWaitColor(bar.waitTime)} />
              <Text style={styles.favoriteBarDetailText}>{getWaitLabel(bar.waitTime)}</Text>
            </View>
            <View style={styles.favoriteBarDetail}>
              <Ionicons name="cash-outline" size={14} color={getCoverColor(bar.coverCharge)} />
              <Text style={styles.favoriteBarDetailText}>{getCoverLabel(bar.coverCharge)}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        return (
          <View style={styles.postsContainer}>
            {posts.length === 0 ? (
              <ScrollView
                contentContainerStyle={styles.emptyStateContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
              >
                <Text style={styles.emptyStateText}>No posts yet</Text>
              </ScrollView>
            ) : (
              <FlatList
                key={`posts-grid-${isPhone ? "phone" : "tablet"}`}
                ref={postsListRef}
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={renderPostGridItem}
                numColumns={3}
                contentContainerStyle={styles.postGrid}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
              />
            )}
          </View>
        )
      case "friends":
        return (
          <View style={styles.friendsContainer}>
            <View style={styles.addFriendButtonContainer}>
              <TouchableOpacity style={styles.addFriendButton} onPress={() => setShowAddFriend(true)}>
                <Ionicons name="person-add" size={18} color="black" />
                <Text style={styles.addFriendButtonText}>Add Friend</Text>
              </TouchableOpacity>
            </View>

            {friends.length === 0 ? (
              <ScrollView
                contentContainerStyle={styles.emptyStateContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
              >
                <Text style={styles.emptyStateText}>No friends yet</Text>
              </ScrollView>
            ) : (
              <FlatList
                ref={friendsListRef}
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable style={styles.friendItem} onPress={() => viewFriendProfile(item)}>
                    <Image source={item.image} style={styles.friendImage} />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      <Text style={styles.friendUsername}>@{item.username}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </Pressable>
                )}
                contentContainerStyle={styles.friendsList}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
              />
            )}
          </View>
        )
      case "favorites":
        return (
          <View style={styles.favoritesContainer}>
            {favorites.length === 0 ? (
              <ScrollView
                contentContainerStyle={styles.emptyStateContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
              >
                <Text style={styles.emptyStateText}>No favorite bars yet</Text>
              </ScrollView>
            ) : (
              <FlatList
                data={favorites}
                keyExtractor={(item) => item}
                renderItem={renderFavoriteBar}
                contentContainerStyle={styles.favoritesList}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
              />
            )}
          </View>
        )
      default:
        return null
    }
  }

  // Load favorites from AsyncStorage whenever activeTab changes to "favorites"
  useEffect(() => {
    if (activeTab === "favorites") {
      loadFavorites()
    }
  }, [activeTab])

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Header with Settings Button */}
      <View style={styles.headerContainer}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => setShowImageOptions(true)}>
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : user?.imageUrl
                      ? { uri: user.imageUrl }
                      : require("../../assets/images/default-profile.png")
                }
                style={styles.profileImage}
              />
              <View style={styles.changePhotoButton}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{username || user?.username || "User"}</Text>
            <Pressable style={styles.editUsernameButton} onPress={() => setShowEditUsername(true)}>
              <Text style={styles.editUsernameText}>Change Username</Text>
            </Pressable>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{friends.length}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </View>

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <Ionicons name="grid-outline" size={24} color={activeTab === "posts" ? COLORS.primary : "white"} />
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}
        >
          <Ionicons name="people-outline" size={24} color={activeTab === "friends" ? COLORS.primary : "white"} />
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
          onPress={() => setActiveTab("favorites")}
        >
          <Ionicons name="bookmark-outline" size={24} color={activeTab === "favorites" ? COLORS.primary : "white"} />
        </Pressable>
      </View>

      {/* Content based on active tab */}
      {renderTabContent()}

      {/* Edit Username Modal */}
      <Modal
        visible={showEditUsername}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditUsername(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Username</Text>
            <TextInput
              style={styles.usernameInput}
              placeholder="Enter new username"
              placeholderTextColor="#999"
              value={newUsername}
              onChangeText={setNewUsername}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditUsername(false)
                  setNewUsername("")
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton, !newUsername.trim() && styles.disabledButton]}
                onPress={handleEditUsername}
                disabled={!newUsername.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Friend Profile Modal */}
      <Modal
        visible={showFriendProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFriendProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.friendProfileContent}>
            <View style={styles.friendProfileHeader}>
              <Text style={styles.friendProfileTitle}>Friend Profile</Text>
              <TouchableOpacity onPress={() => setShowFriendProfile(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {selectedFriend && (
              <View style={styles.friendProfileDetails}>
                <Image source={selectedFriend.image} style={styles.friendProfileImage} />
                <Text style={styles.friendProfileName}>{selectedFriend.name}</Text>
                <Text style={styles.friendProfileUsername}>@{selectedFriend.username}</Text>

                <View style={styles.friendFavorites}>
                  <Text style={styles.friendFavoritesTitle}>Favorite Bars:</Text>
                  {selectedFriend.favorites.length > 0 ? (
                    selectedFriend.favorites.map((bar, index) => (
                      <View key={index} style={styles.friendFavoriteBarItem}>
                        <Ionicons name="beer" size={16} color={COLORS.primary} />
                        <Text style={styles.friendFavoriteBarName}>{bar}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noFavoritesText}>No favorite bars yet</Text>
                  )}
                </View>

                <TouchableOpacity style={styles.removeFriendButton} onPress={() => removeFriend(selectedFriend.id)}>
                  <Text style={styles.removeFriendText}>Remove Friend</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        visible={showPostDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPostDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.postDetailContent}>
            <View style={styles.postDetailHeader}>
              <Text style={styles.postDetailTitle}>Post</Text>
              <View style={styles.postDetailHeaderButtons}>
                {selectedPost && selectedPost.username === (username || user?.username || "User") && (
                  <TouchableOpacity
                    style={styles.deletePostButton}
                    onPress={() => {
                      Alert.alert(
                        "Delete Post",
                        "Are you sure you want to delete this post?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Delete Post",
                            style: "destructive",
                            onPress: () => {
                              if (selectedPost) {
                                deletePost(selectedPost.id)
                              }
                            },
                          },
                        ],
                        { cancelable: true },
                      )
                    }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowPostDetail(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedPost && (
              <ScrollView style={styles.postDetailScroll}>
                <View style={styles.postDetailContainer}>
                  {/* Post Header */}
                  <View style={styles.postHeader}>
                    <Image
                      source={
                        selectedPost.userImageUrl
                          ? { uri: selectedPost.userImageUrl }
                          : require("../../assets/images/default-profile.png")
                      }
                      style={styles.postUserImage}
                    />
                    <View style={styles.postHeaderInfo}>
                      <Text style={styles.postUsername}>{selectedPost.username}</Text>
                      <Text style={styles.postBarTag}>{selectedPost.barTag}</Text>
                    </View>
                    <Text style={styles.postDate}>{formatDate(selectedPost.timestamp)}</Text>
                  </View>

                  {/* Post Image */}
                  <Image source={{ uri: selectedPost.imageUri }} style={styles.postDetailImage} />

                  {/* Post Actions */}
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.postAction} onPress={() => handleLikePost(selectedPost.id)}>
                      <Ionicons
                        name={selectedPost.likes.includes(user?.id || "anonymous") ? "bookmark" : "bookmark-outline"}
                        size={24}
                        color={selectedPost.likes.includes(user?.id || "anonymous") ? COLORS.primary : "white"}
                      />
                      <Text style={styles.postActionText}>{selectedPost.likes.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postAction}>
                      <Ionicons name="chatbubble-outline" size={22} color="white" />
                      <Text style={styles.postActionText}>{selectedPost.comments.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postAction} onPress={() => selectedPost && sharePost(selectedPost)}>
                      <Ionicons name="share-social-outline" size={24} color="white" />
                      <Text style={styles.postActionText}>Share</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Post Caption */}
                  <View style={styles.postCaption}>
                    <Text style={styles.postCaptionUsername}>{selectedPost.username}</Text>
                    <Text style={styles.postCaptionText}>{selectedPost.caption}</Text>
                  </View>

                  {/* Comments */}
                  <View style={styles.commentsContainer}>
                    <Text style={styles.commentsTitle}>Comments</Text>
                    {selectedPost.comments.length > 0 ? (
                      selectedPost.comments.map((comment) => (
                        <View key={comment.id} style={styles.commentItem}>
                          <Text style={styles.commentUsername}>{comment.username}</Text>
                          <Text style={styles.commentText}>{comment.text}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noCommentsText}>No comments yet</Text>
                    )}
                  </View>

                  {/* Add Comment */}
                  <View style={styles.addCommentContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="#999"
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <TouchableOpacity
                      style={[styles.postCommentButton, !newComment.trim() && styles.disabledButton]}
                      onPress={addComment}
                      disabled={!newComment.trim()}
                    >
                      <Text style={styles.postCommentText}>Post</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriend}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddFriend(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <TextInput
              style={styles.usernameInput}
              placeholder="Search for users..."
              placeholderTextColor="#999"
              value={searchUsername}
              onChangeText={setSearchUsername}
              autoFocus
            />

            {/* Search Results */}
            {isSearching ? (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.searchingText}>Searching...</Text>
              </View>
            ) : searchUsername.trim().length > 0 && searchResults.length === 0 ? (
              <Text style={styles.noResultsText}>No users found</Text>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={renderUserSearchResult}
                style={styles.searchResultsList}
                ListEmptyComponent={
                  searchUsername.trim().length > 0 ? <Text style={styles.noResultsText}>No users found</Text> : null
                }
              />
            )}

            <TouchableOpacity
              style={[styles.cancelSearchButton]}
              onPress={() => {
                setShowAddFriend(false)
                setSearchUsername("")
                setSearchResults([])
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Picture Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Picture</Text>

            <TouchableOpacity style={styles.imageOptionButton} onPress={() => changeProfilePicture("camera")}>
              <Ionicons name="camera" size={24} color={COLORS.primary} style={styles.imageOptionIcon} />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageOptionButton} onPress={() => changeProfilePicture("gallery")}>
              <Ionicons name="images" size={24} color={COLORS.primary} style={styles.imageOptionIcon} />
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageOptionButton, styles.cancelImageButton]}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModalContent}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsOptions}>
              <TouchableOpacity style={styles.settingsOption} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={24} color="white" style={styles.settingsIcon} />
                <Text style={styles.settingsOptionText}>Sign Out</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsOption} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" style={styles.settingsIcon} />
                <Text style={[styles.settingsOptionText, styles.deleteAccountText]}>Delete Account</Text>
              </TouchableOpacity>
            </View>
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  profileHeader: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 20,
  },
  settingsButton: {
    padding: 10,
    marginTop: 10,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },
  usernameContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  username: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  editUsernameButton: {
    marginTop: 5,
  },
  editUsernameText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    width: "80%",
    justifyContent: "space-around",
    marginTop: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#999",
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  postsContainer: {
    flex: 1,
    minHeight: 200,
  },
  postGrid: {
    padding: 1,
  },
  postGridItem: {
    width: (width - 6) / 3, // 3 columns with 1px spacing
    height: (width - 6) / 3,
    margin: 1,
    position: "relative",
  },
  postGridImage: {
    width: "100%",
    height: "100%",
  },
  postGridOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 4,
  },
  postGridStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  postGridStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  postGridStatText: {
    color: "white",
    fontSize: 12,
    marginLeft: 3,
  },
  friendsContainer: {
    flex: 1,
    minHeight: 200,
  },
  addFriendButtonContainer: {
    padding: 15,
    alignItems: "center",
  },
  addFriendButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  addFriendButtonText: {
    color: "black",
    fontWeight: "bold",
    marginLeft: 5,
  },
  friendsList: {
    paddingVertical: 10,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  friendUsername: {
    color: "#999",
    fontSize: 14,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  emptyStateText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 20,
    width: width * 0.8,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  usernameInput: {
    backgroundColor: "#333",
    borderRadius: 5,
    padding: 12,
    color: "white",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#444",
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  friendProfileContent: {
    backgroundColor: "#222",
    borderRadius: 10,
    width: width * 0.9,
    maxHeight: "80%",
  },
  friendProfileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  friendProfileTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  friendProfileDetails: {
    padding: 20,
    alignItems: "center",
  },
  friendProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  friendProfileName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  friendProfileUsername: {
    color: "#999",
    fontSize: 16,
    marginBottom: 20,
  },
  friendFavorites: {
    width: "100%",
    marginBottom: 20,
  },
  friendFavoritesTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  friendFavoriteBarItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  friendFavoriteBarName: {
    color: "white",
    marginLeft: 8,
  },
  noFavoritesText: {
    color: "#999",
    fontStyle: "italic",
  },
  removeFriendButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  removeFriendText: {
    color: "white",
    fontWeight: "bold",
  },
  postDetailContent: {
    backgroundColor: "#222",
    borderRadius: 10,
    width: width * 0.9,
    maxHeight: "90%",
  },
  postDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  postDetailTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  postDetailHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  deletePostButton: {
    marginRight: 15,
  },
  postDetailScroll: {
    maxHeight: "100%",
  },
  postDetailContainer: {
    padding: 15,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  postUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postUsername: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  postBarTag: {
    color: COLORS.primary,
    fontSize: 13,
  },
  postDate: {
    color: "#999",
    fontSize: 12,
  },
  postDetailImage: {
    width: "100%",
    height: width * 0.8,
    borderRadius: 8,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  postActionText: {
    color: "white",
    marginLeft: 5,
    fontSize: 14,
  },
  postCaption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  postCaptionUsername: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  postCaptionText: {
    color: "white",
  },
  commentsContainer: {
    paddingVertical: 10,
  },
  commentsTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  commentItem: {
    marginBottom: 10,
  },
  commentUsername: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 2,
  },
  commentText: {
    color: "white",
  },
  noCommentsText: {
    color: "#999",
    fontStyle: "italic",
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: "white",
    marginRight: 10,
  },
  postCommentButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postCommentText: {
    color: "black",
    fontWeight: "bold",
  },
  imageOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageOptionIcon: {
    marginRight: 15,
  },
  imageOptionText: {
    color: "white",
    fontSize: 16,
  },
  cancelImageButton: {
    backgroundColor: "#444",
    justifyContent: "center",
    marginTop: 10,
  },
  searchResultsList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  searchResultUsername: {
    color: "#999",
    fontSize: 14,
  },
  searchingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  searchingText: {
    color: "#999",
    marginLeft: 10,
  },
  noResultsText: {
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
  cancelSearchButton: {
    backgroundColor: "#444",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  // Settings modal styles
  settingsModalContent: {
    backgroundColor: "#222",
    borderRadius: 10,
    width: width * 0.8,
    overflow: "hidden",
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  settingsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  settingsOptions: {
    padding: 10,
  },
  settingsOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  settingsIcon: {
    marginRight: 15,
  },
  settingsOptionText: {
    color: "white",
    fontSize: 16,
  },
  deleteAccountText: {
    color: "#FF3B30",
  },
  favoritesContainer: {
    flex: 1,
    minHeight: 200,
  },
  favoritesList: {
    padding: 15,
  },
  favoriteBarItem: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
  favoriteBarImage: {
    width: 80,
    height: 80,
  },
  favoriteBarInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  favoriteBarName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  favoriteBarDetails: {
    flexDirection: "row",
  },
  favoriteBarDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  favoriteBarDetailText: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 4,
  },
})
