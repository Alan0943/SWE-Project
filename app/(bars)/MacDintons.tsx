"use client"

import { useState } from "react"
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet, Dimensions } from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useFavorites } from "../../src/contexts/FavoritesContext"
import { COLORS } from "@/constants/theme"
import RideButtons from "../../src/contexts/RideButtons"

const { width } = Dimensions.get("window")

export default function MacDintons() {
  const router = useRouter()
  const { favorites, toggleFavorite } = useFavorites()
  const isFavorite = favorites.includes("MacDinton's Irish Pub")

  // Gallery images
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const galleryImages = [
    require("../../assets/images/Macdintonspage.jpg"),
    require("../../assets/images/Mac1.jpg"), // Replace with additional images
    require("../../assets/images/Mac2.jpg"), // Replace with additional images
  ]

  // Bar details
  const barDetails = {
    name: "MacDinton's Irish Pub",
    description:
      "MacDinton's Irish Pub is a lively bar in Gainesville offering a vibrant atmosphere with Irish-inspired drinks and food. Popular among students, it features live music, sports viewing, and themed nights throughout the week.",
    address: "1702 W University Ave, Gainesville, FL 32603",
    phone: "(352) 672-6111",
    website: "https://macdintonsgainesville.com",
    socials: {
      instagram: "macdintonsgville",
      facebook: "MacDintonsGainesville",
      twitter: "MacDintonsGNV",
    },
    hours: [
      { day: "Monday", hours: "4:00 PM - 2:00 AM" },
      { day: "Tuesday", hours: "4:00 PM - 2:00 AM" },
      { day: "Wednesday", hours: "4:00 PM - 2:00 AM" },
      { day: "Thursday", hours: "4:00 PM - 2:00 AM" },
      { day: "Friday", hours: "4:00 PM - 2:00 AM" },
      { day: "Saturday", hours: "12:00 PM - 2:00 AM" },
      { day: "Sunday", hours: "12:00 PM - 2:00 AM" },
    ],
    deals: [
      { day: "Monday", title: "Irish Monday", description: "$4 Guinness, $5 Jameson" },
      { day: "Tuesday", title: "Tequila Tuesday", description: "$3 Tequila Shots, $5 Margaritas" },
      { day: "Wednesday", title: "Wine Wednesday", description: "Half-price bottles of wine" },
      { day: "Thursday", title: "Thirsty Thursday", description: "$2 Domestic Drafts, $3 Wells" },
      { day: "Friday", title: "Friday Happy Hour", description: "2-for-1 Drinks (4-7 PM)" },
      { day: "Saturday", title: "Saturday Special", description: "$15 Buckets, $6 Irish Car Bombs" },
      { day: "Sunday", title: "Sunday Funday", description: "$4 Bloody Marys, $4 Mimosas" },
    ],
    currentWaitTime: 21,
    coverCharge: 10,
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

  return (
    <ScrollView style={styles.container}>
      {/* Header with back button and favorite */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
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
            <Image key={index} source={image} style={styles.galleryImage} resizeMode="cover" />
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
      <View style={[styles.section, { marginBottom: 0 }]}>
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
      {/* Ride Buttons */}
      <RideButtons barName={barDetails.name} address={barDetails.address} />
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
