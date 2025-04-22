import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

// Initialize bars in the database (run this once)
export const initializeBars = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Check if bars already exist
    const existingBars = await ctx.db.query("bars").collect()
    if (existingBars.length > 0) {
      return { message: "Bars already initialized" }
    }

    // Initial bar data
    const barsData = [
      {
        name: "MacDinton's Irish Pub",
        imageUrl: "/macdintons.jpg", // Update with actual path
        route: "/(bars)/MacDintons",
        averageWaitTime: 21,
        averageCoverCharge: 10,
        reportCount: 1,
        lastUpdated: Date.now(),
      },
      {
        name: "JJ's Tavern",
        imageUrl: "/jjs.jpg", // Update with actual path
        route: "/(bars)/JJsTavern",
        averageWaitTime: 11,
        averageCoverCharge: 10,
        reportCount: 1,
        lastUpdated: Date.now(),
      },
      {
        name: "Vivid Music Hall",
        imageUrl: "/vivid.jpg", // Update with actual path
        route: "/(bars)/VividMusicHall",
        averageWaitTime: 0,
        averageCoverCharge: 0,
        reportCount: 1,
        lastUpdated: Date.now(),
      },
      {
        name: "DTF",
        imageUrl: "/dtf.jpg", // Update with actual path
        route: "/(bars)/DTF",
        averageWaitTime: 15,
        averageCoverCharge: 20,
        reportCount: 1,
        lastUpdated: Date.now(),
      },
      {
        name: "Cantina",
        imageUrl: "/Cantina.jpg", // Update with actual path
        route: "/(bars)/Cantina",
        averageWaitTime: 35,
        averageCoverCharge: 20,
        reportCount: 1,
        lastUpdated: Date.now(),
      },
      {
        name: "Lil Rudy's",
        imageUrl: "/LilRudys.jpg", // Update with actual path
        route: "/(bars)/LilRudys",
        averageWaitTime: 0,
        averageCoverCharge: 5,
        reportCount: 1,
        lastUpdated: Date.now(),
      },
      {
        name: "Range",
        imageUrl: "/range.jpg", // Update with actual path
        route: "/(bars)/Range",
        averageWaitTime: 20,
        averageCoverCharge: 10,
        reportCount: 1,
        lastUpdated: Date.now(),
      },
    ]

    // Insert all bars
    for (const bar of barsData) {
      await ctx.db.insert("bars", bar)
    }

    return { message: "Bars initialized successfully" }
  },
})

// Get all bars
export const getAllBars = query({
  args: {},
  handler: async (ctx) => {
    const bars = await ctx.db.query("bars").collect()
    return bars.map((bar) => ({
      id: bar._id,
      name: bar.name,
      imageUrl: bar.imageUrl,
      route: bar.route,
      waitTime: bar.averageWaitTime,
      coverCharge: bar.averageCoverCharge,
      reportCount: bar.reportCount,
      lastUpdated: bar.lastUpdated,
    }))
  },
})

// Submit a report for a bar
export const submitBarReport = mutation({
  args: {
    barId: v.string(),
    waitTime: v.number(),
    coverCharge: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Get the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) throw new Error("User not found")

    // Get the bar - we need to convert string to Id<"bars">
    const barId = args.barId as unknown as Id<"bars">
    const bar = await ctx.db.get(barId)
    if (!bar) throw new Error("Bar not found")

    // Check if user already reported this bar recently (within the last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const recentReport = await ctx.db
      .query("barReports")
      .withIndex("by_bar_and_user", (q) => q.eq("barId", args.barId).eq("userId", currentUser._id))
      .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
      .first()

    // If there's a recent report, update it instead of creating a new one
    if (recentReport) {
      await ctx.db.patch(recentReport._id, {
        waitTime: args.waitTime,
        coverCharge: args.coverCharge,
        timestamp: Date.now(),
      })
    } else {
      // Create a new report
      await ctx.db.insert("barReports", {
        barId: args.barId,
        userId: currentUser._id,
        waitTime: args.waitTime,
        coverCharge: args.coverCharge,
        timestamp: Date.now(),
      })
    }

    // Calculate new averages
    // Get all reports for this bar from the last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const recentReports = await ctx.db
      .query("barReports")
      .withIndex("by_bar", (q) => q.eq("barId", args.barId))
      .filter((q) => q.gt(q.field("timestamp"), oneDayAgo))
      .collect()

    // Calculate new averages
    let totalWaitTime = 0
    let totalCoverCharge = 0
    const reportCount = recentReports.length

    for (const report of recentReports) {
      totalWaitTime += report.waitTime
      totalCoverCharge += report.coverCharge
    }

    const newAverageWaitTime = reportCount > 0 ? Math.round(totalWaitTime / reportCount) : 0
    const newAverageCoverCharge = reportCount > 0 ? Math.round(totalCoverCharge / reportCount) : 0

    // Update the bar with new averages
    await ctx.db.patch(barId, {
      averageWaitTime: newAverageWaitTime,
      averageCoverCharge: newAverageCoverCharge,
      reportCount: reportCount,
      lastUpdated: Date.now(),
    })

    return {
      success: true,
      bar: {
        id: bar._id,
        name: bar.name,
        waitTime: newAverageWaitTime,
        coverCharge: newAverageCoverCharge,
        reportCount: reportCount,
      },
    }
  },
})

// Get a specific bar by ID
export const getBarById = query({
  args: { barId: v.string() },
  handler: async (ctx, args) => {
    // Convert string to Id<"bars">
    const barId = args.barId as unknown as Id<"bars">
    const bar = await ctx.db.get(barId)
    if (!bar) throw new Error("Bar not found")

    return {
      id: bar._id,
      name: bar.name,
      imageUrl: bar.imageUrl,
      route: bar.route,
      waitTime: bar.averageWaitTime,
      coverCharge: bar.averageCoverCharge,
      reportCount: bar.reportCount,
      lastUpdated: bar.lastUpdated,
    }
  },
})

// Get a specific bar by name
export const getBarByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const bar = await ctx.db
      .query("bars")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first()

    if (!bar) throw new Error("Bar not found")

    return {
      id: bar._id,
      name: bar.name,
      imageUrl: bar.imageUrl,
      route: bar.route,
      waitTime: bar.averageWaitTime,
      coverCharge: bar.averageCoverCharge,
      reportCount: bar.reportCount,
      lastUpdated: bar.lastUpdated,
    }
  },
})