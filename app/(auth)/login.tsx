import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { styles } from '@/styles/auth.styles';
import{useRouter} from "expo-router";
import { useSSO } from "@clerk/clerk-expo";

export default function login() {

  const {startSSOFlow}= useSSO()
  const router = useRouter();



  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({strategy: "oauth_google"})

      console.log("SSO Result:", { createdSessionId, setActive });
      

      if (setActive && createdSessionId) {
        setActive({ session: createdSessionId });
        router.replace("/(tabs)"); 
      } 
      
    } catch (error) {
      console.error("OAuth Error:", error);
    }
  };


  return (
    <View style= {styles.container}>
      
      {/* BRAND SECTION */}
      <View style= {styles.brandSection}>
        <View style = {styles.logoContainer}>
          <Image source = {require('../../assets/images/Gators.png')} style = {{width: 180, height: 180, resizeMode: 'contain'}}  />
        </View>
        <Text style = {styles.appName}>TailGator</Text>
        <Text style = {styles.tagline}>Don't Miss Out</Text>
        </View>
    {/* LOGIN SECTION */}
    <View style = {styles.loginSection}>
      <TouchableOpacity 
        style = {styles.googleButton}
        onPress={handleGoogleSignIn}
        activeOpacity={0.9}>
        <View style = {styles.googleIconContainer}>
          <Ionicons name = "logo-google" size = {20} color = {COLORS.surface} />
          </View>
          <Text style = {styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style = {styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
        </View>
    </View>

  );
}