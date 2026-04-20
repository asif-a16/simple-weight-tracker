import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/Auth/LoginScreen'
import RegisterScreen from './src/screens/Auth/RegisterScreen'
import DashboardScreen from './src/screens/App/DashboardScreen'
import HistoryScreen from './src/screens/App/HistoryScreen'
import CalendarScreen from './src/screens/App/CalendarScreen'
import SettingsScreen from './src/screens/App/SettingsScreen'

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
  const { colors, dark } = useTheme()
  return (
    <AppTab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: dark ? '#6B7280' : '#9ca3af',
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['home', 'home-outline'],
            History: ['list', 'list-outline'],
            Calendar: ['calendar', 'calendar-outline'],
            Settings: ['settings', 'settings-outline'],
          }
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline']
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />
        },
      })}
    >
      <AppTab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <AppTab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <AppTab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
      <AppTab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </AppTab.Navigator>
  )
}

function RootNavigator() {
  const { user, loading } = useAuth()
  const { colors } = useTheme()
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }
  return user ? <AppNavigator /> : <AuthNavigator />
}

function AppContent() {
  const { dark } = useTheme()
  return (
    <NavigationContainer>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
