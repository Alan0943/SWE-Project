"use client"

import {
  Image,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native"
import { styles } from "../../styles/auth.styles"
import { useRouter } from "expo-router"
import { useFavorites } from "../../src/contexts/FavoritesContext"
import { useBarData } from "../../src/contexts/BarDataContext"
import { useEffect, useRef, useState, useCallback } from "react"
import { Ionicons } from "@expo/vector-icons"

export default function Index() {
  const router = useRouter()
  const { favorites, toggleFavorite } = useFavorites()
  const { bars, isLoading, refreshBars } = useBarData()
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({})
  const [refreshing, setRefreshing] = useState(false)

  // Device detection for responsive adjustments
  const [isPhone, setIsPhone] = useState(true)
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width)

  useEffect(() => {
    const checkDeviceType = () => {
      const { width } = Dimensions.get("window")
      setIsPhone(width < 768)
      setScreenWidth(width)
    }

    // Initial check
    checkDeviceType()

    // Listen for dimension changes
    const dimensionsSubscription = Dimensions.addEventListener("change", checkDeviceType)

    // Cleanup
    return () => {
      dimensionsSubscription.remove()
    }
  }, [])

  // Animation values for each bar card
  const slideAnimations = useRef<{ [key: string]: Animated.Value }>({})
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Initialize animation values for each bar
  useEffect(() => {
    const animations: { [key: string]: Animated.Value } = {}
    bars.forEach((bar) => {
      animations[bar.name] = new Animated.Value(0) // 0 = not expanded, 1 = expanded
    })
    slideAnimations.current = animations
  }, [bars])

  // Enhanced image preloading
  useEffect(() => {
    // Create a loading state object for each image
    const initialLoadingState: { [key: string]: boolean } = {}
    bars.forEach((bar) => {
      initialLoadingState[bar.name] = false
    })
    setLoadedImages(initialLoadingState)

    // Preload all images before showing content
    const preloadImages = async () => {
      try {
        // Mark all images as loaded to avoid errors
        bars.forEach((bar) => {
          setLoadedImages((prev) => ({ ...prev, [bar.name]: true }))
        })
        setImagesLoaded(true)
      } catch (error) {
        console.error("Error preloading images:", error)
        // If there's an error, still show the content
        setImagesLoaded(true)
      }
    }

    preloadImages()

    // Create a timeout as a fallback in case prefetching takes too long
    const timeoutId = setTimeout(() => {
      if (!imagesLoaded) {
        setImagesLoaded(true)
      }
    }, 2000) // 2 second fallback

    return () => clearTimeout(timeoutId)
  }, [bars])

  const getWaitColor = (minutes: number) => {
    if (minutes <= 10) return "limegreen"
    if (minutes <= 20) return "gold"
    return "red"
  }

  const getCoverColor = (amount: number) => {
    if (amount <= 9) return "limegreen"
    if (amount <= 19) return "gold"
    return "red"
  }

  const getCoverLabel = (amount: number) => {
    if (amount === 0) return "Free Entry 🎉"
    if (amount >= 20) return `${amount} 🚨`
    return `${amount}`
  }

  const getWaitLabel = (minutes: number) => {
    if (minutes <= 10) return "Short Wait ⏱️"
    if (minutes <= 20) return `${minutes} minutes`
    return `${minutes} minutes ⚠️`
  }

  // Toggle card expansion
  const toggleCardExpansion = (barName: string) => {
    // If this card is already expanded, collapse it
    if (expandedCard === barName) {
      Animated.timing(slideAnimations.current[barName], {
        toValue: 0,
        duration: 250, // Faster animation
        useNativeDriver: false,
      }).start(() => {
        setExpandedCard(null)
      })
    }
    // If another card is expanded, collapse it first, then expand this one
    else if (expandedCard) {
      Animated.timing(slideAnimations.current[expandedCard], {
        toValue: 0,
        duration: 250, // Faster animation
        useNativeDriver: false,
      }).start(() => {
        setExpandedCard(barName)
        Animated.timing(slideAnimations.current[barName], {
          toValue: 1,
          duration: 250, // Faster animation
          useNativeDriver: false,
        }).start()
      })
    }
    // If no card is expanded, expand this one
    else {
      setExpandedCard(barName)
      Animated.timing(slideAnimations.current[barName], {
        toValue: 1,
        duration: 250, // Faster animation
        useNativeDriver: false,
      }).start()
    }
  }

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshBars()
    } catch (error) {
      console.error("Error refreshing bars:", error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshBars])

  // Format the last updated time
  const formatLastUpdated = (timestamp: number) => {
    const now = Date.now()
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60))

    if (diffInMinutes < 1) {
      return "Just now"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days}d ago`
    }
  }

  // If images are still loading, show a loading screen
  if (isLoading || !imagesLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "black" }}>
        <Image
          source={require("../../assets/images/TailGatorLogo.png")}
          style={{
            width: 100,
            height: 100,
            resizeMode: "contain",
            marginBottom: 20,
          }}
        />
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={{ color: "white", marginTop: 10 }}>Loading bars...</Text>
      </View>
    )
  }

  // Calculate responsive dimensions
  const cardHeight = 140 // Increased height to match the screenshot
  const leftImageWidth = cardHeight * 0.8 // Make image width slightly less than height for better proportions
  const cardWidth = isPhone ? "94%" : screenWidth > 1200 ? 1200 : screenWidth * 0.98
  const optionButtonHeight = isPhone ? 36 : 40 // Increased button height
  const fontSize = isPhone ? { title: 16, text: 13, small: 10 } : { title: 18, text: 14, small: 11 } // Increased font sizes

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingVertical: 20, alignItems: "center" }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" colors={["#4ADE80"]} />
      }
    >
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Image
          source={require("../../assets/images/TailGatorLogo.png")}
          style={{
            width: 80,
            height: 80,
            resizeMode: "contain",
            borderRadius: 40,
          }}
        />
      </View>

      <View className="w-full max-w-[1200px] space-y-4">
        <View className="space-y-4">
          {bars.map((bar, index) => {
            const isFavorite = favorites.includes(bar.name)
            const isExpanded = expandedCard === bar.name
            const isHotSpot = bar.waitTime <= 10 && bar.coverCharge <= 10

            // Animation for sliding
            const slideAnim = slideAnimations.current[bar.name] || new Animated.Value(0)

            // Animation for the hot spot banner
            const hotSpotLeftPosition = slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -100], // Slide out to the left
            })

            // Animation for options panel position - slide in from right
            const optionsRightPosition = slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["100%", "0%"], // Slide in from right (off-screen to on-screen)
            })

            return (
              <View
                key={`${bar.name}-${isFavorite}`}
                style={{
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              >
                {/* Improved glow effect with multiple layers */}
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    left: -4,
                    right: -4,
                    bottom: -4,
                    borderRadius: 16,
                    backgroundColor: "limegreen",
                    opacity: 0.7,
                    shadowColor: "limegreen",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 5,
                    elevation: 20,
                    zIndex: -1,
                  }}
                />

                <View
                  style={{
                    borderWidth: 0,
                    borderColor: "limegreen",
                    borderRadius: 12,
                    height: cardHeight,
                    width: cardWidth,
                    overflow: "hidden",
                    flexDirection: "row",
                    backgroundColor: "#222",
                  }}
                >
                  {/* Main card content - fixed width */}
                  <View
                    style={{
                      width: "100%",
                      backgroundColor: "#222",
                      borderRadius: 10,
                      overflow: "hidden",
                      height: "100%",
                      position: "relative",
                    }}
                  >
                    <Pressable
                      onPress={() => toggleCardExpansion(bar.name)}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {/* Background image with overlay */}
                      <Image
                        source={bar.image}
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          opacity: 0.4,
                        }}
                        resizeMode="cover"
                        blurRadius={1}
                        defaultSource={bar.image}
                      />

                      {/* Gradient overlay */}
                      <View
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          backgroundColor: "rgba(0,0,0,0.5)",
                          zIndex: 1,
                        }}
                      />

                      {/* Content container - animated as a whole */}
                      <Animated.View
                        style={{
                          flexDirection: "row",
                          height: "100%",
                          zIndex: 2,
                          transform: [
                            {
                              translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -leftImageWidth],
                              }),
                            },
                          ],
                        }}
                      >
                        {/* Left side with clear image */}
                        <View
                          style={{
                            width: leftImageWidth,
                            height: "100%",
                            overflow: "hidden",
                            borderRightWidth: 1,
                            borderRightColor: "rgba(255,255,255,0.1)",
                          }}
                        >
                          <Image
                            source={bar.image}
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                            resizeMode="cover"
                            defaultSource={bar.image}
                          />
                        </View>

                        {/* Right side with info */}
                        <View
                          style={{
                            flex: 1,
                            padding: 12,
                            justifyContent: "space-between", // Changed to space-between for better vertical spacing
                            height: "100%",
                          }}
                        >
                          <View>
                            <Text
                              style={{
                                color: "white",
                                fontSize: fontSize.title,
                                fontWeight: "700",
                                marginBottom: 8,
                                textShadowColor: "rgba(0, 0, 0, 0.75)",
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 2,
                              }}
                              numberOfLines={2}
                            >
                              {bar.name}
                            </Text>

                            {/* Status indicators */}
                            <View style={{ marginTop: 4 }}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginBottom: 6,
                                }}
                              >
                                <Ionicons
                                  name="time-outline"
                                  size={fontSize.text + 2}
                                  color={getWaitColor(bar.waitTime)}
                                />
                                <Text
                                  style={{
                                    fontSize: fontSize.text,
                                    color: "#ccc",
                                    marginLeft: 4,
                                  }}
                                >
                                  Wait:{" "}
                                  <Text style={{ color: getWaitColor(bar.waitTime), fontWeight: "600" }}>
                                    {bar.waitTime === 0
                                      ? "Short Wait ⏱️"
                                      : `${bar.waitTime} minutes${bar.waitTime > 20 ? " ⚠️" : ""}`}
                                  </Text>
                                </Text>
                              </View>

                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Ionicons
                                  name="cash-outline"
                                  size={fontSize.text + 2}
                                  color={getCoverColor(bar.coverCharge)}
                                />
                                <Text
                                  style={{
                                    fontSize: fontSize.text,
                                    color: "#ccc",
                                    marginLeft: 4,
                                  }}
                                >
                                  Cover:{" "}
                                  <Text style={{ color: getCoverColor(bar.coverCharge), fontWeight: "600" }}>
                                    {bar.coverCharge === 0
                                      ? "Free Entry 🎉"
                                      : `$${bar.coverCharge}${bar.coverCharge >= 20 ? " 🚨" : ""}`}
                                  </Text>
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "flex-end",
                              width: "100%",
                            }}
                          >
                            {/* Last updated indicator */}
                            <Text
                              style={{
                                color: "rgba(255,255,255,0.4)",
                                fontSize: fontSize.small,
                                fontStyle: "italic",
                              }}
                            >
                              Updated: {formatLastUpdated(bar.lastUpdated)}
                            </Text>

                            {/* Show appropriate text based on expanded state */}
                            <Text
                              style={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: fontSize.small,
                                fontStyle: "italic",
                              }}
                            >
                              {isExpanded ? " " : "Tap for options "}
                              <Ionicons
                                name={isExpanded ? "chevron-forward" : "chevron-back"}
                                size={fontSize.small}
                                color="rgba(255,255,255,0.6)"
                              />
                            </Text>
                          </View>
                        </View>
                      </Animated.View>

                      {/* HOT SPOT badge with independent animation */}
                      {isHotSpot && (
                        <Animated.View
                          style={{
                            position: "absolute",
                            top: 8,
                            left: hotSpotLeftPosition,
                            backgroundColor: "limegreen",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderTopRightRadius: 8,
                            borderBottomRightRadius: 8,
                            zIndex: 3,
                          }}
                        >
                          <Text style={{ color: "black", fontSize: fontSize.small, fontWeight: "bold" }}>
                            HOT SPOT 🔥
                          </Text>
                        </Animated.View>
                      )}
                    </Pressable>
                  </View>

                  {/* Options panel */}
                  <Animated.View
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "45%", // Fixed width for options panel
                      backgroundColor: "#333",
                      justifyContent: "center",
                      paddingHorizontal: 10,
                      overflow: "hidden",
                      borderTopRightRadius: 10,
                      borderBottomRightRadius: 10,
                      transform: [{ translateX: optionsRightPosition }],
                      // Add pointer events to make this view only interactive when expanded
                      pointerEvents: isExpanded ? "auto" : "none",
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        router.push({
                          pathname: "/report",
                          params: { barName: bar.name },
                        } as any)
                      }}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.5 : 1,
                        marginBottom: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        padding: 6,
                        borderRadius: 8,
                        height: optionButtonHeight,
                      })}
                    >
                      <Ionicons name="megaphone" size={fontSize.text + 4} color="#FF6B6B" style={{ marginRight: 8 }} />
                      <Text style={{ color: "white", fontSize: fontSize.text }}>Add Report</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => toggleFavorite(bar.name)}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.5 : 1,
                        marginBottom: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        padding: 6,
                        borderRadius: 8,
                        height: optionButtonHeight,
                      })}
                    >
                      <Ionicons
                        name={isFavorite ? "star" : "star-outline"}
                        size={fontSize.text + 4}
                        color="#FFD700"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ color: "white", fontSize: fontSize.text }}>
                        {isFavorite ? "Unfavorite" : "Favorite"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        console.log("Navigating to:", bar.route)
                        router.push(bar.route as any)
                      }}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.5 : 1,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        padding: 6,
                        borderRadius: 8,
                        height: optionButtonHeight,
                      })}
                    >
                      <Ionicons name="location" size={fontSize.text + 4} color="#4ADE80" style={{ marginRight: 8 }} />
                      <Text style={{ color: "white", fontSize: fontSize.text }}>Details</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}
