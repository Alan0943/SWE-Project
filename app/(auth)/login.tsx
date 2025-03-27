import { View, TextInput, Text, Image, Button } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { styles } from '@/styles/auth.styles';
import React, { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // function works after button is pressed, tries to send username / password to backend
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/', {  
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      alert(data.message); // Show received message
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('Something went wrong. Please try again.');
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
    <View style={styles.loginSection}>

    {/* Fix Login Style, add username and password text next to input boxes*/}
    <Text style = {styles.tagline}>Login</Text>

      {/* Username Label and Input */}
      <View style={styles.inputContainer}>
        <Text>Username:</Text>
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
      </View>

      {/* Password Label and Input */}
      <View style={styles.inputContainer}>
        <Text>Password:</Text>
        <TextInput
          placeholder="Password"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
      </View>

      {/* Submit Button */}
      {errorMessage && <Text style={{ color: 'red' }}>{errorMessage}</Text>}
      <Button title="Submit" onPress={handleLogin} />

        </View>
      </View>

  );
}