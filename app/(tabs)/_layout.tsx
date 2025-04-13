// ✅ SignOutButton component (outside TabLayout)
import { Text, TouchableOpacity } from "react-native"
import * as Linking from "expo-linking"
import { useClerk } from "@clerk/clerk-expo"
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"

export const SignOutButton = () => {
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut()
    Linking.openURL(Linking.createURL("/"))
  }

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text style={{ color: "white", padding: 10 }}>Sign Out</Text>
    </TouchableOpacity>
  )
}

// ✅ Tab layout with buttons
export default function TabLayout() {
  return (
    <>
      {/* You can display SignOutButton above the tabs if you want */}
      {/* <SignOutButton /> */}

      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          headerShown: false,
          tabBarActiveTintColor: COLORS.blue,
          tabBarInactiveTintColor: COLORS.grey,
          tabBarStyle: {
            backgroundColor: "black",
            borderTopWidth: 0,
            position: "absolute",
            elevation: 0,
            height: 40,
            paddingBottom: 10,
            paddingTop: 5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused, color }) => <Ionicons name="home" size={focused ? 30 : 26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="bars"
          options={{
            tabBarIcon: ({ focused, color }) => <Ionicons name="beer-outline" size={focused ? 29 : 26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            tabBarIcon: ({ focused, color }) => <Ionicons name="add-circle" size={focused ? 30 : 26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name="notifications-outline" size={focused ? 30 : 26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name="person-circle" size={focused ? 30 : 26} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  )
}
