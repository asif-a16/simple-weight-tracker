import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useContext, useEffect, useState } from 'react'

export interface ThemeColors {
  bg: string
  surface: string
  text: string
  textSecondary: string
  border: string
  inputBg: string
  divider: string
}

const LIGHT: ThemeColors = {
  bg: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#D1D5DB',
  inputBg: '#FFFFFF',
  divider: '#F3F4F6',
}

const DARK: ThemeColors = {
  bg: '#181A1B',
  surface: '#1B1D1E',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  inputBg: '#181A1B',
  divider: '#374151',
}

interface ThemeContextValue {
  dark: boolean
  colors: ThemeColors
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  colors: LIGHT,
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('theme').then((val) => { if (val === 'dark') setDark(true) })
  }, [])

  function toggle() {
    setDark((prev) => {
      const next = !prev
      AsyncStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ dark, colors: dark ? DARK : LIGHT, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
