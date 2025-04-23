import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get all notifications for the current user
export const getNotifications = query(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")

  // Get current user
  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first()

  if (!currentUser) throw new Error("User not found")

  // Get all notifications for the current user
  const notifications = await ctx.db
    .query("notifications")
    .withIndex("by_receiver", (q) => q.eq("receiverId", currentUser._id))
    .order("desc")
    .collect()

  // Get sender info for each notification
  const notificationsWithInfo = await Promise.all(
    notifications.map(async (notification) => {
      // Get sender info
      const sender = await ctx.db.get(notification.senderId)

      // Skip notifications where the sender is the current user
      if (notification.senderId === currentUser._id) {
        return null
      }

      let postImage = null
      let commentText = null

      // Get post info if notification is about a post
      if (notification.postId) {
        const post = await ctx.db.get(notification.postId)
        if (post) {
          postImage = post.imageUrl
        }
      }

      // Get comment info if notification is about a comment
      if (notification.commentId) {
        const comment = await ctx.db.get(notification.commentId)
        if (comment) {
          commentText = comment.content
        }
      }

      return {
        id: notification._id,
        type: notification.type,
        senderId: notification.senderId,
        senderUsername: sender?.username || "Unknown User",
        senderImage: sender?.image || null,
        postId: notification.postId,
        postImage,
        commentId: notification.commentId,
        commentText,
        timestamp: notification._creationTime,
        read: notification.read ?? false,
      }
    }),
  )

  // Filter out null values (self-interactions) and return
  return notificationsWithInfo.filter(Boolean)
})

// Mark a notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    // Get the notification
    const notification = await ctx.db.get(args.notificationId)

    // Check if notification exists and belongs to the current user
    if (!notification || notification.receiverId !== currentUser._id) {
      throw new Error("Notification not found or unauthorized")
    }

    // Mark as read
    await ctx.db.patch(args.notificationId, { read: true })

    return { success: true }
  },
})

// Create a notification when someone likes a post
export const createLikeNotification = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Get current user (sender)
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    // Get post
    const post = await ctx.db.get(args.postId)
    if (!post) throw new Error("Post not found")

    // Get post owner (receiver)
    const postOwner = await ctx.db.get(post.userId)
    if (!postOwner) throw new Error("Post owner not found")

    // Don't create notification if sender is the same as receiver
    if (currentUser._id === postOwner._id) {
      return null
    }

    // Create notification
    const notificationId = await ctx.db.insert("notifications", {
      receiverId: postOwner._id,
      senderId: currentUser._id,
      type: "like",
      postId: args.postId,
      read: false,
    })

    return notificationId
  },
})

// Create a notification when someone comments on a post
export const createCommentNotification = mutation({
  args: {
    postId: v.id("posts"),
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Get current user (sender)
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    // Get post
    const post = await ctx.db.get(args.postId)
    if (!post) throw new Error("Post not found")

    // Get post owner (receiver)
    const postOwner = await ctx.db.get(post.userId)
    if (!postOwner) throw new Error("Post owner not found")

    // Don't create notification if sender is the same as receiver
    if (currentUser._id === postOwner._id) {
      return null
    }

    // Create notification
    const notificationId = await ctx.db.insert("notifications", {
      receiverId: postOwner._id,
      senderId: currentUser._id,
      type: "comment",
      postId: args.postId,
      commentId: args.commentId,
      read: false,
    })

    return notificationId
  },
})
