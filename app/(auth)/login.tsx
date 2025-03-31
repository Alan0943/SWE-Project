import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSSO, useSignIn, useSignUp } from '@clerk/clerk-expo';

import { COLORS } from '@/constants/theme';
import { styles } from '@/styles/auth.styles';

export default function Login() {
  // -- Google SSO --
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  // -- Email/Password Sign In --
  const { signIn, setActive: setSignInActive, isLoaded: signInIsLoaded } = useSignIn();

  // -- Email/Password Sign Up --
  const { signUp, setActive: setSignUpActive, isLoaded: signUpIsLoaded } = useSignUp();

  // Local states
  const [isSignUpFlow, setIsSignUpFlow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1) Handle Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('OAuth Error:', error);
    }
  };

  // 2) Handle Email/Password Flow
  const handleSubmit = async () => {
    try {
      if (!email || !password) {
        console.log('Please provide email and password');
        return;
      }

      if (isSignUpFlow) {
        // -- SIGN UP FLOW --
        if (!signUpIsLoaded) return; // wait until Clerk is loaded

        await signUp.create({
          emailAddress: email,
          password,
        });

        if (signUp.createdSessionId) {
          await setSignUpActive({ session: signUp.createdSessionId });
          router.replace('/(tabs)');
        }
      } else {
        // -- SIGN IN FLOW --
        if (!signInIsLoaded) return;

        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.createdSessionId) {
          await setSignInActive({ session: result.createdSessionId });
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Email Auth Error:', error);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: 'black' }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.container}>
        {/* BRAND SECTION */}
        <View style={styles.brandSection}>
          <View>
            <Image
              source={require('../../assets/images/TailGatorLogo.png')}
              style={{ width: 180, height: 180, resizeMode: 'contain', borderRadius: 50 }}
            />
          </View>
          <Text style={styles.appName}>TailGator</Text>
          <Text style={styles.tagline}>Don't Miss Out</Text>
        </View>

        {/* LOGIN SECTION */}
        <View style={styles.loginSection}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.9}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons name="logo-google" size={20} color={COLORS.surface} />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* -- OR SEPARATOR -- */}
          <Text style={{ marginVertical: 10, fontSize: 14, color: COLORS.grey }}>
            —— Or {isSignUpFlow ? 'Sign Up' : 'Sign In'} with email ——
          </Text>

          {/* EMAIL TEXT INPUT */}
          <TextInput
            style={styles.textInput}
            value={email}
            placeholder="Email Address"
            onChangeText={(val) => setEmail(val)}
          />

          {/* PASSWORD TEXT INPUT */}
          <TextInput
            style={styles.textInput}
            value={password}
            placeholder="Password"
            secureTextEntry
            onChangeText={(val) => setPassword(val)}
          />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isSignUpFlow ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* TOGGLE SIGN IN / SIGN UP */}
          <TouchableOpacity
            style={{ marginTop: 10 }}
            onPress={() => setIsSignUpFlow((prev) => !prev)}
          >
            <Text style={{ color: COLORS.primary }}>
              {isSignUpFlow
                ? 'Already have an account? Sign In'
                : `Don't have an account? Sign Up`}
            </Text>
          </TouchableOpacity>

          {/* TERMS TEXT */}
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
