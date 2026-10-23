import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native'
import { Calendar } from 'react-native-calendars'
import { getDateRangeError, isISODate } from '@simple-wt/shared'
import { useTheme } from '../context/ThemeContext'

interface Props {
  from: string
  to: string
  max?: string
  onChange: (from: string, to: string) => void
}

export default function DateRangePicker({ from, to, max, onChange }: Props) {
  const { colors, dark } = useTheme()
  const s = makeStyles(colors)
  const today = max ?? new Date().toISOString().slice(0, 10)

  const [picking, setPicking] = useState<'from' | 'to' | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7))
  const error = from || to ? getDateRangeError(from, to, today) : null
  const validFrom = isISODate(from) && from <= today ? from : ''
  const validTo = isISODate(to) && to <= today ? to : ''

  function openCalendar(endpoint: 'from' | 'to') {
    const date = (endpoint === 'from' ? validFrom : validTo) || validFrom || today
    setCalendarMonth(date.slice(0, 7))
    setPicking(endpoint)
  }

  const markedDates: Record<string, object> = {}
  if (picking && !getDateRangeError(from, to, today)) {
    // Only mark the visible month so long ranges do not allocate years of days.
    const monthStart = `${calendarMonth}-01`
    const cur = new Date(`${from > monthStart ? from : monthStart}T00:00:00Z`)
    const end = new Date(`${monthStart}T00:00:00Z`)
    end.setUTCMonth(end.getUTCMonth() + 1)
    end.setUTCDate(0)
    const rangeEnd = new Date(`${to}T00:00:00Z`)
    if (rangeEnd < end) end.setTime(rangeEnd.getTime())
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10)
      if (key === from && key === to) {
        markedDates[key] = { startingDay: true, endingDay: true, color: '#2563eb', textColor: '#fff' }
      } else if (key === from) {
        markedDates[key] = { startingDay: true, color: '#2563eb', textColor: '#fff' }
      } else if (key === to) {
        markedDates[key] = { endingDay: true, color: '#2563eb', textColor: '#fff' }
      } else {
        markedDates[key] = { color: dark ? '#1e3a8a' : '#dbeafe', textColor: dark ? '#bfdbfe' : '#1e40af' }
      }
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
  } else if (validFrom) {
    markedDates[from] = { startingDay: true, endingDay: true, color: '#2563eb', textColor: '#fff' }
  }

  const calTheme = {
    backgroundColor: colors.surface,
    calendarBackground: colors.surface,
    textSectionTitleColor: colors.textSecondary,
    selectedDayBackgroundColor: '#2563eb',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#2563eb',
    dayTextColor: colors.text,
    textDisabledColor: colors.border,
    dotColor: '#2563eb',
    monthTextColor: colors.text,
    textMonthFontWeight: '600' as const,
    arrowColor: '#2563eb',
  }

  function handleDayPress(day: { dateString: string }) {
    const d = day.dateString
    if (picking === 'from') {
      onChange(d, validTo && validTo >= d ? validTo : '')
    } else {
      onChange(validFrom && validFrom <= d ? validFrom : '', d)
    }
    setPicking(null)
  }

  return (
    <View>
      <View style={s.row}>
        {(['from', 'to'] as const).map(endpoint => (
          <View key={endpoint} style={s.btn}>
            <Text style={s.btnLabel}>{endpoint === 'from' ? 'Start date' : 'End date'}</Text>
            <TextInput
              accessibilityLabel={endpoint === 'from' ? 'Start date' : 'End date'}
              style={s.btnValue}
              value={endpoint === 'from' ? from : to}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              maxLength={10}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={value => onChange(endpoint === 'from' ? value : from, endpoint === 'to' ? value : to)}
            />
            <TouchableOpacity accessibilityLabel={`Open ${endpoint === 'from' ? 'start' : 'end'} date calendar`} onPress={() => openCalendar(endpoint)}>
              <Text style={s.calendarLink}>Calendar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {error && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}

      <Modal visible={picking !== null} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <Pressable style={s.overlay} onPress={() => setPicking(null)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>
                {picking === 'from' ? 'Select start date' : 'Select end date'}
              </Text>
              <TouchableOpacity onPress={() => setPicking(null)}>
                <Text style={s.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDayPress}
              maxDate={today}
              minDate={picking === 'to' ? validFrom || undefined : undefined}
              current={picking === 'from' ? (validFrom || today) : (validTo || validFrom || today)}
              onMonthChange={month => setCalendarMonth(month.dateString.slice(0, 7))}
              markingType="period"
              markedDates={markedDates}
              theme={calTheme}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    btn: {
      flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10,
    },
    btnLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    btnValue: { fontSize: 13, fontWeight: '500', color: colors.text },
    calendarLink: { color: '#2563eb', fontSize: 12, paddingVertical: 8 },
    error: { color: '#ef4444', fontSize: 12, marginBottom: 12 },
    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingBottom: 32,
    },
    sheetHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
    },
    sheetTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    sheetClose: { fontSize: 18, color: colors.textSecondary, padding: 4 },
  })
}
