"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"

// Define the report type
type Report = {
  id: string
  barName: string
  waitTime: number
  coverCharge: number
  timestamp: string
}

// Define the type for the report data without id and timestamp
type ReportData = Omit<Report, "id" | "timestamp">

// In a real app, this would be connected to a backend
// For this demo, we'll use a simple in-memory store
const reportStore = {
  reports: [] as Report[],
  addReport: (report: ReportData) => {
    reportStore.reports.push({
      ...report,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substring(2, 9),
    })
    console.log("Report added:", report)
    console.log("Total reports:", reportStore.reports.length)
  },
}

// Helper function to ensure we have a string
const ensureString = (value: string | string[] | null | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] || ""
  }
  return value || ""
}

export default function Report() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [selectedBar, setSelectedBar] = useState(ensureString(params.barName))
  const [waitTime, setWaitTime] = useState("")
  const [coverCharge, setCoverCharge] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showBarPicker, setShowBarPicker] = useState(false)

  // Bar data - same as in index.tsx
  const bars = [
    {
      name: "MacDinton's Irish Pub",
      waitTime: 21,
      coverCharge: 10,
      image: require("../assets/images/macdintons.jpg"),
      route: "/(tabs)/MacDintons",
    },
    {
      name: "JJ's Tavern",
      waitTime: 11,
      coverCharge: 10,
      image: require("../assets/images/jjs.jpg"),
      route: "/(tabs)/JJsTavern",
    },
    {
      name: "Vivid Music Hall",
      waitTime: 0,
      coverCharge: 0,
      image: require("../assets/images/vivid.jpg"),
      route: "/(tabs)/VividMusicHall",
    },
    {
      name: "DTF",
      waitTime: 15,
      coverCharge: 20,
      image: require("../assets/images/dtf.jpg"),
      route: "/(tabs)/DTF",
    },
    {
      name: "Cantina",
      waitTime: 35,
      coverCharge: 20,
      image: require("../assets/images/Cantina.jpg"),
      route: "/Cantina",
    },
    {
      name: "Lil Rudy's",
      waitTime: 0,
      coverCharge: 5,
      image: require("../assets/images/LilRudys.jpg"),
      route: "/(tabs)/LilRudys",
    },
    {
      name: "Range",
      waitTime: 20,
      coverCharge: 10,
      image: require("../assets/images/range.jpg"),
      route: "/Range",
    },
  ]

  // If a bar was passed in the params, set it as the selected bar
  useEffect(() => {
    console.log("Params barName:", params.barName)
    if (params.barName) {
      const barName = ensureString(params.barName)
      console.log("Setting selected bar to:", barName)
      setSelectedBar(barName)
    }
  }, [params.barName])

  const handleSubmit = () => {
    // Validate inputs
    if (!selectedBar) {
      Alert.alert("Error", "Please select a bar")
      return
    }

    const waitTimeNum = Number.parseInt(waitTime)
    if (isNaN(waitTimeNum) || waitTimeNum < 0) {
      Alert.alert("Error", "Please enter a valid wait time (0 or more)")
      return
    }

    const coverChargeNum = Number.parseInt(coverCharge)
    if (isNaN(coverChargeNum) || coverChargeNum < 0) {
      Alert.alert("Error", "Please enter a valid cover charge (0 or more)")
      return
    }

    // Submit the report
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      try {
        reportStore.addReport({
          barName: selectedBar,
          waitTime: waitTimeNum,
          coverCharge: coverChargeNum,
        })

        setIsSuccess(true)

        // Reset form after 1.5 seconds
        setTimeout(() => {
          setIsSuccess(false)
          setWaitTime("")
          setCoverCharge("")

          // In a real app, this would update the global state
          // For now, we'll just navigate back
          router.push("/(tabs)/bars")
        }, 1500)
      } catch (error) {
        Alert.alert("Error", "Failed to submit report. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    }, 1000)
  }

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
          <Text style={styles.successTitle}>Report Submitted!</Text>
          <Text style={styles.successText}>Thank you for helping keep TailGator up-to-date.</Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Submit Report</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Help keep TailGator up-to-date!</Text>
          <Text style={styles.formSubtitle}>
            Submit current wait times and cover charges to help other users plan their night.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Bar</Text>
            <Pressable style={styles.customPickerButton} onPress={() => setShowBarPicker(true)}>
              <Text style={styles.customPickerText}>{selectedBar || "Select a bar..."}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Wait Time (minutes)</Text>
            <TextInput
              style={styles.input}
              value={waitTime}
              onChangeText={setWaitTime}
              placeholder="Enter wait time in minutes"
              placeholderTextColor="#666"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Cover Charge ($)</Text>
            <TextInput
              style={styles.input}
              value={coverCharge}
              onChangeText={setCoverCharge}
              placeholder="Enter cover charge in dollars"
              placeholderTextColor="#666"
              keyboardType="number-pad"
            />
          </View>

          <Pressable
            style={[styles.submitButton, (isSubmitting || !selectedBar) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || !selectedBar}
          >
            {isSubmitting ? (
              <ActivityIndicator color="black" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="black" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.disclaimer}>
            Note: Reports are anonymous and help keep information accurate for all users.
          </Text>
        </View>
      </ScrollView>

      {/* Custom Bar Picker Modal */}
      <Modal
        visible={showBarPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Bar</Text>
              <Pressable onPress={() => setShowBarPicker(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>

            <FlatList
              data={bars}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.barItem, selectedBar === item.name && styles.selectedBarItem]}
                  onPress={() => {
                    setSelectedBar(item.name)
                    setShowBarPicker(false)
                  }}
                >
                  <Text style={[styles.barItemText, selectedBar === item.name && styles.selectedBarItemText]}>
                    {item.name}
                  </Text>
                  {selectedBar === item.name && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  formSubtitle: {
    color: "#CCC",
    fontSize: 14,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: "white",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#222",
    color: "white",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  customPickerButton: {
    backgroundColor: "#222",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customPickerText: {
    color: "white",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    flexDirection: "row",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  disclaimer: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
  successContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  successText: {
    color: "#CCC",
    fontSize: 16,
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#222",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  barItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectedBarItem: {
    backgroundColor: "rgba(74, 222, 128, 0.1)",
  },
  barItemText: {
    color: "white",
    fontSize: 16,
  },
  selectedBarItemText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
})
