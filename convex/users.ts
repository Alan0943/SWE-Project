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

// Delete user account
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

    // Delete the user
    await ctx.db.delete(user._id)

    // In a real app, you would also:
    // 1. Delete user's posts
    // 2. Delete user's comments
    // 3. Delete user's likes
    // 4. Delete user's follows
    // 5. Delete user's notifications
    // 6. Delete user's bookmarks
    // 7. Delete user's bar reports

    return { success: true }
  },
})
