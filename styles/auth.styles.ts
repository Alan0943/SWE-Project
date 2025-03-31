// styles/auth.styles.ts
import { COLORS } from "@/constants/theme";
import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  brandSection: {
    alignItems: "center",
    marginTop: height * 0.12,
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 18,
    backgroundColor: "#3B82F6", 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  
  appName: {
    fontSize: 42,
    fontWeight: "100",
    fontFamily: 'Menlo-Regular',
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    marginTop:40,
    fontSize: 16,
    color: COLORS.grey,
    letterSpacing: 10,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  illustration: {
    width: width * 0.75,
    height: width * 0.75,
    maxHeight: 280,
  },
  loginSection: {
    marginTop: 30,
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 0,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.grey,
    maxWidth: 280,
  },
  // Example snippet for style overrides (adjust to your taste)
textInput: {
  width: '80%',
  borderWidth: 1,
  marginVertical: 0,
  padding: 15,
  borderColor: '#CCC',
  color: '#fff',
  borderRadius: 8,
  marginBottom: 10,
  
},
submitButton: {
  backgroundColor: '#000', // or your chosen color
  paddingVertical: 1,
  paddingHorizontal: 20,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 1,
},
submitButtonText: {
  color: '#fff',
  fontWeight: '600',
},

});