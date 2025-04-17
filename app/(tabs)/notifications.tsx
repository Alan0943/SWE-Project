"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { useUser } from "@clerk/clerk-expo"
import { COLORS } from "@/constants/theme"

const { width } = Dimensions.get("window")

// Notification types
enum NotificationType {
  LIKE = "like",
  COMMENT = "comment",
  FRIEND_REQUEST = "friend_request",
  FRIEND_ACCEPTED = "friend_accepted",
}

// Notification interface
interface Notification {
  id: string
  type: NotificationType
  userId: string
  username: string
  userImage: string | null
  timestamp: number
  read: boolean
  postId?: string
  postImage?: string
  commentText?: string
}

export default function Notifications() {
  const router = useRouter()
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Load notifications from AsyncStorage
  const loadNotifications = useCallback(async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem("notifications")
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications)
        // Sort by timestamp (newest first)
        parsedNotifications.sort((a: Notification, b: Notification) => b.timestamp - a.timestamp)
        setNotifications(parsedNotifications)
      } else {
        // If no notifications exist yet, create mock data for demo
        const mockNotifications = generateMockNotifications()
        await AsyncStorage.setItem("notifications", JSON.stringify(mockNotifications))
        setNotifications(mockNotifications)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate mock notifications for demo purposes
  const generateMockNotifications = (): Notification[] => {
    const now = Date.now()
    return [
      {
        id: "1",
        type: NotificationType.LIKE,
        userId: "user1",
        username: "alexj",
        userImage: null,
        timestamp: now - 1000 * 60 * 5, // 5 minutes ago
        read: false,
        postId: "post1",
        postImage: "https://picsum.photos/200",
      },
      {
        id: "2",
        type: NotificationType.COMMENT,
        userId: "user2",
        username: "samw",
        userImage: null,
        timestamp: now - 1000 * 60 * 30, // 30 minutes ago
        read: false,
        postId: "post1",
        postImage: "https://picsum.photos/200",
        commentText: "Great photo! Where was this taken?",
      },
      {
        id: "3",
        type: NotificationType.FRIEND_REQUEST,
        userId: "user3",
        username: "taylors",
        userImage: null,
        timestamp: now - 1000 * 60 * 60 * 2, // 2 hours ago
        read: true,
      },
      {
        id: "4",
        type: NotificationType.LIKE,
        userId: "user4",
        username: "johndoe",
        userImage: null,
        timestamp: now - 1000 * 60 * 60 * 5, // 5 hours ago
        read: true,
        postId: "post2",
        postImage: "https://picsum.photos/201",
      },
      {
        id: "5",
        type: NotificationType.FRIEND_ACCEPTED,
        userId: "user5",
        username: "janesmith",
        userImage: null,
        timestamp: now - 1000 * 60 * 60 * 24, // 1 day ago
        read: true,
      },
      {
        id: "6",
        type: NotificationType.COMMENT,
        userId: "user6",
        username: "mikej",
        userImage: null,
        timestamp: now - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        read: true,
        postId: "post3",
        postImage: "https://picsum.photos/202",
        commentText: "This bar looks amazing! We should go there next weekend.",
      },
    ]
  }

  // Load notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
      setNotifications(updatedNotifications)
      await AsyncStorage.setItem("notifications", JSON.stringify(updatedNotifications))
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  // Mark a single notification as read
  const markAsRead = async (id: string) => {
    try {
      const updatedNotifications = notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      )
      setNotifications(updatedNotifications)
      await AsyncStorage.setItem("notifications", JSON.stringify(updatedNotifications))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Handle notification press
  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id)

    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.LIKE:
      case NotificationType.COMMENT:
        if (notification.postId) {
          // Navigate to post detail
          // In a real app, you would navigate to the specific post
          router.push("/(tabs)/profile")
        }
        break
      case NotificationType.FRIEND_REQUEST:
      case NotificationType.FRIEND_ACCEPTED:
        // Navigate to the user's profile
        // In a real app, you would navigate to the specific user profile
        router.push(`/(tabs)/profile`)
        break
    }
  }

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadNotifications()
    setRefreshing(false)
  }, [loadNotifications])

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diffInSeconds = Math.floor((now - timestamp) / 1000)

    if (diffInSeconds < 60) {
      return "just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LIKE:
        return <Ionicons name="heart" size={20} color="#FF3B30" />
      case NotificationType.COMMENT:
        return <Ionicons name="chatbubble" size={20} color="#007AFF" />
      case NotificationType.FRIEND_REQUEST:
        return <Ionicons name="person-add" size={20} color={COLORS.primary} />
      case NotificationType.FRIEND_ACCEPTED:
        return <Ionicons name="people" size={20} color={COLORS.primary} />
      default:
        return <Ionicons name="notifications" size={20} color="white" />
    }
  }

  // Get notification text based on type
  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.LIKE:
        return (
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{notification.username}</Text> liked your post
          </Text>
        )
      case NotificationType.COMMENT:
        return (
          <View>
            <Text style={styles.notificationText}>
              <Text style={styles.username}>{notification.username}</Text> commented on your post
            </Text>
            {notification.commentText && (
              <Text style={styles.commentText} numberOfLines={1}>
                "{notification.commentText}"
              </Text>
            )}
          </View>
        )
      case NotificationType.FRIEND_REQUEST:
        return (
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{notification.username}</Text> sent you a friend request
          </Text>
        )
      case NotificationType.FRIEND_ACCEPTED:
        return (
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{notification.username}</Text> accepted your friend request
          </Text>
        )
      default:
        return <Text style={styles.notificationText}>New notification</Text>
    }
  }

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        {/* User Image */}
        <Image
          source={item.userImage ? { uri: item.userImage } : require("../../assets/images/default-profile.png")}
          style={styles.userImage}
        />

        {/* Notification Icon */}
        <View style={styles.iconContainer}>{getNotificationIcon(item.type)}</View>

        {/* Notification Text */}
        <View style={styles.textContainer}>
          {getNotificationText(item)}
          <Text style={styles.timestamp}>{formatRelativeTime(item.timestamp)}</Text>
        </View>

        {/* Post Image (if applicable) */}
        {(item.type === NotificationType.LIKE || item.type === NotificationType.COMMENT) && item.postImage && (
          <Image source={{ uri: item.postImage }} style={styles.postImage} />
        )}
      </View>
    </TouchableOpacity>
  )

  // Count unread notifications
  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#666" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          key="notifications-list"
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        />
      )}
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
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  notificationsList: {
    paddingVertical: 8,
  },
  notificationItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  unreadNotification: {
    backgroundColor: "rgba(74, 222, 128, 0.05)",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  iconContainer: {
    position: "absolute",
    bottom: -2,
    left: 30,
    backgroundColor: "#222",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  notificationText: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  username: {
    fontWeight: "bold",
    color: "white",
  },
  commentText: {
    color: "#999",
    fontSize: 13,
    marginTop: 4,
    fontStyle: "italic",
  },
  timestamp: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  postImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
})
