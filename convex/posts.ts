import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const generatedUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")
  return await ctx.storage.generateUploadUrl()
})

export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id("_storage"),
    barTag: v.optional(v.string()), // Added barTag parameter
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    const imageUrl = await ctx.storage.getUrl(args.storageId)
    if (!imageUrl) throw new Error("image not found")

    // create post
    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id,
      imageUrl,
      caption: args.caption,
      barTag: args.barTag, // Added barTag field
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

// Delete a post
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    console.log("deletePost mutation called with postId:", args.postId)

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      console.log("Unauthorized: No identity found")
      throw new Error("Unauthorized")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) {
      console.log("User not found for clerkId:", identity.subject)
      throw new Error("User not found")
    }

    // Get the post
    const post = await ctx.db.get(args.postId)
    if (!post) {
      console.log("Post not found with ID:", args.postId)
      throw new Error("Post not found")
    }

    // Check if the user is the owner of the post
    if (post.userId.toString() !== currentUser._id.toString()) {
      console.log("Not authorized to delete this post. Post userId:", post.userId, "Current user ID:", currentUser._id)
      throw new Error("Not authorized to delete this post")
    }

    console.log("Deleting likes, comments, and post...")

    // Delete all likes for this post
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()

    for (const like of likes) {
      await ctx.db.delete(like._id)
    }

    // Delete all comments for this post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()

    for (const comment of comments) {
      await ctx.db.delete(comment._id)
    }

    // Delete the post
    await ctx.db.delete(args.postId)

    // Decrement the user's post count
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, currentUser.posts - 1),
    })

    console.log("Post successfully deleted")
    return { success: true }
  },
})

// Get all posts for the feed
export const getAllPosts = query(async (ctx) => {
  const posts = await ctx.db.query("posts").order("desc").collect()

  // Fetch user information for each post
  const postsWithUserInfo = await Promise.all(
    posts.map(async (post) => {
      const user = await ctx.db.get(post.userId)

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
          const commentUser = await ctx.db.get(comment.userId)
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

// Get posts by user ID
export const getPostsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    // Fetch user information for each post
    const postsWithUserInfo = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId)

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
            const commentUser = await ctx.db.get(comment.userId)
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
  },
})

// Toggle like on a post
export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    // Check if user already liked the post
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) => q.eq("userId", currentUser._id).eq("postId", args.postId))
      .first()

    if (existingLike) {
      // Unlike the post
      await ctx.db.delete(existingLike._id)

      // Decrement likes count
      const post = await ctx.db.get(args.postId)
      if (post) {
        await ctx.db.patch(args.postId, { likes: Math.max(0, post.likes - 1) })
      }

      return { liked: false }
    } else {
      // Like the post
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: currentUser._id,
      })

      // Increment likes count
      const post = await ctx.db.get(args.postId)
      if (post) {
        await ctx.db.patch(args.postId, { likes: post.likes + 1 })
      }

      return { liked: true }
    }
  },
})

// Add a comment to a post
export const addComment = mutation({
  args: {
    postId: v.id("posts"),
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

    // Insert the comment
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      userId: currentUser._id,
      content: args.content,
    })

    // Increment comments count
    const post = await ctx.db.get(args.postId)
    if (post) {
      await ctx.db.patch(args.postId, { comments: post.comments + 1 })
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
