import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { loginSchema, type LoginInput } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'

type Props = { navigation: NativeStackNavigationProp<any> }

export default function LoginScreen({ navigation }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { colors } = useTheme()
  const s = makeStyles(colors)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) setServerError('Invalid email or password.')
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Weight Tracker</Text>
        <Text style={s.subtitle}>Sign in to your account</Text>

        {serverError && <Text style={s.serverError}>{serverError}</Text>}

        <Text style={s.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[s.input, errors.email && s.inputError]}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {errors.email && <Text style={s.fieldError}>{errors.email.message}</Text>}

        <Text style={s.label}>Password</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[s.input, errors.password && s.inputError]}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {errors.password && <Text style={s.fieldError}>{errors.password.message}</Text>}

        <TouchableOpacity
          style={[s.btn, isSubmitting && s.btnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Sign in</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.linkRow}>
          <Text style={s.linkText}>Don't have an account? <Text style={s.link}>Create one</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 4 },
    subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 32 },
    label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
      backgroundColor: colors.inputBg, color: colors.text, marginBottom: 4,
    },
    inputError: { borderColor: '#ef4444' },
    fieldError: { fontSize: 13, color: '#ef4444', marginBottom: 12 },
    serverError: {
      backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1,
      borderRadius: 8, padding: 12, color: '#dc2626', fontSize: 14, marginBottom: 16,
    },
    btn: {
      backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 14,
      alignItems: 'center', marginTop: 8,
    },
    btnDisabled: { backgroundColor: '#93c5fd' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    linkRow: { marginTop: 20, alignItems: 'center' },
    linkText: { fontSize: 14, color: colors.textSecondary },
    link: { color: '#2563eb', fontWeight: '600' },
  })
}
