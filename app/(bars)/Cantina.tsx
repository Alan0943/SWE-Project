"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useFavorites } from "../../src/contexts/FavoritesContext"
import { COLORS } from "@/constants/theme"
import RideButtons from "../../src/contexts/RideButtons"

const { width } = Dimensions.get("window")

export default function Cantina() {
  const router = useRouter()
  const { favorites, toggleFavorite } = useFavorites()
  const isFavorite = favorites.includes("Cantina")
  const [imagesLoaded, setImagesLoaded] = useState(false)

  // Gallery images
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const galleryImages = [
    require("../../assets/images/Cantina.jpg"),
    require("../../assets/images/Cantina.jpg"), // Replace with additional images
    require("../../assets/images/Cantina.jpg"), // Replace with additional images
  ]

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const prefetchPromises = galleryImages.map((image) => {
          const img = Image.resolveAssetSource(image)
          return Image.prefetch(img.uri)
        })

        await Promise.all(prefetchPromises)
        setImagesLoaded(true)
      } catch (error) {
        console.error("Error preloading images:", error)
        setImagesLoaded(true)
      }
    }

    preloadImages()

    // Fallback in case prefetching takes too long
    const timeoutId = setTimeout(() => {
      if (!imagesLoaded) {
        setImagesLoaded(true)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  // Bar details
  const barDetails = {
    name: "Cantina",
    description:
      "Cantina is a vibrant Mexican-themed bar and restaurant in Gainesville, offering a lively atmosphere with colorful decor and Latin music. Known for its extensive tequila selection, creative margaritas, and authentic Mexican cuisine, it's a popular spot for both dining and nightlife. The outdoor patio area is especially popular during pleasant weather.",
    address: "1632 W University Ave, Gainesville, FL 32603",
    phone: "(352) 378-2552",
    website: "https://cantinagainesville.com",
    socials: {
      instagram: "cantinagnv",
      facebook: "CantinaGainesville",
      twitter: "CantinaGNV",
    },
    hours: [
      { day: "Monday", hours: "11:00 AM - 2:00 AM" },
      { day: "Tuesday", hours: "11:00 AM - 2:00 AM" },
      { day: "Wednesday", hours: "11:00 AM - 2:00 AM" },
      { day: "Thursday", hours: "11:00 AM - 2:00 AM" },
      { day: "Friday", hours: "11:00 AM - 2:00 AM" },
      { day: "Saturday", hours: "11:00 AM - 2:00 AM" },
      { day: "Sunday", hours: "11:00 AM - 12:00 AM" },
    ],
    deals: [
      { day: "Monday", title: "Margarita Monday", description: "$5 House Margaritas all day" },
      { day: "Tuesday", title: "Taco Tuesday", description: "$2 Tacos, $3 Corona" },
      { day: "Wednesday", title: "Wing Wednesday", description: "50¢ Wings, $4 Dos Equis" },
      { day: "Thursday", title: "Thirsty Thursday", description: "$5 Tequila Shots, $15 Margarita Pitchers" },
      { day: "Friday", title: "Fiesta Friday", description: "Happy Hour 4-7PM, 2-for-1 Drinks" },
      { day: "Saturday", title: "Salsa Saturday", description: "Live Music, $6 Specialty Margaritas" },
      { day: "Sunday", title: "Sunday Funday", description: "$20 Bottomless Mimosas (11AM-3PM)" },
    ],
    currentWaitTime: 35,
    coverCharge: 20,
  }

  const openSocialMedia = (platform: string) => {
    let url = ""
    switch (platform) {
      case "instagram":
        url = `https://instagram.com/${barDetails.socials.instagram}`
        break
      case "facebook":
        url = `https://facebook.com/${barDetails.socials.facebook}`
        break
      case "twitter":
        url = `https://twitter.com/${barDetails.socials.twitter}`
        break
      default:
        url = barDetails.website
    }
    Linking.openURL(url)
  }

  const openMaps = () => {
    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(barDetails.address)}`
    Linking.openURL(mapUrl)
  }

  const callBar = () => {
    Linking.openURL(`tel:${barDetails.phone.replace(/[^0-9]/g, "")}`)
  }

  const openWebsite = () => {
    Linking.openURL(barDetails.website)
  }

  // Modified to go back to bars tab instead of default back behavior
  const handleBackPress = () => {
    router.push("/(tabs)/bars")
  }

  // If images are still loading, show a loading indicator
  if (!imagesLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A1A1A" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with back button and favorite */}
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{barDetails.name}</Text>
        <Pressable onPress={() => toggleFavorite(barDetails.name)} style={styles.favoriteButton}>
          <Ionicons name={isFavorite ? "star" : "star-outline"} size={24} color={isFavorite ? "#FFD700" : "white"} />
        </Pressable>
      </View>

      {/* Image Gallery */}
      <View style={styles.galleryContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.floor(event.nativeEvent.contentOffset.x / width)
            setActiveImageIndex(slideIndex)
          }}
        >
          {galleryImages.map((image, index) => (
            <Image
              key={index}
              source={image}
              style={styles.galleryImage}
              resizeMode="cover"
              defaultSource={image} // Use the same image as default source
            />
          ))}
        </ScrollView>

        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {galleryImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === activeImageIndex ? COLORS.primary : "rgba(255,255,255,0.5)" },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Current Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Ionicons name="time-outline" size={20} color={COLORS.primary} />
          <Text style={styles.statusLabel}>Wait Time</Text>
          <Text style={[styles.statusValue, { color: barDetails.currentWaitTime > 20 ? "red" : COLORS.primary }]}>
            {barDetails.currentWaitTime} min
          </Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
          <Text style={styles.statusLabel}>Cover</Text>
          <Text style={[styles.statusValue, { color: barDetails.coverCharge > 15 ? "red" : COLORS.primary }]}>
            ${barDetails.coverCharge}
          </Text>
        </View>
        <View style={styles.statusDivider} />
        <Pressable style={styles.statusItem} onPress={() => router.push("/report" as any)}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          <Text style={styles.statusLabel}>Update</Text>
          <Text style={[styles.statusValue, { color: COLORS.primary }]}>Report</Text>
        </Pressable>
      </View>

      {/* Ride Buttons */}
      <RideButtons barName={barDetails.name} address={barDetails.address} />

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{barDetails.description}</Text>
      </View>

      {/* Contact & Social */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Social</Text>

        <View style={styles.contactRow}>
          <Pressable style={styles.contactButton} onPress={openMaps}>
            <Ionicons name="location-outline" size={20} color="white" />
            <Text style={styles.contactButtonText}>Directions</Text>
          </Pressable>

          <Pressable style={styles.contactButton} onPress={callBar}>
            <Ionicons name="call-outline" size={20} color="white" />
            <Text style={styles.contactButtonText}>Call</Text>
          </Pressable>

          <Pressable style={styles.contactButton} onPress={openWebsite}>
            <Ionicons name="globe-outline" size={20} color="white" />
            <Text style={styles.contactButtonText}>Website</Text>
          </Pressable>
        </View>

        <View style={styles.socialRow}>
          <Pressable style={styles.socialButton} onPress={() => openSocialMedia("instagram")}>
            <Ionicons name="logo-instagram" size={24} color="white" />
          </Pressable>

          <Pressable style={styles.socialButton} onPress={() => openSocialMedia("facebook")}>
            <Ionicons name="logo-facebook" size={24} color="white" />
          </Pressable>

          <Pressable style={styles.socialButton} onPress={() => openSocialMedia("twitter")}>
            <Ionicons name="logo-twitter" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hours</Text>
        {barDetails.hours.map((item, index) => (
          <View key={index} style={styles.hoursRow}>
            <Text style={styles.dayText}>{item.day}</Text>
            <Text style={styles.hoursText}>{item.hours}</Text>
          </View>
        ))}
      </View>

      {/* Deals & Promos */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <Text style={styles.sectionTitle}>Deals & Promos</Text>
        {barDetails.deals.map((deal, index) => (
          <View key={index} style={styles.dealCard}>
            <View style={styles.dealHeader}>
              <Text style={styles.dealDay}>{deal.day}</Text>
              <Text style={styles.dealTitle}>{deal.title}</Text>
            </View>
            <Text style={styles.dealDescription}>{deal.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#222",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  favoriteButton: {
    padding: 8,
  },
  galleryContainer: {
    height: 220,
    position: "relative",
  },
  galleryImage: {
    width: width,
    height: 220,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  statusContainer: {
    flexDirection: "row",
    backgroundColor: "#222",
    padding: 16,
    marginTop: 1,
    justifyContent: "space-between",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
  },
  statusDivider: {
    width: 1,
    backgroundColor: "#333",
  },
  statusLabel: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  statusValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    padding: 16,
    backgroundColor: "#222",
    marginTop: 8,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    color: "#DDD",
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  contactButtonText: {
    color: "white",
    marginLeft: 6,
    fontSize: 13,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  socialButton: {
    backgroundColor: "#333",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dayText: {
    color: "#DDD",
    fontWeight: "500",
  },
  hoursText: {
    color: "#DDD",
  },
  dealCard: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  dealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dealDay: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: 8,
  },
  dealTitle: {
    color: "white",
    fontWeight: "bold",
  },
  dealDescription: {
    color: "#DDD",
  },
})
