import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    followers: v.number(),
    following: v.number(),
    posts: v.number(),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  posts: defineTable({
    userId: v.string(), // Changed from v.id("users")
    imageUrl: v.string(),
    storageId: v.string(), // Changed from v.id("_storage")
    caption: v.optional(v.string()),
    barTag: v.optional(v.string()),
    likes: v.number(),
    comments: v.number(),
  }).index("by_user", ["userId"]),

  likes: defineTable({
    postId: v.string(), // Changed from v.id("posts")
    userId: v.string(), // Changed from v.id("users")
  })
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  comments: defineTable({
    postId: v.string(), // Changed from v.id("posts")
    userId: v.string(), // Changed from v.id("users")
    content: v.string(),
  }).index("by_post", ["postId"]),

  follows: defineTable({
    followerId: v.string(), // Changed from v.id("users")
    followingId: v.string(), // Changed from v.id("users")
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_both", ["followerId", "followingId"]),

  notifications: defineTable({
    receiverId: v.string(), // Changed from v.id("users")
    senderId: v.string(), // Changed from v.id("users")
    type: v.union(v.literal("like"), v.literal("comment"), v.literal("follow")),
    postId: v.optional(v.string()), // Changed from v.optional(v.id("posts"))
    commentId: v.optional(v.string()), // Changed from v.optional(v.id("comments"))
  }).index("by_receiver", ["receiverId"]),

  bookmarks: defineTable({
    userId: v.string(), // Changed from v.id("users")
    postId: v.string(), // Changed from v.id("posts")
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  // New table for bars
  bars: defineTable({
    name: v.string(),
    imageUrl: v.string(),
    route: v.string(),
    averageWaitTime: v.number(),
    averageCoverCharge: v.number(),
    reportCount: v.number(),
    lastUpdated: v.number(), // timestamp
  }).index("by_name", ["name"]),

  // New table for bar reports
  barReports: defineTable({
    barId: v.string(), // Changed from v.id("bars")
    userId: v.string(), // Changed from v.id("users")
    waitTime: v.number(),
    coverCharge: v.number(),
    timestamp: v.number(), // timestamp
  })
    .index("by_bar", ["barId"])
    .index("by_user", ["userId"])
    .index("by_bar_and_user", ["barId", "userId"]),
})
