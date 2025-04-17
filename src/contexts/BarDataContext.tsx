"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Bar data type
export interface Bar {
  id: string
  name: string
  waitTime: number
  coverCharge: number
  image: any
  route: string
  lastUpdated: number
}

// Report type
export interface BarReport {
  id: string
  barId: string
  waitTime: number
  coverCharge: number
  timestamp: number
  userId?: string // Optional for anonymous reports
}

// Context type
interface BarDataContextType {
  bars: Bar[]
  isLoading: boolean
  submitReport: (barId: string, waitTime: number, coverCharge: number) => Promise<void>
  getBarById: (id: string) => Bar | undefined
  getBarByName: (name: string) => Bar | undefined
  refreshBars: () => Promise<void>
}

// Create context
const BarDataContext = createContext<BarDataContextType | undefined>(undefined)

// Initial bar data
const initialBars: Bar[] = [
  {
    id: "macdintons",
    name: "MacDinton's Irish Pub",
    waitTime: 21,
    coverCharge: 10,
    image: require("../../assets/images/macdintons.jpg"),
    route: "/(bars)/MacDintons",
    lastUpdated: Date.now(),
  },
  {
    id: "jjs",
    name: "JJ's Tavern",
    waitTime: 11,
    coverCharge: 10,
    image: require("../../assets/images/jjs.jpg"),
    route: "/(bars)/JJsTavern",
    lastUpdated: Date.now(),
  },
  {
    id: "vivid",
    name: "Vivid Music Hall",
    waitTime: 0,
    coverCharge: 0,
    image: require("../../assets/images/vivid.jpg"),
    route: "/(bars)/VividMusicHall",
    lastUpdated: Date.now(),
  },
  {
    id: "dtf",
    name: "DTF",
    waitTime: 15,
    coverCharge: 20,
    image: require("../../assets/images/dtf.jpg"),
    route: "/(bars)/DTF",
    lastUpdated: Date.now(),
  },
  {
    id: "cantina",
    name: "Cantina",
    waitTime: 35,
    coverCharge: 20,
    image: require("../../assets/images/Cantina.jpg"),
    route: "/(bars)/Cantina",
    lastUpdated: Date.now(),
  },
  {
    id: "lilrudys",
    name: "Lil Rudy's",
    waitTime: 0,
    coverCharge: 5,
    image: require("../../assets/images/LilRudys.jpg"),
    route: "/(bars)/LilRudys",
    lastUpdated: Date.now(),
  },
  {
    id: "range",
    name: "Range",
    waitTime: 20,
    coverCharge: 10,
    image: require("../../assets/images/range.jpg"),
    route: "/(bars)/Range",
    lastUpdated: Date.now(),
  },
]

// Provider component
export const BarDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bars, setBars] = useState<Bar[]>(initialBars)
  const [reports, setReports] = useState<BarReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load bars
        const storedBars = await AsyncStorage.getItem("bars")
        if (storedBars) {
          setBars(JSON.parse(storedBars))
        } else {
          // If no stored bars, save initial bars
          await AsyncStorage.setItem("bars", JSON.stringify(initialBars))
        }

        // Load reports
        const storedReports = await AsyncStorage.getItem("barReports")
        if (storedReports) {
          setReports(JSON.parse(storedReports))
        }
      } catch (error) {
        console.error("Error loading bar data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Save bars to AsyncStorage whenever they change
  useEffect(() => {
    const saveBars = async () => {
      try {
        await AsyncStorage.setItem("bars", JSON.stringify(bars))
      } catch (error) {
        console.error("Error saving bars:", error)
      }
    }

    if (!isLoading) {
      saveBars()
    }
  }, [bars, isLoading])

  // Save reports to AsyncStorage whenever they change
  useEffect(() => {
    const saveReports = async () => {
      try {
        await AsyncStorage.setItem("barReports", JSON.stringify(reports))
      } catch (error) {
        console.error("Error saving reports:", error)
      }
    }

    if (!isLoading) {
      saveReports()
    }
  }, [reports, isLoading])

  // Get bar by ID
  const getBarById = (id: string) => {
    return bars.find((bar) => bar.id === id)
  }

  // Get bar by name
  const getBarByName = (name: string) => {
    return bars.find((bar) => bar.name === name)
  }

  // Submit a new report and update bar data
  const submitReport = async (barId: string, waitTime: number, coverCharge: number) => {
    try {
      // Create new report
      const newReport: BarReport = {
        id: Date.now().toString(),
        barId,
        waitTime,
        coverCharge,
        timestamp: Date.now(),
      }

      // Add to reports
      const updatedReports = [...reports, newReport]
      setReports(updatedReports)

      // Update bar data based on reports
      updateBarData(barId, updatedReports)

      return Promise.resolve()
    } catch (error) {
      console.error("Error submitting report:", error)
      return Promise.reject(error)
    }
  }

  // Update bar data based on reports
  const updateBarData = (barId: string, currentReports: BarReport[] = reports) => {
    // Find the bar to update
    const barIndex = bars.findIndex((bar) => bar.id === barId)
    if (barIndex === -1) return

    // Get recent reports for this bar (last 24 hours)
    const recentReports = currentReports.filter(
      (report) => report.barId === barId && Date.now() - report.timestamp < 24 * 60 * 60 * 1000,
    )

    if (recentReports.length === 0) return

    // Calculate new values using median to handle outliers
    const waitTimes = recentReports.map((report) => report.waitTime).sort((a, b) => a - b)
    const coverCharges = recentReports.map((report) => report.coverCharge).sort((a, b) => a - b)

    // Get median values (more robust against outliers than mean)
    const medianWaitTime = getMedian(waitTimes)
    const medianCoverCharge = getMedian(coverCharges)

    // Update the bar
    const updatedBars = [...bars]
    updatedBars[barIndex] = {
      ...updatedBars[barIndex],
      waitTime: medianWaitTime,
      coverCharge: medianCoverCharge,
      lastUpdated: Date.now(),
    }

    setBars(updatedBars)
  }

  // Helper function to get median value
  const getMedian = (values: number[]): number => {
    if (values.length === 0) return 0

    const mid = Math.floor(values.length / 2)

    if (values.length % 2 === 0) {
      return Math.round((values[mid - 1] + values[mid]) / 2)
    } else {
      return values[mid]
    }
  }

  // Refresh all bars data
  const refreshBars = async () => {
    setIsLoading(true)

    try {
      // Update all bars based on recent reports
      const updatedBars = [...bars]

      for (const bar of updatedBars) {
        updateBarData(bar.id)
      }

      return Promise.resolve()
    } catch (error) {
      console.error("Error refreshing bars:", error)
      return Promise.reject(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BarDataContext.Provider
      value={{
        bars,
        isLoading,
        submitReport,
        getBarById,
        getBarByName,
        refreshBars,
      }}
    >
      {children}
    </BarDataContext.Provider>
  )
}

// Custom hook to use the context
export const useBarData = () => {
  const context = useContext(BarDataContext)
  if (context === undefined) {
    throw new Error("useBarData must be used within a BarDataProvider")
  }
  return context
}
