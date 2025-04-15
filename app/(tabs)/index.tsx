"use client"

import { useState, useEffect } from "react"
import {
  Image,
  Text,
  View,
  Pressable,
  Platform,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native"
import { styles as authStyles } from "../../styles/auth.styles"
import { useRouter } from "expo-router"
import FlipCard from "react-native-flip-card"
import { useFavorites } from "../../src/contexts/FavoritesContext"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useUser } from "@clerk/clerk-expo"
import { COLORS } from "@/constants/theme"

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

export default function Index() {
  const router = useRouter()
  const { favorites, toggleFavorite } = useFavorites()
  const { user } = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [commentModalVisible, setCommentModalVisible] = useState(false)

  // ✅ Bar data
  const bars = [
    {
      name: "MacDinton's Irish Pub",
      waitTime: 21,
      coverCharge: 10,
      image: require("../../assets/images/macdintons.jpg"),
      route: "/(tabs)/MacDintons",
    },
    {
      name: "JJ's Tavern",
      waitTime: 11,
      coverCharge: 10,
      image: require("../../assets/images/jjs.jpg"),
      route: "/(tabs)/JJsTavern",
    },
    {
      name: "Vivid Music Hall",
      waitTime: 0,
      coverCharge: 0,
      image: require("../../assets/images/vivid.jpg"),
      route: "/(tabs)/VividMusicHall",
    },
    {
      name: "DTF",
      waitTime: 15,
      coverCharge: 20,
      image: require("../../assets/images/dtf.jpg"),
      route: "/(tabs)/DTF",
    },
    {
      name: "Cantina",
      waitTime: 35,
      coverCharge: 20,
      image: require("../../assets/images/Cantina.jpg"),
      route: "/Cantina",
    },
    {
      name: "Lil Rudy's",
      waitTime: 0,
      coverCharge: 5,
      image: require("../../assets/images/LilRudys.jpg"),
      route: "/(tabs)/LilRudys",
    },
    {
      name: "Range",
      waitTime: 20,
      coverCharge: 10,
      image: require("../../assets/images/range.jpg"),
      route: "/Range",
    },
  ]

  // Load posts from AsyncStorage
  const loadPosts = async () => {
    try {
      setLoading(true)
      const storedPosts = await AsyncStorage.getItem("posts")
      if (storedPosts) {
        setPosts(JSON.parse(storedPosts))
      }
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  // Save posts to AsyncStorage
  const savePosts = async (updatedPosts: Post[]) => {
    try {
      await AsyncStorage.setItem("posts", JSON.stringify(updatedPosts))
      setPosts(updatedPosts)
    } catch (error) {
      console.error("Error saving posts:", error)
    }
  }

  // Handle like post
  const handleLikePost = (postId: string) => {
    if (!user) return

    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        const userLiked = post.likes.includes(user.id)
        const updatedLikes = userLiked ? post.likes.filter((id) => id !== user.id) : [...post.likes, user.id]

        return {
          ...post,
          likes: updatedLikes,
        }
      }
      return post
    })

    savePosts(updatedPosts)
  }

  // Handle add comment
  const handleAddComment = () => {
    if (!user || !selectedPost || !commentText.trim()) return

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username || user.firstName || "Anonymous",
      text: commentText.trim(),
      timestamp: Date.now(),
    }

    const updatedPosts = posts.map((post) => {
      if (post.id === selectedPost.id) {
        return {
          ...post,
          comments: [...post.comments, newComment],
        }
      }
      return post
    })

    savePosts(updatedPosts)
    setCommentText("")
    setCommentModalVisible(false)
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = new Date()
    const postDate = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    } else {
      return postDate.toLocaleDateString()
    }
  }

  // ✅ Preload images on mount (only on iOS/Android)
  useEffect(() => {
    if (Platform.OS !== "web") {
      bars.forEach((bar) => {
        const img = Image.resolveAssetSource(bar.image)
        Image.prefetch(img.uri)
      })
    }

    // Load posts on mount and set up refresh interval
    loadPosts()

    // Refresh posts every 30 seconds
    const interval = setInterval(() => {
      loadPosts()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

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

  // Render comment modal
  const renderCommentModal = () => {
    if (!selectedPost) return null

    return (
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <SafeAreaView style={feedStyles.modalContainer}>
          <View style={feedStyles.modalContent}>
            <View style={feedStyles.modalHeader}>
              <Text style={feedStyles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={feedStyles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedPost.comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={feedStyles.commentItem}>
                  <Text style={feedStyles.commentUsername}>{item.username}</Text>
                  <Text style={feedStyles.commentText}>{item.text}</Text>
                  <Text style={feedStyles.commentTime}>{formatTimestamp(item.timestamp)}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={feedStyles.emptyComments}>
                  <Ionicons name="chatbubble-outline" size={40} color="#555" />
                  <Text style={feedStyles.emptyCommentsText}>No comments yet</Text>
                  <Text style={feedStyles.emptyCommentsSubtext}>Be the first to comment!</Text>
                </View>
              }
              style={feedStyles.commentsList}
            />

            <View style={feedStyles.commentInputContainer}>
              <TextInput
                style={feedStyles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[feedStyles.postCommentButton, !commentText.trim() && feedStyles.disabledButton]}
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Ionicons name="send" size={20} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    )
  }

  // Render post item
  const renderPostItem = (post: Post) => {
    const isLiked = user ? post.likes.includes(user.id) : false

    return (
      <View style={feedStyles.postContainer}>
        {/* Post Header */}
        <View style={feedStyles.postHeader}>
          <View style={feedStyles.postUser}>
            <Image
              source={
                post.userImageUrl ? { uri: post.userImageUrl } : require("../../assets/images/default-profile.png")
              }
              style={feedStyles.userAvatar}
            />
            <View>
              <Text style={feedStyles.username}>{post.username}</Text>
              <Text style={feedStyles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
            </View>
          </View>
          {post.barTag && (
            <View style={feedStyles.barTag}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={feedStyles.barTagText}>{post.barTag}</Text>
            </View>
          )}
        </View>

        {/* Post Image */}
        <Image source={{ uri: post.imageUri }} style={feedStyles.postImage} />

        {/* Post Actions */}
        <View style={feedStyles.postActions}>
          <TouchableOpacity style={feedStyles.actionButton} onPress={() => handleLikePost(post.id)}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "red" : "white"} />
            <Text style={feedStyles.actionText}>
              {post.likes.length > 0 ? post.likes.length : ""}{" "}
              {post.likes.length === 1 ? "Like" : post.likes.length > 1 ? "Likes" : "Like"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={feedStyles.actionButton}
            onPress={() => {
              setSelectedPost(post)
              setCommentModalVisible(true)
            }}
          >
            <Ionicons name="chatbubble-outline" size={22} color="white" />
            <Text style={feedStyles.actionText}>
              {post.comments.length > 0 ? post.comments.length : ""}{" "}
              {post.comments.length === 1 ? "Comment" : post.comments.length > 1 ? "Comments" : "Comment"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={feedStyles.actionButton}
            onPress={() => {
              // Share functionality
              Alert.alert("Share", "Sharing functionality will be implemented here")
            }}
          >
            <Ionicons name="share-outline" size={22} color="white" />
            <Text style={feedStyles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Post Caption */}
        <View style={feedStyles.captionContainer}>
          <Text style={feedStyles.caption}>
            <Text style={feedStyles.captionUsername}>{post.username}</Text> {post.caption}
          </Text>
        </View>

        {/* Comments Preview */}
        {post.comments.length > 0 && (
          <TouchableOpacity
            style={feedStyles.commentsPreview}
            onPress={() => {
              setSelectedPost(post)
              setCommentModalVisible(true)
            }}
          >
            {post.comments.length === 1 ? (
              <View style={feedStyles.singleCommentPreview}>
                <Text style={feedStyles.commentPreviewUsername}>{post.comments[0].username}</Text>
                <Text style={feedStyles.commentPreviewText} numberOfLines={1}>
                  {post.comments[0].text}
                </Text>
              </View>
            ) : (
              <Text style={feedStyles.viewAllComments}>View all {post.comments.length} comments</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // Render bar item
  const renderBarItem = (bar: any, index: number) => {
    const isFavorite = favorites.includes(bar.name)

    return (
      <FlipCard
        key={`${bar.name}-${isFavorite}`}
        style={{
          borderWidth: 2,
          borderColor: "limegreen",
          borderRadius: 12,
          marginBottom: 12,
          height: 120,
          width: "92%",
          alignSelf: "center",
        }}
        friction={6}
        perspective={1000}
        flipHorizontal={true}
        flipVertical={false}
        clickable={true}
      >
        {/* Front Side */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#333",
            borderRadius: 12,
            overflow: "hidden",
            height: "100%",
          }}
        >
          <Image
            source={bar.image}
            style={{
              width: 100,
              height: "100%",
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
            }}
            resizeMode="cover"
          />
          <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>{bar.name}</Text>
            <Text style={{ fontSize: 11 }}>
              <Text style={{ color: "#ccc" }}>Current wait time: </Text>
              <Text style={{ color: getWaitColor(bar.waitTime) }}>{getWaitLabel(bar.waitTime)}</Text>
            </Text>
            <Text style={{ fontSize: 11 }}>
              <Text style={{ color: "#ccc" }}>Current cover charge: </Text>
              <Text style={{ color: getCoverColor(bar.coverCharge) }}>{getCoverLabel(bar.coverCharge)}</Text>
            </Text>
          </View>
        </View>

        {/* Back Side */}
        <View
          style={{
            backgroundColor: "#444",
            borderRadius: 12,
            height: "100%",
            justifyContent: "center",
            paddingHorizontal: 12,
          }}
        >
          <Pressable
            onPress={() => router.push("/report" as any)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              marginBottom: 6,
              alignSelf: "flex-start",
            })}
          >
            <Text style={{ color: "white", fontSize: 13 }}>📢 Add New Report</Text>
          </Pressable>

          <Pressable
            onPress={() => toggleFavorite(bar.name)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              marginBottom: 6,
              alignSelf: "flex-start",
            })}
          >
            <Text style={{ color: "white", fontSize: 13 }}>
              {isFavorite ? "❌ Remove Favorite" : "⭐ Favorite This Bar"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(bar.route as any)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              alignSelf: "flex-start",
            })}
          >
            <Text style={{ color: "white", fontSize: 13 }}>📍 View This Bar</Text>
          </Pressable>
        </View>
      </FlipCard>
    )
  }

  return (
    <View style={authStyles.container}>
      {/* App Logo */}
      <View style={{ alignItems: "center", marginVertical: 16 }}>
        <Image
          source={require("../../assets/images/TailGatorLogo.png")}
          style={{
            width: 80,
            height: 80,
            resizeMode: "contain",
            borderRadius: 40,
          }}
        />
      </View>

      {/* Posts Feed */}
      <View style={feedStyles.postsContainer}>
        {loading ? (
          <View style={feedStyles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={feedStyles.loadingText}>Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={feedStyles.emptyContainer}>
            <Ionicons name="images-outline" size={60} color="#555" />
            <Text style={feedStyles.emptyText}>No posts yet</Text>
            <Text style={feedStyles.emptySubtext}>Be the first to share a post!</Text>
            <TouchableOpacity style={feedStyles.createPostButton} onPress={() => router.push("/(tabs)/create")}>
              <Ionicons name="add" size={20} color="black" />
              <Text style={feedStyles.createPostText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderPostItem(item)}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={loadPosts}
          />
        )}
      </View>

      {/* Comment Modal */}
      {renderCommentModal()}
    </View>
  )
}

const feedStyles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#111",
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: "#999",
    marginLeft: 6,
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  postsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#ccc",
    fontSize: 18,
    marginTop: 10,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    marginTop: 5,
  },
  createPostButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  createPostText: {
    color: "black",
    fontWeight: "600",
    marginLeft: 8,
  },
  postContainer: {
    backgroundColor: "#222",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  username: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  timestamp: {
    color: "#999",
    fontSize: 12,
  },
  barTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  barTagText: {
    color: COLORS.primary,
    fontSize: 12,
    marginLeft: 4,
  },
  postImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  postActions: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    color: "white",
    marginLeft: 6,
    fontSize: 14,
  },
  captionContainer: {
    padding: 12,
  },
  caption: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: "bold",
  },
  commentsPreview: {
    padding: 12,
    paddingTop: 0,
  },
  singleCommentPreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentPreviewUsername: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
    marginRight: 4,
  },
  commentPreviewText: {
    color: "#ccc",
    fontSize: 13,
  },
  viewAllComments: {
    color: "#999",
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#222",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  commentUsername: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  commentText: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "white",
    marginRight: 10,
    maxHeight: 100,
  },
  postCommentButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyComments: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyCommentsText: {
    color: "#ccc",
    fontSize: 16,
    marginTop: 10,
  },
  emptyCommentsSubtext: {
    color: "#999",
    fontSize: 14,
    marginTop: 5,
  },
})
