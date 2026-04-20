import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Modal, Pressable,
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { weightLogSchema, type WeightLogInput } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

interface Props {
  initialDate?: string
  initialWeight?: number
  entryId?: string
  onSuccess?: () => void
  showHeading?: boolean
  compact?: boolean
  weightInputRef?: React.RefObject<TextInput>
}

export default function LogScreen({ initialDate, initialWeight, entryId, onSuccess, showHeading = false, compact = false, weightInputRef }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [serverError, setServerError] = useState<string | null>(null)
  const [weightText, setWeightText] = useState(initialWeight?.toString() ?? '')
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const { user } = useAuth()
  const { colors } = useTheme()
  const s = makeStyles(colors)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WeightLogInput>({
    resolver: zodResolver(weightLogSchema),
    defaultValues: {
      logged_at: initialDate ?? today,
      weight_kg: initialWeight ?? undefined,
    },
  })

  async function onSubmit(data: WeightLogInput) {
    setServerError(null)
    const payload = { weight_kg: data.weight_kg, logged_at: data.logged_at }
    let error
    if (entryId) {
      ;({ error } = await supabase.from('weight_logs').update(payload).eq('id', entryId))
    } else {
      ;({ error } = await supabase.from('weight_logs').insert({ ...payload, user_id: user!.id }))
    }
    if (error) {
      if (error.code === '23505') {
        setServerError('You already have an entry for this date. Edit it from History.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
      return
    }
    Alert.alert('Success', entryId ? 'Entry updated!' : 'Weight logged!')
    if (!entryId) {
      reset({ logged_at: today })
      setWeightText('')
    }
    onSuccess?.()
  }

  const fields = (
    <View style={compact ? s.compactContainer : s.container}>
      {showHeading && <Text style={s.heading}>{entryId ? 'Edit Entry' : 'Log Weight'}</Text>}

      {serverError && <Text style={s.serverError}>{serverError}</Text>}

      <Text style={s.label}>Date</Text>
      <Controller
        control={control}
        name="logged_at"
        render={({ field: { onChange, value } }) => {
          const display = value
            ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Select date'
          return (
            <>
              <TouchableOpacity
                style={[s.input, s.dateBtn, errors.logged_at && s.inputError]}
                onPress={() => setDatePickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={[s.dateBtnText, !value && { color: colors.textSecondary }]}>{display}</Text>
                <Text style={s.dateChevron}>▾</Text>
              </TouchableOpacity>
              <Modal visible={datePickerOpen} transparent animationType="fade" onRequestClose={() => setDatePickerOpen(false)}>
                <Pressable style={s.dateOverlay} onPress={() => setDatePickerOpen(false)}>
                  <Pressable style={s.dateCard} onPress={() => {}}>
                    <Calendar
                      current={value || today}
                      maxDate={today}
                      markedDates={value ? { [value]: { selected: true, selectedColor: '#2563eb' } } : {}}
                      onDayPress={(day) => { onChange(day.dateString); setDatePickerOpen(false) }}
                      theme={{
                        calendarBackground: colors.surface,
                        backgroundColor: colors.surface,
                        textSectionTitleColor: colors.textSecondary,
                        dayTextColor: colors.text,
                        todayTextColor: '#2563eb',
                        selectedDayBackgroundColor: '#2563eb',
                        selectedDayTextColor: '#fff',
                        arrowColor: '#2563eb',
                        monthTextColor: colors.text,
                        textMonthFontWeight: '600',
                        textDisabledColor: colors.border,
                      }}
                    />
                  </Pressable>
                </Pressable>
              </Modal>
            </>
          )
        }}
      />
      {errors.logged_at && <Text style={s.fieldError}>{errors.logged_at.message}</Text>}

      <Text style={s.label}>Weight (kg)</Text>
      <Controller
        control={control}
        name="weight_kg"
        render={({ field: { onChange } }) => (
          <TextInput
            ref={weightInputRef}
            style={[s.input, errors.weight_kg && s.inputError]}
            onChangeText={(t) => {
              setWeightText(t)
              const n = parseFloat(t)
              onChange(t === '' ? undefined : isNaN(n) ? undefined : n)
            }}
            value={weightText}
            keyboardType="decimal-pad"
            placeholder="e.g. 75.5"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />
      {errors.weight_kg && <Text style={s.fieldError}>{errors.weight_kg.message}</Text>}

      <TouchableOpacity
        style={[s.btn, isSubmitting && s.btnDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>{entryId ? 'Update entry' : 'Log weight'}</Text>}
      </TouchableOpacity>
    </View>
  )

  if (compact) return fields

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {fields}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    container: { flexGrow: 1, padding: 20 },
    compactContainer: { padding: 20 },
    heading: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
      backgroundColor: colors.inputBg, color: colors.text, marginBottom: 4,
    },
    dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateBtnText: { fontSize: 16, color: colors.text },
    dateChevron: { fontSize: 14, color: colors.textSecondary },
    dateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
    dateCard: { backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' },
    inputError: { borderColor: '#ef4444' },
    fieldError: { fontSize: 13, color: '#ef4444', marginBottom: 12 },
    serverError: {
      backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1,
      borderRadius: 8, padding: 12, color: '#dc2626', fontSize: 14, marginBottom: 16,
    },
    btn: {
      backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 14,
      alignItems: 'center', marginTop: 16,
    },
    btnDisabled: { backgroundColor: '#93c5fd' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  })
}
