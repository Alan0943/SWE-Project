"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  FlatList,
  SafeAreaView,
  Dimensions,
  TextInput,
  Modal,
  TouchableOpacity,
} from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"
import AsyncStorage from "@react-native-async-storage/async-storage"

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

// Friend type definition
type Friend = {
  id: string
  name: string
  username: string
  image: any
  favorites: string[]
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

export default function Profile() {
  const { user } = useUser()
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
        // This is a new friend, add them
        // For now, we'll create a placeholder friend object
        updatedFriends.push({
          id: friendId,
          name: `Friend ${friendId}`,
          username: `user${friendId}`,
          image: require("../../assets/images/default-profile.png"),
          favorites: [],
        })
      }
    })

    setFriends(updatedFriends)
    console.log("Updated friends list:", updatedFriends)
  }, [addedFriends])

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

  // Render post grid item
  const renderPostGridItem = ({ item }: { item: Post }) => (
    <Pressable style={styles.postGridItem} onPress={() => viewPostDetails(item)}>
      <Image source={{ uri: item.imageUri }} style={styles.postGridImage} />
      <View style={styles.postGridOverlay}>
        <View style={styles.postGridStats}>
          <View style={styles.postGridStat}>
            <Ionicons name="heart" size={14} color="white" />
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={user?.imageUrl ? { uri: user.imageUrl } : require("../../assets/images/default-profile.png")}
            style={styles.profileImage}
          />

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
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>
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
            <Ionicons name="heart-outline" size={24} color={activeTab === "favorites" ? COLORS.primary : "white"} />
          </Pressable>
        </View>

        {/* Content based on active tab */}
        {activeTab === "posts" && (
          <View style={styles.postsContainer}>
            {posts.length === 0 ? (
              <Text style={styles.emptyStateText}>No posts yet</Text>
            ) : (
              <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={renderPostGridItem}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.postGrid}
              />
            )}
          </View>
        )}

        {activeTab === "friends" && (
          <View style={styles.friendsContainer}>
            {friends.length === 0 ? (
              <Text style={styles.emptyStateText}>No friends yet</Text>
            ) : (
              <FlatList
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
              />
            )}
          </View>
        )}

        {activeTab === "favorites" && (
          <View style={styles.favoritesContainer}>
            <Text style={styles.emptyStateText}>No favorite bars yet</Text>
          </View>
        )}
      </ScrollView>

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
                      <View key={index} style={styles.favoriteBarItem}>
                        <Ionicons name="beer" size={16} color={COLORS.primary} />
                        <Text style={styles.favoriteBarName}>{bar}</Text>
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
              <TouchableOpacity onPress={() => setShowPostDetail(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
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
                        name={selectedPost.likes.includes(user?.id || "anonymous") ? "heart" : "heart-outline"}
                        size={24}
                        color={selectedPost.likes.includes(user?.id || "anonymous") ? "#FF3B30" : "white"}
                      />
                      <Text style={styles.postActionText}>{selectedPost.likes.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postAction}>
                      <Ionicons name="chatbubble-outline" size={22} color="white" />
                      <Text style={styles.postActionText}>{selectedPost.comments.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postAction}>
                      <Ionicons name="share-social-outline" size={24} color="white" />
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
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
    minHeight: 200,
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
  favoritesContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
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
  favoriteBarItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  favoriteBarName: {
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
})
