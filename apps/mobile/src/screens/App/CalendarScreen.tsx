import React, { useState, useCallback } from 'react'
import { View, StyleSheet, Modal, TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Calendar } from 'react-native-calendars'
import type { WeightLog } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import LogScreen from './LogScreen'

export default function CalendarScreen() {
  const { user } = useAuth()
  const { colors, dark } = useTheme()
  const s = makeStyles(colors)
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [minDate, setMinDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [modalDate, setModalDate] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const [{ data: logData }, { data: profile }] = await Promise.all([
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at'),
      supabase.from('profiles').select('created_at').eq('id', user.id).single(),
    ])
    setLogs(logData ?? [])
    setMinDate(profile?.created_at.slice(0, 10) ?? '2020-01-01')
    setLoading(false)
  }, [user])

  useFocusEffect(fetchAll)

  const logMap = new Map(logs.map((l) => [l.logged_at, l]))

  const markedDates = Object.fromEntries(
    logs.map((l) => [
      l.logged_at,
      { marked: true, dotColor: '#2563eb', selectedColor: '#2563eb', selected: true },
    ])
  )

  const modalEntry = modalDate ? logMap.get(modalDate) : undefined

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />

  return (
    <View style={s.container}>
      <Calendar
        maxDate={today}
        minDate={minDate}
        markedDates={markedDates}
        onDayPress={(day) => {
          if (day.dateString > today) return
          setModalDate(day.dateString)
        }}
        theme={{
          calendarBackground: colors.surface,
          backgroundColor: colors.surface,
          textSectionTitleColor: colors.textSecondary,
          dayTextColor: colors.text,
          todayTextColor: '#2563eb',
          selectedDayBackgroundColor: '#2563eb',
          selectedDayTextColor: '#ffffff',
          arrowColor: '#2563eb',
          dotColor: '#2563eb',
          monthTextColor: colors.text,
          textDisabledColor: dark ? '#4B5563' : '#D1D5DB',
          textDayFontWeight: '400',
          textMonthFontWeight: '600',
        }}
      />

      <Modal visible={!!modalDate} animationType="slide">
        {modalDate && (
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setModalDate(null)}>
              <Text style={s.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
            <LogScreen
              entryId={modalEntry?.id}
              initialDate={modalDate}
              initialWeight={modalEntry?.weight_kg}
              initialNotes={modalEntry?.notes}
              onSuccess={() => { setModalDate(null); fetchAll() }}
            />
          </View>
        )}
      </Modal>
    </View>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingTop: 8 },
    closeBtn: { padding: 16 },
    closeBtnText: { color: '#2563eb', fontSize: 16 },
  })
}
