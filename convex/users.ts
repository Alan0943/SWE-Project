import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const createUser = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    clerkId: v.string(),
  },

  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (existingUser) return

    await ctx.db.insert("users", {
      username: args.username,
      fullname: args.fullname,
      email: args.email,
      bio: args.bio,
      image: args.image,
      followers: 0,
      following: 0,
      posts: 0,
      clerkId: args.clerkId,
    })
  },
})

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()

    return user
  },
})

// Update user's username
export const updateUsername = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (!user) throw new Error("User not found")

    // Ensure the user is updating their own profile
    if (identity.subject !== args.clerkId) throw new Error("Cannot update another user's profile")

    await ctx.db.patch(user._id, {
      username: args.username,
    })

    return { success: true }
  },
})

// Update user's full name
export const updateFullname = mutation({
  args: {
    clerkId: v.string(),
    fullname: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (!user) throw new Error("User not found")

    // Ensure the user is updating their own profile
    if (identity.subject !== args.clerkId) throw new Error("Cannot update another user's profile")

    await ctx.db.patch(user._id, {
      fullname: args.fullname,
    })

    return { success: true }
  },
})

// Update user's profile image
export const updateProfileImage = mutation({
  args: {
    clerkId: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (!user) throw new Error("User not found")

    // Ensure the user is updating their own profile
    if (identity.subject !== args.clerkId) throw new Error("Cannot update another user's profile")

    await ctx.db.patch(user._id, {
      image: args.imageUrl,
    })

    return { success: true }
  },
})

// Delete user account and all associated data
export const deleteUserAccount = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Ensure the user is deleting their own account
    if (identity.subject !== args.clerkId) throw new Error("Cannot delete another user's account")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (!user) throw new Error("User not found")

    // Get all user's posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    // Delete all user's posts and related data
    for (const post of posts) {
      // Delete likes for this post
      const postLikes = await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()

      for (const like of postLikes) {
        await ctx.db.delete(like._id)
      }

      // Delete comments for this post
      const postComments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()

      for (const comment of postComments) {
        await ctx.db.delete(comment._id)
      }

      // Delete bookmarks for this post
      const postBookmarks = await ctx.db
        .query("bookmarks")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()

      for (const bookmark of postBookmarks) {
        await ctx.db.delete(bookmark._id)
      }

      // Delete notifications related to this post
      const postNotifications = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("postId"), post._id))
        .collect()

      for (const notification of postNotifications) {
        await ctx.db.delete(notification._id)
      }

      // Finally delete the post itself
      await ctx.db.delete(post._id)
    }

    // Delete user's likes
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) => q.eq("userId", user._id))
      .collect()

    for (const like of userLikes) {
      await ctx.db.delete(like._id)
    }

    // Delete user's comments
    const userComments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect()

    for (const comment of userComments) {
      await ctx.db.delete(comment._id)
    }

    // Delete user's follows (both as follower and following)
    const userFollows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()

    for (const follow of userFollows) {
      await ctx.db.delete(follow._id)
    }

    const userFollowing = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect()

    for (const follow of userFollowing) {
      await ctx.db.delete(follow._id)
    }

    // Delete user's notifications (both sent and received)
    const receivedNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
      .collect()

    for (const notification of receivedNotifications) {
      await ctx.db.delete(notification._id)
    }

    const sentNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("senderId"), user._id))
      .collect()

    for (const notification of sentNotifications) {
      await ctx.db.delete(notification._id)
    }

    // Delete user's bookmarks
    const userBookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const bookmark of userBookmarks) {
      await ctx.db.delete(bookmark._id)
    }

    // Delete user's bar reports
    const userBarReports = await ctx.db
      .query("barReports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const report of userBarReports) {
      await ctx.db.delete(report._id)
    }

    // Finally, delete the user
    await ctx.db.delete(user._id)

    return { success: true }
  },
})

// Fix the getUserPosts query to properly handle optional userId
export const getUserPosts = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // Return empty array if userId is not provided
    if (!args.userId) return []

    // Now we know userId is defined, so we can safely use it
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => args.userId ? q.eq("userId", args.userId) : q)
      .collect()

    return posts.map((post) => ({
      id: post._id,
      imageUrl: post.imageUrl,
      caption: post.caption || "",
      barTag: post.barTag || null,
      likes: post.likes,
      comments: post.comments,
    }))
  },
})
