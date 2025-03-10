import { View, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import {Ionicons} from "@expo/vector-icons";
import { COLORS } from '@/constants/theme';
export default function TabLayout() {
  return (
    <Tabs
        screenOptions={{
            tabBarShowLabel: false,
        }}
    
    
    >
        <Tabs.Screen
            name='index'
                options={{
                    tabBarIcon: ({size,color}) => <Ionicons name = "home" size={size} color={color} />,
                }} />

            <Tabs.Screen
            name='bookmarks'
            options={{
                tabBarIcon: ({size,color}) => <Ionicons name = "bookmark" size={size} color={color} />,
            }} />

            <Tabs.Screen
            name='create' 
            options={{
                tabBarIcon: ({size,color}) => <Ionicons name = "add-circle" size={size} color={color} />,
            }}/>

            <Tabs.Screen
            name='notifications'
            options={{
                tabBarIcon: ({size,color}) => <Ionicons name = "heart" size={size} color={COLORS.red} />,
            }} />

            <Tabs.Screen
            name='profile'
            options={{
                tabBarIcon: ({size,color}) => <Ionicons name = "person-circle" size={size} color={color} />,
            }} />

            


    </Tabs>
  );
}