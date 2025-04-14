"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  Platform,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useClerk, useUser } from "@clerk/clerk-expo"
import { useFavorites } from "../../src/contexts/FavoritesContext"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"

// Add these type definitions at the top of the file, after the imports
type Friend = {
  id: string
  name: string
  username: string
  image: any // Using any for image since it's a require() import
  favorites: string[]
}

type Bar = {
  name: string
  waitTime: number
  coverCharge: number
  image: any // Using any for image since it's a require() import
  route: string
}

// Update the mock data declarations to use the Friend type
const MOCK_FRIENDS: Friend[] = [
  {
    id: "1",
    name: "Brendan Groff",
    username: "brendangv",
    image: require("../../assets/images/default-profile.png"),
    favorites: ["MacDinton's Irish Pub", "Cantina"],
  },
  {
    id: "2",
    name: "Alan Skrypek",
    username: "bigal",
    image: require("../../assets/images/default-profile.png"),
    favorites: ["Vivid Music Hall", "DTF"],
  },
  {
    id: "3",
    name: "Garrett Mullins",
    username: "gmullins",
    image: require("../../assets/images/default-profile.png"),
    favorites: ["Cantina", "Range"],
  },
]

// Update the mock suggestions to use the Friend type
const MOCK_SUGGESTIONS: Friend[] = [
  {
    id: "4",
    name: "Tarik Firkatoune",
    username: "tarfir",
    image: require("../../assets/images/default-profile.png"),
    favorites: [],
  },
  {
    id: "5",
    name: "Dan Khani",
    username: "gsifdemon",
    image: require("../../assets/images/default-profile.png"),
    favorites: [],
  },
  {
    id: "6",
    name: "Max Ross",
    username: "pcp",
    image: require("../../assets/images/default-profile.png"),
    favorites: [],
  },
  {
    id: "7",
    name: "Adam Sherman",
    username: "sherm",
    image: require("../../assets/images/default-profile.png"),
    favorites: [],
  },
]

let friends: Friend[] = MOCK_FRIENDS
let searchResults: Friend[] = MOCK_SUGGESTIONS
let selectedFriend: Friend | null = null

export default function ProfileScreen() {
  const { signOut } = useClerk()
  const { user } = useUser()
  const { favorites } = useFavorites()
  const router = useRouter()

  const [username, setUsername] = useState(user?.username || "")
  const [editingUsername, setEditingUsername] = useState(false)
  const [profilePic, setProfilePic] = useState(user?.imageUrl || null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile") // 'profile', 'friends', 'activity'
  const [friendsState, setFriends] = useState(MOCK_FRIENDS)
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResultsState, setSearchResults] = useState(MOCK_SUGGESTIONS)
  const [selectedFriendState, setSelectedFriend] = useState<Friend | null>(null)
  const [friendProfileVisible, setFriendProfileVisible] = useState(false)
  const [showProfile, setShowProfile] = useState(activeTab === "profile")
  const [showFriends, setShowFriends] = useState(activeTab === "friends")

  // Bar data - same as in index.tsx
  // Update the bars declaration to use the Bar type
  const bars: Bar[] = [
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

  // Helper functions from index.tsx
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
    if (amount >= 20) return `$${amount} 🚨`
    return `$${amount}`
  }

  const getWaitLabel = (minutes: number) => {
    if (minutes <= 10) return "Short Wait ⏱️"
    if (minutes <= 20) return `${minutes} minutes`
    return `${minutes} minutes ⚠️`
  }

  // Search for friends
  useEffect(() => {
    if (searchQuery.trim() === "") {
      searchResults = MOCK_SUGGESTIONS
      setSearchResults(MOCK_SUGGESTIONS)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = MOCK_SUGGESTIONS.filter(
      (user) => user.name.toLowerCase().includes(query) || user.username.toLowerCase().includes(query),
    )
    searchResults = filtered
    setSearchResults(filtered)
  }, [searchQuery])

  const handlePickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;

    setIsLoading(true);

    const uri = result.assets[0].uri;
    const name = uri.split("/").pop() || "profile.jpg";
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1]}` : `image`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const file = new File([blob], name, { type });

    // Clerk expects a File object
    await user?.setProfileImage({ file });

    await user?.reload();
    setProfilePic(user?.imageUrl || uri);

    Alert.alert("Success", "Profile picture updated successfully");
  } catch (error) {
    console.error("Error updating profile image:", error);
    Alert.alert("Error", "Failed to update profile picture. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Error", "Failed to sign out. Please try again.")
    }
  }

  const handleUsernameSave = async () => {
    try {
      // Validate username
      if (!username.trim()) {
        Alert.alert("Error", "Username cannot be empty")
        return
      }

      // Show loading indicator
      setIsLoading(true)

      // Update username in Clerk
      await user?.update({
        username: username,
      })

      // Refresh user data
      await user?.reload()

      // Exit editing mode
      setEditingUsername(false)

      // Show success message
      Alert.alert("Success", "Username updated successfully")
    } catch (error) {
      console.error("Error updating username:", error)
      Alert.alert("Error", "Failed to update username. Please try again.")

      // Revert to previous username on error
      setUsername(user?.username || "")
    } finally {
      setIsLoading(false)
    }
  }

  // Add friend function
  const handleAddFriend = (friend: Friend) => {
    // Check if already friends
    const isAlreadyFriend = friends.some((f) => f.id === friend.id)
    if (isAlreadyFriend) {
      Alert.alert("Already Friends", `You are already friends with ${friend.name}`)
      return
    }

    // Add to friends list
    friends = [...friends, friend]
    setFriends([...friends, friend])

    // Remove from suggestions
    const updatedSuggestions = searchResults.filter((f) => f.id !== friend.id)
    searchResults = updatedSuggestions
    setSearchResults(updatedSuggestions)

    Alert.alert("Friend Added", `${friend.name} has been added to your friends list`)
  }

  // Remove friend function
  const handleRemoveFriend = (friendId: string) => {
    Alert.alert("Remove Friend", "Are you sure you want to remove this friend?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const updatedFriends = friends.filter((f) => f.id !== friendId)
          friends = updatedFriends
          setFriends(updatedFriends)

          // If viewing this friend's profile, close it
          if (selectedFriend && selectedFriend.id === friendId) {
            setFriendProfileVisible(false)
            selectedFriend = null
            setSelectedFriend(null)
          }
        },
      },
    ])
  }

  // View friend profile
  const handleViewFriendProfile = (friend: Friend) => {
    selectedFriend = friend
    setSelectedFriend(friend)
    setFriendProfileVisible(true)
  }

  // Get only the favorited bars
  const favoritedBars = bars.filter((bar) => favorites.includes(bar.name))

  // Get friend's favorited bars
  const getFriendFavoritedBars = (friendFavorites: string[]) => {
    return bars.filter((bar) => friendFavorites.includes(bar.name))
  }

  // Render friend's profile
  const renderFriendProfile = () => {
    if (!selectedFriend) return null

    const friendFavoritedBars = getFriendFavoritedBars(selectedFriend.favorites)

    return (
      <Modal visible={friendProfileVisible} animationType="slide" onRequestClose={() => setFriendProfileVisible(false)}>
        <SafeAreaView style={styles.friendProfileContainer}>
          <View style={styles.friendProfileHeader}>
            <Pressable onPress={() => setFriendProfileVisible(false)} style={styles.modalBackButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text style={styles.friendProfileTitle}>{selectedFriend.name}'s Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={styles.friendProfileInfo}>
              <Image source={selectedFriend.image} style={styles.friendProfileImage} />
              <Text style={styles.friendProfileName}>{selectedFriend.name}</Text>
              <Text style={styles.friendProfileUsername}>@{selectedFriend.username}</Text>
            </View>

            <View style={styles.friendFavoritesSection}>
              <Text style={styles.sectionTitle}>{selectedFriend.name}'s Favorite Bars</Text>

              {friendFavoritedBars.length === 0 ? (
                <View style={styles.emptyFavorites}>
                  <Ionicons name="star-outline" size={40} color="#555" />
                  <Text style={styles.emptyText}>No favorites yet</Text>
                </View>
              ) : (
                <View style={styles.favoritesList}>
                  {friendFavoritedBars.map((bar) => (
                    <Pressable
                      key={bar.name}
                      style={styles.favoriteBar}
                      onPress={() => {
                        setFriendProfileVisible(false)
                        router.push(bar.route as any)
                      }}
                    >
                      <Image source={bar.image} style={styles.barImage} resizeMode="cover" />
                      <View style={styles.barInfo}>
                        <Text style={styles.barName}>{bar.name}</Text>
                        <View style={styles.barStats}>
                          <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={14} color={getWaitColor(bar.waitTime)} />
                            <Text style={styles.statText}>
                              Wait:{" "}
                              <Text style={{ color: getWaitColor(bar.waitTime) }}>{getWaitLabel(bar.waitTime)}</Text>
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <Ionicons name="cash-outline" size={14} color={getCoverColor(bar.coverCharge)} />
                            <Text style={styles.statText}>
                              Cover:{" "}
                              <Text style={{ color: getCoverColor(bar.coverCharge) }}>
                                {getCoverLabel(bar.coverCharge)}
                              </Text>
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#666" style={styles.chevron} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              onPress={() => selectedFriend && handleRemoveFriend(selectedFriend.id)}
              style={styles.removeFriendButton}
            >
              <Ionicons name="person-remove" size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.removeFriendText}>Remove Friend</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    )
  }

  // Render search modal
  const renderSearchModal = () => {
    return (
      <Modal visible={searchModalVisible} animationType="slide" onRequestClose={() => setSearchModalVisible(false)}>
        <SafeAreaView style={styles.searchModalContainer}>
          <View style={styles.searchModalHeader}>
            <Pressable onPress={() => setSearchModalVisible(false)} style={styles.modalBackButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text style={styles.searchModalTitle}>Find Friends</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </Pressable>
            )}
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.searchResultItem}>
                <Image source={item.image} style={styles.searchResultImage} />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  <Text style={styles.searchResultUsername}>@{item.username}</Text>
                </View>
                <Pressable onPress={() => handleAddFriend(item)} style={styles.addFriendButton}>
                  <Ionicons name="person-add" size={18} color="white" />
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptySearchResults}>
                <Ionicons name="search" size={40} color="#555" />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    )
  }

  useEffect(() => {
    setShowProfile(activeTab === "profile")
    setShowFriends(activeTab === "friends")
  }, [activeTab])

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
        >
          <Ionicons name="person" size={20} color={activeTab === "profile" ? COLORS.primary : "#999"} />
          <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>Profile</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}
        >
          <Ionicons name="people" size={20} color={activeTab === "friends" ? COLORS.primary : "#999"} />
          <Text style={[styles.tabText, activeTab === "friends" && styles.activeTabText]}>Friends</Text>
        </Pressable>
      </View>

      {/* Profile Tab */}
      {showProfile && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.profileSection}>
            <Pressable onPress={handlePickImage} disabled={isLoading} style={styles.avatarContainer}>
              {isLoading ? (
                <View
                  style={[styles.avatar, { justifyContent: "center", alignItems: "center", backgroundColor: "#333" }]}
                >
                  <ActivityIndicator color={COLORS.primary} size="small" />
                </View>
              ) : (
                <Image
                  source={profilePic ? { uri: profilePic } : require("../../assets/images/default-profile.png")}
                  style={styles.avatar}
                />
              )}
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={14} color="white" />
              </View>
            </Pressable>

            <Pressable onPress={handlePickImage} style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </Pressable>

            {editingUsername ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Username"
                  value={username}
                  onChangeText={setUsername}
                  editable={!isLoading}
                />
                <Pressable onPress={handleUsernameSave} disabled={isLoading} style={styles.saveButton}>
                  <Text style={styles.saveText}>{isLoading ? "Saving..." : "Save"}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.username}>{username || "Set Username"}</Text>
                <Pressable onPress={() => setEditingUsername(true)} disabled={isLoading} style={styles.editButton}>
                  <Ionicons name="pencil" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.editText}>Edit Username</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Favorites Section */}
          <View style={styles.favoritesSection}>
            <Text style={styles.sectionTitle}>My Favorite Bars</Text>

            {favoritedBars.length === 0 ? (
              <View style={styles.emptyFavorites}>
                <Ionicons name="star-outline" size={40} color="#555" />
                <Text style={styles.emptyText}>No favorites yet</Text>
                <Text style={styles.emptySubtext}>Add favorites from the Bars tab</Text>
              </View>
            ) : (
              <View style={styles.favoritesList}>
                {favoritedBars.map((bar) => (
                  <Pressable key={bar.name} style={styles.favoriteBar} onPress={() => router.push(bar.route as any)}>
                    <Image source={bar.image} style={styles.barImage} resizeMode="cover" />
                    <View style={styles.barInfo}>
                      <Text style={styles.barName}>{bar.name}</Text>
                      <View style={styles.barStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="time-outline" size={14} color={getWaitColor(bar.waitTime)} />
                          <Text style={styles.statText}>
                            Wait:{" "}
                            <Text style={{ color: getWaitColor(bar.waitTime) }}>{getWaitLabel(bar.waitTime)}</Text>
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="cash-outline" size={14} color={getCoverColor(bar.coverCharge)} />
                          <Text style={styles.statText}>
                            Cover:{" "}
                            <Text style={{ color: getCoverColor(bar.coverCharge) }}>
                              {getCoverLabel(bar.coverCharge)}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" style={styles.chevron} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Pressable
            onPress={handleSignOut}
            style={[styles.signOutButton, isLoading && { opacity: 0.5 }]}
            disabled={isLoading}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Friends Tab */}
      {showFriends && (
        <ScrollView
          style={styles.friendsContainer}
          contentContainerStyle={{ paddingTop: Platform.OS === "ios" ? 20 : 0 }}
        >
          <View style={styles.friendsHeader}>
            <Text style={styles.friendsTitle}>My Friends</Text>
            <Pressable style={styles.addFriendsButton} onPress={() => setSearchModalVisible(true)}>
              <Ionicons name="person-add" size={18} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.addFriendsText}>Add Friends</Text>
            </Pressable>
          </View>

          {friends.length === 0 ? (
            <View style={styles.emptyFriends}>
              <Ionicons name="people" size={40} color="#555" />
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Add friends to see their profiles</Text>
              <Pressable style={styles.findFriendsButton} onPress={() => setSearchModalVisible(true)}>
                <Text style={styles.findFriendsText}>Find Friends</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.friendsList}>
              {friends.map((item) => (
                <Pressable key={item.id} style={styles.friendItem} onPress={() => handleViewFriendProfile(item)}>
                  <Image source={item.image} style={styles.friendImage} />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text style={styles.friendUsername}>@{item.username}</Text>
                    <View style={styles.friendFavoritesPreview}>
                      <Text style={styles.friendFavoritesCount}>
                        {item.favorites.length} favorite {item.favorites.length === 1 ? "bar" : "bars"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" style={styles.chevron} />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Friend Search Modal */}
      {renderSearchModal()}

      {/* Friend Profile Modal */}
      {renderFriendProfile()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
  },
  // Tab Navigation
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#111",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: "#999",
    marginLeft: 6,
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  // Profile Section
  profileSection: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#333",
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },
  changePhotoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: 13,
    textAlign: "center",
  },
  username: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: 16,
  },
  editText: {
    color: COLORS.primary,
    fontSize: 13,
  },
  input: {
    backgroundColor: "#222",
    color: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: 200,
    textAlign: "center",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "rgba(74, 222, 128, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  signOutButton: {
    backgroundColor: "orangered",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: "center",
  },
  signOutText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Favorites section styles
  favoritesSection: {
    padding: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyFavorites: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
    padding: 30,
    borderRadius: 10,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    marginTop: 10,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
  },
  favoritesList: {
    gap: 10,
  },
  favoriteBar: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 10,
    overflow: "hidden",
    height: 80,
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  barImage: {
    width: 80,
    height: 80,
  },
  barInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  barName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  barStats: {
    gap: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 4,
  },
  chevron: {
    marginRight: 10,
  },
  // Friends Tab
  friendsContainer: {
    flex: 1,
  },
  friendsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 15,
    marginTop: Platform.OS === "ios" ? 30 : 10, // Added more top padding for iOS
  },
  friendsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  addFriendsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addFriendsText: {
    color: "black",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyFriends: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginTop: 50, // Added more top margin
  },
  findFriendsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  findFriendsText: {
    color: "black",
    fontWeight: "600",
    fontSize: 14,
  },
  friendsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  friendItem: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  friendImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  friendUsername: {
    color: "#999",
    fontSize: 13,
    marginBottom: 4,
  },
  friendFavoritesPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  friendFavoritesCount: {
    color: "#ccc",
    fontSize: 12,
  },
  // Search Modal
  searchModalContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 20 : 16, // Added more top padding for iOS
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  searchModalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBackButton: {
    padding: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "white",
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  searchResultUsername: {
    color: "#999",
    fontSize: 13,
  },
  addFriendButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySearchResults: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  // Friend Profile Modal
  friendProfileContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  friendProfileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 20 : 16, // Added more top padding for iOS
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  friendProfileTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  friendProfileInfo: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  friendProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  friendProfileName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  friendProfileUsername: {
    color: "#999",
    fontSize: 14,
    marginTop: 4,
  },
  friendFavoritesSection: {
    padding: 20,
  },
  removeFriendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 8,
  },
  removeFriendText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
})
