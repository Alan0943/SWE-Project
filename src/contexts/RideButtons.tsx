import { View, Text, StyleSheet, Pressable, Linking, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"

type RideButtonsProps = {
  barName: string
  address: string
  latitude?: number
  longitude?: number
}

// Hardcoded coordinates for demo purposes
// In a real app, you would use a geocoding service to convert addresses to coordinates
const barCoordinates: Record<string, { lat: number; lng: number }> = {
  "MacDinton's Irish Pub": { lat: 29.652, lng: -82.325 },
  "JJ's Tavern": { lat: 29.6522, lng: -82.326 },
  "Vivid Music Hall": { lat: 29.648, lng: -82.323 },
  DTF: { lat: 29.6515, lng: -82.3245 },
  Cantina: { lat: 29.6525, lng: -82.3255 },
  "Lil Rudy's": { lat: 29.651, lng: -82.324 },
  Range: { lat: 29.649, lng: -82.3235 },
}

export default function RideButtons({ barName, address }: RideButtonsProps) {
  // Get coordinates for the bar (or use defaults if not found)
  const coordinates = barCoordinates[barName] || { lat: 29.65, lng: -82.32 }

  const openUber = async () => {
    // Construct the Uber deep link
    const uberURL = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${coordinates.lat}&dropoff[longitude]=${coordinates.lng}&dropoff[nickname]=${encodeURIComponent(barName)}`

    // Fallback URL for web
    const uberWebURL = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${coordinates.lat}&dropoff[longitude]=${coordinates.lng}&dropoff[nickname]=${encodeURIComponent(barName)}`

    try {
      // Check if Uber app is installed
      const supported = await Linking.canOpenURL(uberURL)

      if (supported) {
        // Open Uber app
        await Linking.openURL(uberURL)
      } else {
        // Open Uber website
        await Linking.openURL(uberWebURL)
      }
    } catch (error) {
      console.error("Error opening Uber:", error)
      Alert.alert("Error", "Could not open Uber. Please make sure it's installed.")
    }
  }

  const openLyft = async () => {
    // Construct the Lyft deep link
    const lyftURL = `lyft://ridetype?id=lyft&destination[latitude]=${coordinates.lat}&destination[longitude]=${coordinates.lng}&pickup=my_location`

    // Fallback URL for web
    const lyftWebURL = `https://ride.lyft.com/ridetype?id=lyft&destination[latitude]=${coordinates.lat}&destination[longitude]=${coordinates.lng}&pickup=my_location`

    try {
      // Check if Lyft app is installed
      const supported = await Linking.canOpenURL(lyftURL)

      if (supported) {
        // Open Lyft app
        await Linking.openURL(lyftURL)
      } else {
        // Open Lyft website
        await Linking.openURL(lyftWebURL)
      }
    } catch (error) {
      console.error("Error opening Lyft:", error)
      Alert.alert("Error", "Could not open Lyft. Please make sure it's installed.")
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Need a ride?</Text>

      <View style={styles.buttonContainer}>
        <Pressable style={[styles.rideButton, styles.uberButton]} onPress={openUber}>
          <Ionicons name="car" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Uber</Text>
        </Pressable>

        <Pressable style={[styles.rideButton, styles.lyftButton]} onPress={openLyft}>
          <Ionicons name="car-sport" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Lyft</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#222",
    marginTop: 8,
    borderRadius: 8,
  },
  title: {
  color: "#4ADE80",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rideButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  uberButton: {
    backgroundColor: "#000000",
    borderWidth: 0,
    borderColor: "#333",
  },
  lyftButton: {
    backgroundColor: "#FF00BF",
    borderWidth: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
})
