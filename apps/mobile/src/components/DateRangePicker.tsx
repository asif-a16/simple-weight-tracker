import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native'
import { Calendar } from 'react-native-calendars'
import { useTheme } from '../context/ThemeContext'

interface Props {
  from: string
  to: string
  max?: string
  onChange: (from: string, to: string) => void
}

function formatDisplay(dateStr: string) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`
}

export default function DateRangePicker({ from, to, max, onChange }: Props) {
  const { colors, dark } = useTheme()
  const s = makeStyles(colors)
  const today = max ?? new Date().toISOString().slice(0, 10)

  const [picking, setPicking] = useState<'from' | 'to' | null>(null)

  const markedDates: Record<string, object> = {}
  if (from && to && from <= to) {
    let cur = new Date(from)
    const end = new Date(to)
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
      cur.setDate(cur.getDate() + 1)
    }
  } else if (from) {
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
      onChange(d, to && to >= d ? to : '')
    } else {
      onChange(from && from <= d ? from : '', d)
    }
    setPicking(null)
  }

  return (
    <View style={s.row}>
      <TouchableOpacity style={s.btn} onPress={() => setPicking('from')} activeOpacity={0.7}>
        <Text style={s.btnLabel}>From</Text>
        <Text style={[s.btnValue, !from && s.btnPlaceholder]}>
          {from ? formatDisplay(from) : 'Select date'}
        </Text>
      </TouchableOpacity>

      <Text style={s.arrow}>→</Text>

      <TouchableOpacity style={s.btn} onPress={() => setPicking('to')} activeOpacity={0.7}>
        <Text style={s.btnLabel}>To</Text>
        <Text style={[s.btnValue, !to && s.btnPlaceholder]}>
          {to ? formatDisplay(to) : 'Select date'}
        </Text>
      </TouchableOpacity>

      <Modal visible={picking !== null} transparent animationType="fade">
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
              maxDate={picking === 'from' ? today : today}
              minDate={picking === 'to' ? from || undefined : undefined}
              current={picking === 'from' ? (from || today) : (to || from || today)}
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
    btnPlaceholder: { color: colors.textSecondary },
    arrow: { color: colors.textSecondary, fontSize: 16 },
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
