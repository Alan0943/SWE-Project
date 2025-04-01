import { ScrollView, Text, View, Pressable, Image } from 'react-native';
import { useFavorites } from '../../src/contexts/FavoritesContext';
import FlipCard from 'react-native-flip-card';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const bars = [
  {
    name: "MacDinton's Irish Pub",
    image: require("../../assets/images/macdintons.jpg"),
    route: "/(tabs)/MacDintons",
  },
  {
    name: "JJ's Tavern",
    image: require("../../assets/images/jjs.jpg"),
    route: "/(tabs)/JJsTavern",
  },
  {
    name: "Vivid Music Hall",
    image: require("../../assets/images/vivid.jpg"),
    route: "/(tabs)/VividMusicHall",
  },
  {
    name: "DTF",
    image: require("../../assets/images/dtf.jpg"),
    route: "/(tabs)/DTF",
  },
  {
    name: "Cantina",
    image: require("../../assets/images/Cantina.jpg"),
    route: "/Cantina",
  },
  {
    name: "Lil Rudy's",
    image: require("../../assets/images/LilRudys.jpg"),
    route: "/(tabs)/LilRudys",
  },
  {
    name: "Range",
    image: require("../../assets/images/range.jpg"),
    route: "/Range",
  },
];

export default function Favorites() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const [editMode, setEditMode] = useState(false);

  const favoriteBars = bars.filter((bar) => favorites.includes(bar.name));

  return (
    <ScrollView style={{ backgroundColor: "black" }} contentContainerStyle={{ paddingVertical: 20 }}>
      {/* Logo + Edit Button */}
      <View style={{ alignItems: 'center', marginBottom: 12, position: 'relative' }}>
        <Image
          source={require('../../assets/images/TailGatorLogo.png')}
          style={{
            width: 80,
            height: 80,
            resizeMode: 'contain',
            borderRadius: 40,
          }}
        />
        <Pressable
          onPress={() => setEditMode((prev) => !prev)}
          style={{ position: 'absolute', right: 20, top: 10 }}
        >
          <Text style={{ color: 'limegreen', fontSize: 16, fontFamily: 'SF Mono' }}>
            {editMode ? 'Done' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {favoriteBars.map((bar, index) => (
        <FlipCard
          key={index}
          clickable={false}
          style={{
            borderWidth: 2,
            borderColor: "limegreen",
            borderRadius: 12,
            marginBottom: 12,
            height: 120,
            width: "92%",
            alignSelf: "center",
          }}
        >
          {[
            // Front Side
            <View
              key="front"
              style={{
                flexDirection: "row",
                backgroundColor: "#333",
                borderRadius: 12,
                overflow: "hidden",
                height: "100%",
              }}
            >
              <Image
                source={bar.image}
                style={{
                  width: 100,
                  height: "100%",
                  borderTopLeftRadius: 12,
                  borderBottomLeftRadius: 12,
                }}
                resizeMode="cover"
              />
              <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
                <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                  {bar.name}
                </Text>

                {editMode ? (
                  <Pressable onPress={() => toggleFavorite(bar.name)}>
                    <Text style={{ color: "red", marginTop: 4, fontSize: 13 }}>
                      ❌ Remove from Favorites
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => router.push(bar.route as any)}>
                    <Text style={{ color: "limegreen", marginTop: 4, fontSize: 13 }}>
                      📍 View This Bar
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>,

            // Back Side (unused)
            <View
              key="back"
              style={{
                backgroundColor: "#444",
                borderRadius: 12,
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#aaa", fontSize: 12 }}>Favorites FlipBack</Text>
            </View>,
          ]}
        </FlipCard>
      ))}

      {favoriteBars.length === 0 && (
        <Text style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
          You haven’t favorited any bars yet.
        </Text>
      )}
    </ScrollView>
  );
}
