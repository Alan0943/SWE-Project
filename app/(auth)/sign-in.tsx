import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import React from 'react'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

  const onSignInPress = async () => {
    if (!isLoaded) return

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/') // redirect to main app
      } else {
        console.error('Incomplete sign-in:', result)
      }
    } catch (err) {
      console.error('Sign-in error:', JSON.stringify(err, null, 2))
    }
  }

  return (
    <View>
      <Text>Sign In</Text>
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
      <TouchableOpacity onPress={onSignInPress}>
        <Text>Sign In</Text>
      </TouchableOpacity>
      <Link href="/(auth)/sign-in">
        <Text>Don’t have an account? Sign up</Text>
      </Link>
    </View>
  )
}
