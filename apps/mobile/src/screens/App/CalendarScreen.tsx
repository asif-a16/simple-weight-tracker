import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, Modal, TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { Calendar } from 'react-native-calendars'
import type { WeightLog } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import LogScreen from './LogScreen'

export default function CalendarScreen() {
  const { user } = useAuth()
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

  useEffect(() => { fetchAll() }, [fetchAll])

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
    <View style={styles.container}>
      <Calendar
        maxDate={today}
        minDate={minDate}
        markedDates={markedDates}
        onDayPress={(day) => {
          if (day.dateString > today) return
          setModalDate(day.dateString)
        }}
        theme={{
          todayTextColor: '#2563eb',
          selectedDayBackgroundColor: '#2563eb',
          arrowColor: '#2563eb',
          dotColor: '#2563eb',
        }}
      />

      <Modal visible={!!modalDate} animationType="slide" presentationStyle="pageSheet">
        {modalDate && (
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalDate(null)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 8 },
  closeBtn: { padding: 16 },
  closeBtnText: { color: '#2563eb', fontSize: 16 },
})
