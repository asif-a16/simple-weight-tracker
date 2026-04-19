import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/Auth/LoginScreen'
import RegisterScreen from './src/screens/Auth/RegisterScreen'
import DashboardScreen from './src/screens/App/DashboardScreen'
import LogScreen from './src/screens/App/LogScreen'
import HistoryScreen from './src/screens/App/HistoryScreen'
import CalendarScreen from './src/screens/App/CalendarScreen'

const AuthStack = createNativeStackNavigator()
const AppTab = createBottomTabNavigator()

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  )
}

function AppNavigator() {
  return (
    <AppTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
      }}
    >
      <AppTab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <AppTab.Screen name="Log" component={LogScreen} options={{ title: 'Log Weight' }} />
      <AppTab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <AppTab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
    </AppTab.Navigator>
  )
}

function RootNavigator() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }
  return user ? <AppNavigator /> : <AuthNavigator />
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}
