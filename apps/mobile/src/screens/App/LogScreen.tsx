import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { weightLogSchema, type WeightLogInput, sanitizeNotes } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

interface Props {
  initialDate?: string
  initialWeight?: number
  initialNotes?: string | null
  entryId?: string
  onSuccess?: () => void
  showHeading?: boolean
  weightInputRef?: React.RefObject<TextInput>
}

export default function LogScreen({ initialDate, initialWeight, initialNotes, entryId, onSuccess, showHeading = false, weightInputRef }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [serverError, setServerError] = useState<string | null>(null)
  const [weightText, setWeightText] = useState(initialWeight?.toString() ?? '')
  const { user } = useAuth()
  const { colors } = useTheme()
  const s = makeStyles(colors)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WeightLogInput>({
    resolver: zodResolver(weightLogSchema),
    defaultValues: {
      logged_at: initialDate ?? today,
      weight_kg: initialWeight ?? undefined,
      notes: initialNotes ?? '',
    },
  })

  async function onSubmit(data: WeightLogInput) {
    setServerError(null)
    const payload = {
      weight_kg: data.weight_kg,
      logged_at: data.logged_at,
      notes: sanitizeNotes(data.notes ?? null),
    }
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
    if (!entryId) reset({ logged_at: today, notes: '' })
    onSuccess?.()
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {showHeading && <Text style={s.heading}>{entryId ? 'Edit Entry' : 'Log Weight'}</Text>}

        {serverError && <Text style={s.serverError}>{serverError}</Text>}

        <Text style={s.label}>Date</Text>
        <Controller
          control={control}
          name="logged_at"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[s.input, errors.logged_at && s.inputError]}
              onChangeText={onChange}
              value={value}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              maxLength={10}
            />
          )}
        />
        {errors.logged_at && <Text style={s.fieldError}>{errors.logged_at.message}</Text>}

        <Text style={s.label}>Weight (kg)</Text>
        <Controller
          control={control}
          name="weight_kg"
          render={({ field: { onChange, value } }) => (
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

        <Text style={s.label}>Notes <Text style={s.optional}>(optional)</Text></Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[s.input, s.textarea, errors.notes && s.inputError]}
              onChangeText={onChange}
              value={value ?? ''}
              multiline
              numberOfLines={3}
              maxLength={500}
              placeholder="How are you feeling today?"
              placeholderTextColor={colors.textSecondary}
              textAlignVertical="top"
            />
          )}
        />

        <TouchableOpacity
          style={[s.btn, isSubmitting && s.btnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>{entryId ? 'Update entry' : 'Log weight'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    container: { flexGrow: 1, padding: 20 },
    heading: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 },
    optional: { color: colors.textSecondary, fontWeight: '400' },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
      backgroundColor: colors.inputBg, color: colors.text, marginBottom: 4,
    },
    textarea: { height: 80 },
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
