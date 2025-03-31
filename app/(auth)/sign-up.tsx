import { useSignUp } from '@clerk/clerk-expo'
import { useRouter, Link } from 'expo-router'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import React from 'react'

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)

  const onSignUpPress = async () => {
    if (!isLoaded) return

    try {
      await signUp.create({ emailAddress, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      console.error('Sign-up error:', JSON.stringify(err, null, 2))
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/')
      } else {
        console.error('Verification not complete:', result)
      }
    } catch (err) {
      console.error('Verification error:', JSON.stringify(err, null, 2))
    }
  }

  return (
    <View>
      {pendingVerification ? (
        <>
          <Text>Verify your email</Text>
          <TextInput
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
          />
          <TouchableOpacity onPress={onVerifyPress}>
            <Text>Verify</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text>Sign Up</Text>
          <TextInput
            placeholder="Email"
            value={emailAddress}
            autoCapitalize="none"
            onChangeText={setEmailAddress}
          />
          <TextInput
            placeholder="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={onSignUpPress}>
            <Text>Continue</Text>
          </TouchableOpacity>
          <Link href="/(auth)/sign-in">
            <Text>Already have an account? Sign in</Text>
          </Link>
        </>
      )}
    </View>
  )
}
