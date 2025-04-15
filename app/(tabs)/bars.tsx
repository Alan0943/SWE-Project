"use client"

import { Image, Text, View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { styles } from "../../styles/auth.styles"
import { useRouter } from "expo-router"
import FlipCard from "react-native-flip-card"
import { useFavorites } from "../../src/contexts/FavoritesContext"
import { useEffect, useRef, useState } from "react"
import { Ionicons } from "@expo/vector-icons"

export default function Index() {
  const router = useRouter()
  const { favorites, toggleFavorite } = useFavorites()
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({})

  // Create refs to store flip card references
  const flipCardRefs = useRef<{ [key: string]: any }>({})

  // ✅ Bar data
  const bars = [
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
      route: "/(bars)/JJsTavern",
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
    return `$${amount}`
  }

  const getWaitLabel = (minutes: number) => {
    if (minutes <= 10) return "Short Wait ⏱️"
    if (minutes <= 20) return `${minutes} minutes`
    return `${minutes} minutes ⚠️`
  }

  // Modified toggleFavorite to prevent card flipping
  const handleToggleFavorite = (event: any, barName: string) => {
    // Stop event propagation to prevent the card from flipping
    event.stopPropagation()
    toggleFavorite(barName)
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

            return (
              <FlipCard
                key={`${bar.name}-${isFavorite}`}
                ref={(ref) => (flipCardRefs.current[bar.name] = ref)}
                style={{
                  borderWidth: 2,
                  borderColor: "blue",
                  borderRadius: 12,
                  marginBottom: 12,
                  height: 300,
                  width: "92%",
                  alignSelf: "center",
                }}
                friction={6}
                perspective={1000}
                flipHorizontal={true}
                flipVertical={false}
                clickable={true}
              >
                {/* Front Side */}
                <View
                  style={{
                    backgroundColor: "#222",
                    borderRadius: 12,
                    overflow: "hidden",
                    height: "100%",
                    position: "relative",
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
                    // Add this to ensure image is loaded before rendering
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

                  <View
                    style={{
                      flexDirection: "row",
                      height: "100%",
                      zIndex: 2,
                      position: "relative",
                    }}
                  >
                    {/* Left side with clear image */}
                    <View
                      style={{
                        width: 110,
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
                        // Add this to ensure image is loaded before rendering
                        defaultSource={bar.image}
                      />

                      {/* Status badge */}
                      {bar.waitTime <= 10 && bar.coverCharge <= 10 && (
                        <View
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 0,
                            backgroundColor: "limegreen",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderTopRightRadius: 8,
                            borderBottomRightRadius: 8,
                          }}
                        >
                          <Text style={{ color: "black", fontSize: 10, fontWeight: "bold" }}>HOT SPOT 🔥</Text>
                        </View>
                      )}
                    </View>

                    {/* Right side with info */}
                    <View
                      style={{
                        flex: 1,
                        padding: 12,
                        justifyContent: "space-between",
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "700",
                            marginBottom: 4,
                            textShadowColor: "rgba(0, 0, 0, 0.75)",
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 2,
                          }}
                        >
                          {bar.name}
                        </Text>

                        {/* Status indicators */}
                        <View style={{ marginTop: 6 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <Ionicons name="time-outline" size={14} color={getWaitColor(bar.waitTime)} />
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#ccc",
                                marginLeft: 4,
                              }}
                            >
                              Wait:{" "}
                              <Text style={{ color: getWaitColor(bar.waitTime), fontWeight: "600" }}>
                                {getWaitLabel(bar.waitTime)}
                              </Text>
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Ionicons name="cash-outline" size={14} color={getCoverColor(bar.coverCharge)} />
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#ccc",
                                marginLeft: 4,
                              }}
                            >
                              Cover:{" "}
                              <Text style={{ color: getCoverColor(bar.coverCharge), fontWeight: "600" }}>
                                {getCoverLabel(bar.coverCharge)}
                              </Text>
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Flip indicator */}
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
                            fontSize: 10,
                            fontStyle: "italic",
                          }}
                        >
                          Flip for details <Ionicons name="sync" size={10} color="rgba(255,255,255,0.6)" />
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Back Side */}
                <View
                  style={{
                    backgroundColor: "#333",
                    borderRadius: 12,
                    height: "100%",
                    justifyContent: "center",
                    paddingHorizontal: 12,
                    overflow: "hidden",
                  }}
                >
                  {/* Bar logo watermark */}
                  <View style={{ position: "absolute", right: -15, bottom: -15, opacity: 0.1 }}>
                    <Image
                      source={bar.image}
                      style={{ width: 100, height: 100, borderRadius: 50 }}
                      resizeMode="cover"
                      defaultSource={bar.image}
                    />
                  </View>

                  <Text
                    style={{
                      color: "white",
                      fontSize: 15,
                      fontWeight: "bold",
                      marginBottom: 8,
                      textShadowColor: "rgba(0, 0, 0, 0.75)",
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    {bar.name}
                  </Text>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation()
                      router.push("/report" as any)
                    }}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                      marginBottom: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      padding: 6,
                      borderRadius: 8,
                    })}
                  >
                    <Ionicons name="megaphone" size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                    <Text style={{ color: "white", fontSize: 13 }}>Add New Report</Text>
                  </Pressable>

                  <Pressable
                    onPress={(event) => handleToggleFavorite(event, bar.name)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                      marginBottom: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      padding: 6,
                      borderRadius: 8,
                    })}
                  >
                    <Ionicons
                      name={isFavorite ? "star" : "star-outline"}
                      size={16}
                      color="#FFD700"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: "white", fontSize: 13 }}>
                      {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation()
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
                    })}
                  >
                    <Ionicons name="location" size={16} color="#4ADE80" style={{ marginRight: 8 }} />
                    <Text style={{ color: "white", fontSize: 13 }}>View Details</Text>
                  </Pressable>
                </View>
              </FlipCard>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}
