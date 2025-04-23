"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { COLORS } from "@/constants/theme"
import { api } from "@/convex/_generated/api"
import { useQuery, useMutation } from "convex/react"
import type { Id } from "@/convex/_generated/dataModel"

// Notification type definition
interface Notification {
  id: Id<"notifications">
  type: "like" | "comment" | "follow"
  senderId: Id<"users">
  senderUsername: string
  senderImage: string | null
  postId?: Id<"posts">
  postImage?: string | null
  commentId?: Id<"comments">
  commentText?: string | null
  timestamp: number
  read: boolean
}

// Type for what comes from the API
type ApiNotification = Notification | null

export default function Notifications() {
  const router = useRouter()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [refreshing, setRefreshing] = useState(false)

  // Fetch notifications from Convex
  const rawNotifications = useQuery(api.notifications.getNotifications) as ApiNotification[] | undefined
  const loading = rawNotifications === undefined

  // Safely handle the notifications data
  const notifications = (rawNotifications || []).filter((n): n is Notification => n !== null)

  // Mark notification as read mutation
  const markAsReadMutation = useMutation(api.notifications.markAsRead)

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true)
    // Wait for a short time to simulate refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = new Date()
    const notificationDate = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    } else {
      return notificationDate.toLocaleDateString()
    }
  }

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    // Mark notification as read
    if (!notification.read) {
      try {
        await markAsReadMutation({ notificationId: notification.id })
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }

    // Navigate based on notification type
    if (notification.type === "like" || notification.type === "comment") {
      // Navigate to the post
      if (notification.postId) {
        // You would need to implement a post detail page and navigation
        // router.push(`/post/${notification.postId}`);
        console.log("Navigate to post:", notification.postId)
      }
    } else if (notification.type === "follow") {
      // Navigate to the user's profile
      if (notification.senderId) {
        // You would need to implement a user profile page and navigation
        // router.push(`/profile/${notification.senderId}`);
        console.log("Navigate to profile:", notification.senderId)
      }
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Ionicons name="heart" size={20} color="red" />
      case "comment":
        return <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
      case "follow":
        return <Ionicons name="person-add" size={20} color="#3498db" />
      default:
        return <Ionicons name="notifications" size={20} color={COLORS.primary} />
    }
  }

  // Get notification text based on type
  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return "liked your post"
      case "comment":
        return `commented: "${notification.commentText?.substring(0, 30)}${
          notification.commentText && notification.commentText.length > 30 ? "..." : ""
        }"`
      case "follow":
        return "started following you"
      default:
        return "interacted with your content"
    }
  }

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>{getNotificationIcon(item.type)}</View>

        <View style={styles.userContainer}>
          <Image
            source={item.senderImage ? { uri: item.senderImage } : require("../../assets/images/default-profile.png")}
            style={styles.userAvatar}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{item.senderUsername}</Text> {getNotificationText(item)}
          </Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>

        {item.postImage && <Image source={{ uri: item.postImage }} style={styles.postThumbnail} />}
      </View>

      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  )

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={60} color="#555" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>When someone likes or comments on your posts, you'll see them here</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationItem}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && { flex: 1, justifyContent: "center" },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  unreadNotification: {
    backgroundColor: "rgba(74, 222, 128, 0.05)",
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: "center",
  },
  userContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  username: {
    fontWeight: "bold",
  },
  timestamp: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  postThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginLeft: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
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
    textAlign: "center",
  },
})
