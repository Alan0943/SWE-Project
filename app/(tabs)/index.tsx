import { Image, Text, View, ScrollView, Pressable } from "react-native";
import { styles } from "../../styles/auth.styles";
import { useRouter } from "expo-router";
import FlipCard from "react-native-flip-card";
import { useFavorites } from '../../src/contexts/FavoritesContext';
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();

  // ✅ Bar data
  const bars = [
    {
      name: "MacDinton's Irish Pub",
      waitTime: 21,
      coverCharge: 10,
      image: require("../../assets/images/macdintons.jpg"),
      route: "/(tabs)/MacDintons",
    },
    {
      name: "JJ's Tavern",
      waitTime: 11,
      coverCharge: 10,
      image: require("../../assets/images/jjs.jpg"),
      route: "/(tabs)/JJsTavern",
    },
    {
      name: "Vivid Music Hall",
      waitTime: 0,
      coverCharge: 0,
      image: require("../../assets/images/vivid.jpg"),
      route: "/(tabs)/VividMusicHall",
    },
    {
      name: "DTF",
      waitTime: 15,
      coverCharge: 20,
      image: require("../../assets/images/dtf.jpg"),
      route: "/(tabs)/DTF",
    },
    {
      name: "Cantina",
      waitTime: 35,
      coverCharge: 20,
      image: require("../../assets/images/Cantina.jpg"),
      route: "/Cantina",
    },
    {
      name: "Lil Rudy's",
      waitTime: 0,
      coverCharge: 5,
      image: require("../../assets/images/LilRudys.jpg"),
      route: "/(tabs)/LilRudys",
    },
    {
      name: "Range",
      waitTime: 20,
      coverCharge: 10,
      image: require("../../assets/images/range.jpg"),
      route: "/Range",
    },
  ];

  // ✅ Preload images on mount
  useEffect(() => {
    bars.forEach((bar) => {
      const img = Image.resolveAssetSource(bar.image);
      Image.prefetch(img.uri);
    });
  }, []);

  const getWaitColor = (minutes: number) => {
    if (minutes <= 10) return "limegreen";
    if (minutes <= 20) return "gold";
    return "red";
  };

  const getCoverColor = (amount: number) => {
    if (amount <= 9) return "limegreen";
    if (amount <= 19) return "gold";
    return "red";
  };

  const getCoverLabel = (amount: number) => {
    if (amount === 0) return "Free Entry 🎉";
    if (amount >= 20) return `$${amount} 🚨`;
    return `$${amount}`;
  };

  const getWaitLabel = (minutes: number) => {
    if (minutes <= 10) return "Short Wait ⏱️";
    if (minutes <= 20) return `${minutes} minutes`;
    return `${minutes} minutes ⚠️`;
  };

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
            const isFavorite = favorites.includes(bar.name);

            return (
              <FlipCard
                key={`${bar.name}-${isFavorite}`}
                style={{
                  borderWidth: 2,
                  borderColor: "limegreen",
                  borderRadius: 12,
                  marginBottom: 12,
                  height: 120,
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
                    <Text style={{ fontSize: 11 }}>
                      <Text style={{ color: "#ccc" }}>Current wait time: </Text>
                      <Text style={{ color: getWaitColor(bar.waitTime) }}>
                        {getWaitLabel(bar.waitTime)}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 11 }}>
                      <Text style={{ color: "#ccc" }}>Current cover charge: </Text>
                      <Text style={{ color: getCoverColor(bar.coverCharge) }}>
                        {getCoverLabel(bar.coverCharge)}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Back Side */}
                <View
                  style={{
                    backgroundColor: "#444",
                    borderRadius: 12,
                    height: "100%",
                    justifyContent: "center",
                    paddingHorizontal: 12,
                  }}
                >
                  <Pressable
                    onPress={() => router.push("/report" as any)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                      marginBottom: 6,
                      alignSelf: "flex-start",
                    })}
                  >
                    <Text style={{ color: "white", fontSize: 13 }}>📢 Add New Report</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => toggleFavorite(bar.name)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                      marginBottom: 6,
                      alignSelf: "flex-start",
                    })}
                  >
                    <Text style={{ color: "white", fontSize: 13 }}>
                      {isFavorite ? "❌ Remove Favorite" : "⭐ Favorite This Bar"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push(bar.route as any)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                      alignSelf: "flex-start",
                    })}
                  >
                    <Text style={{ color: "white", fontSize: 13 }}>📍 View This Bar</Text>
                  </Pressable>
                </View>
              </FlipCard>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
