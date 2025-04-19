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
import { useQuery, useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"

// Define a consistent bar type for the component
type BarItem = {
  id?: string
  name: string
  waitTime?: number
  coverCharge?: number
}

// Define the report type for local storage
type Report = {
  barName: string
  waitTime: number
  coverCharge: number
  timestamp: number
}

export default function Report() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [selectedBar, setSelectedBar] = useState<string | null>(null)
  const [selectedBarId, setSelectedBarId] = useState<Id<"bars"> | null>(null)
  const [waitTime, setWaitTime] = useState("")
  const [coverCharge, setCoverCharge] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showBarPicker, setShowBarPicker] = useState(false)

  // Fetch bars from Convex
  const dbBars = useQuery(api.bars.getAllBars) || []
  const submitReport = useMutation(api.bars.submitBarReport)

  // Original hardcoded bar data as fallback
  const hardcodedBars: BarItem[] = [
    { name: "MacDinton's Irish Pub", waitTime: 21, coverCharge: 10 },
    { name: "JJ's Tavern", waitTime: 11, coverCharge: 10 },
    { name: "Vivid Music Hall", waitTime: 0, coverCharge: 0 },
    { name: "DTF", waitTime: 15, coverCharge: 20 },
    { name: "Cantina", waitTime: 35, coverCharge: 20 },
    { name: "Lil Rudy's", waitTime: 0, coverCharge: 5 },
    { name: "Range", waitTime: 20, coverCharge: 10 },
  ]

  // Create a unified list of bars with consistent types
  const bars: BarItem[] =
    dbBars && dbBars.length > 0
      ? dbBars.map((bar) => ({
          id: bar.id,
          name: bar.name,
          waitTime: bar.waitTime,
          coverCharge: bar.coverCharge,
        }))
      : hardcodedBars

  // If a bar was passed in the params, set it as the selected bar
  useEffect(() => {
    if (params.barName) {
      const barName = params.barName as string
      setSelectedBar(barName)

      if (params.barId) {
        try {
          // Convert the string ID to a Convex ID if available
          const barId = params.barId as string
          setSelectedBarId(barId as Id<"bars">)
        } catch (error) {
          console.error("Invalid bar ID format:", error)
        }
      }
    }
  }, [params.barId, params.barName])

  // Function to store report locally if database is not available
  const storeReportLocally = (report: Report) => {
    try {
      // In a real app, you'd use AsyncStorage here
      // For now, just log the report
      console.log("Report stored locally:", report)
      return true
    } catch (error) {
      console.error("Error storing report locally:", error)
      return false
    }
  }

  const handleSubmit = async () => {
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

    try {
      let success = false

      // If we have a bar ID, try to submit to the database
      if (selectedBarId) {
        await submitReport({
          barId: selectedBarId,
          waitTime: waitTimeNum,
          coverCharge: coverChargeNum,
        })
        success = true
      } else {
        // If no bar ID, store locally
        success = storeReportLocally({
          barName: selectedBar,
          waitTime: waitTimeNum,
          coverCharge: coverChargeNum,
          timestamp: Date.now(),
        })
      }

      if (success) {
        setIsSuccess(true)

        // Reset form after 1.5 seconds
        setTimeout(() => {
          setIsSuccess(false)
          setWaitTime("")
          setCoverCharge("")

          // Navigate back
          router.push("/(tabs)/bars")
        }, 1500)
      } else {
        Alert.alert("Error", "Failed to submit report. Please try again.")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit report. Please try again.")
      console.error("Error submitting report:", error)
    } finally {
      setIsSubmitting(false)
    }
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
              keyExtractor={(item, index) => item.id || `bar-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.barItem,
                    (selectedBarId && item.id && selectedBarId === item.id) ||
                    (!selectedBarId && selectedBar === item.name)
                      ? styles.selectedBarItem
                      : {},
                  ]}
                  onPress={() => {
                    setSelectedBar(item.name)
                    if (item.id) {
                      setSelectedBarId(item.id as Id<"bars">)
                    } else {
                      setSelectedBarId(null)
                    }
                    setShowBarPicker(false)
                  }}
                >
                  <Text
                    style={[
                      styles.barItemText,
                      (selectedBarId && item.id && selectedBarId === item.id) ||
                      (!selectedBarId && selectedBar === item.name)
                        ? styles.selectedBarItemText
                        : {},
                    ]}
                  >
                    {item.name}
                  </Text>
                  {((selectedBarId && item.id && selectedBarId === item.id) ||
                    (!selectedBarId && selectedBar === item.name)) && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
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
