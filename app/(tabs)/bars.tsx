"use client"

import { Image, Text, View, ScrollView, Pressable, ActivityIndicator, Animated, Dimensions } from "react-native"
import { styles } from "../../styles/auth.styles"
import { useRouter } from "expo-router"
import { useFavorites } from "../../src/contexts/FavoritesContext"
import { useEffect, useRef, useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"

// Define a consistent bar type
type Bar = {
  id?: string
  name: string
  waitTime: number
  coverCharge: number
  image: any
  route: string
}

export default function Index() {
  const router = useRouter()
  const { favorites, toggleFavorite } = useFavorites()
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({})

  // Device detection for responsive adjustments
  const [isPhone, setIsPhone] = useState(true)
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width)

  // Try to fetch bars from Convex, but use hardcoded data as fallback
  const dbBars = useQuery(api.bars.getAllBars)
  const initializeBars = useMutation(api.bars.initializeBars)

  // Original hardcoded bar data as fallback
  const hardcodedBars: Bar[] = [
    {
      name: "MacDinton's Irish Pub",
      waitTime: 21,
      coverCharge: 10,
      image: require("../../assets/images/macdintons.jpg"),
      route: "/(bars)/MacDintons",
    },
    {
      name: "JJ's Tavern",
      waitTime: 11,
      coverCharge: 10,
      image: require("../../assets/images/jjs.jpg"),
      route: "/(tabs)/JJsTavern",
    },
    {
      name: "Vivid Music Hall",
      waitTime: 0,
      coverCharge: 0,
      image: require("../../assets/images/vivid.jpg"),
      route: "/(bars)/VividMusicHall",
    },
    {
      name: "DTF",
      waitTime: 15,
      coverCharge: 20,
      image: require("../../assets/images/dtf.jpg"),
      route: "/(bars)/DTF",
    },
    {
      name: "Cantina",
      waitTime: 35,
      coverCharge: 20,
      image: require("../../assets/images/Cantina.jpg"),
      route: "/(bars)/Cantina",
    },
    {
      name: "Lil Rudy's",
      waitTime: 0,
      coverCharge: 5,
      image: require("../../assets/images/LilRudys.jpg"),
      route: "/(bars)/LilRudys",
    },
    {
      name: "Range",
      waitTime: 20,
      coverCharge: 10,
      image: require("../../assets/images/range.jpg"),
      route: "/(bars)/Range",
    },
  ]

  // Combine database bars with hardcoded bars
  const bars: Bar[] =
    dbBars && dbBars.length > 0
      ? dbBars.map((dbBar) => {
          // Find matching hardcoded bar for image and route
          const hardcodedBar = hardcodedBars.find((hb) => hb.name === dbBar.name) || hardcodedBars[0]
          return {
            id: dbBar.id,
            name: dbBar.name,
            waitTime: dbBar.waitTime,
            coverCharge: dbBar.coverCharge,
            image: hardcodedBar.image,
            route: hardcodedBar.route,
          }
        })
      : hardcodedBars

  // Try to initialize bars if they don't exist yet
  useEffect(() => {
    if (dbBars !== undefined && dbBars.length === 0) {
      // No bars in database, try to initialize them
      initializeBars({}).catch((err) => {
        console.error("Failed to initialize bars:", err)
      })
    }
  }, [dbBars, initializeBars])

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
        // Create an array of promises for each image prefetch
        const prefetchPromises = bars.map((bar) => {
          const img = Image.resolveAssetSource(bar.image)
          return Image.prefetch(img.uri).then(() => {
            // Mark this specific image as loaded
            setLoadedImages((prev) => ({ ...prev, [bar.name]: true }))
            return true
          })
        })

        // Wait for all images to be prefetched
        await Promise.all(prefetchPromises)
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
  }, [])

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

  // If images are still loading, show a loading screen
  if (!imagesLoaded) {
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
  const cardHeight = 125 // Fixed height as requested
  const leftImageWidth = cardHeight // Make image width equal to height for square aspect ratio
  const cardWidth = isPhone ? "94%" : "92%"
  const optionButtonHeight = isPhone ? 32 : 36
  const fontSize = isPhone ? { title: 14, text: 11, small: 9 } : { title: 16, text: 12, small: 10 }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: 20 }}>
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

      <View className="px-4">
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

            // Animation for options panel opacity
            const optionsOpacity = slideAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
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
                            justifyContent: "center",
                          }}
                        >
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
                                    : `${bar.coverCharge}${bar.coverCharge >= 20 ? " 🚨" : ""}`}
                                </Text>
                              </Text>
                            </View>
                          </View>

                          {/* Tap indicator */}
                          <View
                            style={{
                              alignItems: "flex-end",
                              position: "absolute",
                              bottom: 8,
                              right: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: fontSize.small,
                                fontStyle: "italic",
                              }}
                            >
                              {isExpanded ? "Tap to close >      " : "Tap for options"}{" "}
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
                      opacity: optionsOpacity,
                      overflow: "hidden",
                      borderTopRightRadius: 10,
                      borderBottomRightRadius: 10,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        // Pass both bar ID and name to the report page
                        const params: any = { barName: bar.name }
                        if (bar.id) {
                          params.barId = bar.id
                        }
                        router.push({
                          pathname: "/report",
                          params,
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
