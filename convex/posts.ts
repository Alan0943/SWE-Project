import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const generatedUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")
  return await ctx.storage.generateUploadUrl()
})

export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.string(),
    barTag: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    // Convert string to Id<"_storage">
    const storageId = args.storageId as unknown as Id<"_storage">
    const imageUrl = await ctx.storage.getUrl(storageId)
    if (!imageUrl) throw new Error("image not found")

    // create post
    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id,
      imageUrl,
      caption: args.caption,
      barTag: args.barTag,
      likes: 0,
      comments: 0,
      storageId: args.storageId,
    })

    // increment the number of posts of the user
    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    })

    return postId
  },
})

// Get all posts for the feed
export const getAllPosts = query(async (ctx) => {
  const posts = await ctx.db.query("posts").order("desc").collect()

  // Fetch user information for each post
  const postsWithUserInfo = await Promise.all(
    posts.map(async (post) => {
      // Convert string to Id<"users">
      const userId = post.userId as unknown as Id<"users">
      const user = await ctx.db.get(userId)

      // Get likes for this post
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()

      // Get comments for this post
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()

      // Get user info for each comment
      const commentsWithUserInfo = await Promise.all(
        comments.map(async (comment) => {
          // Convert string to Id<"users">
          const commentUserId = comment.userId as unknown as Id<"users">
          const commentUser = await ctx.db.get(commentUserId)
          return {
            ...comment,
            username: commentUser?.username || "Unknown User",
          }
        }),
      )

      return {
        id: post._id,
        imageUri: post.imageUrl,
        caption: post.caption || "",
        username: user?.username || "Unknown User",
        userImageUrl: user?.image || null,
        timestamp: post._creationTime,
        likes: likes.map((like) => like.userId),
        comments: commentsWithUserInfo.map((comment) => ({
          id: comment._id,
          userId: comment.userId,
          username: comment.username,
          text: comment.content,
          timestamp: comment._creationTime,
        })),
        barTag: post.barTag || null,
      }
    }),
  )

  return postsWithUserInfo
})

// Toggle like on a post
export const toggleLike = mutation({
  args: {
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    // Convert string to Id<"posts">
    const postId = args.postId as unknown as Id<"posts">

    // Check if user already liked the post
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) => q.eq("userId", currentUser._id).eq("postId", args.postId))
      .first()

    if (existingLike) {
      // Unlike the post
      await ctx.db.delete(existingLike._id)

      // Decrement likes count
      const post = await ctx.db.get(postId)
      if (post) {
        await ctx.db.patch(postId, { likes: Math.max(0, post.likes - 1) })
      }

      return { liked: false }
    } else {
      // Like the post
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: currentUser._id,
      })

      // Increment likes count
      const post = await ctx.db.get(postId)
      if (post) {
        await ctx.db.patch(postId, { likes: post.likes + 1 })
      }

      return { liked: true }
    }
  },
})

// Add a comment to a post
export const addComment = mutation({
  args: {
    postId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    // Convert string to Id<"posts">
    const postId = args.postId as unknown as Id<"posts">

    // Insert the comment
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      userId: currentUser._id,
      content: args.content,
    })

    // Increment comments count
    const post = await ctx.db.get(postId)
    if (post) {
      await ctx.db.patch(postId, { comments: post.comments + 1 })
    }

    return {
      id: commentId,
      userId: currentUser._id,
      username: currentUser.username,
      text: args.content,
      timestamp: Date.now(),
    }
  },
})