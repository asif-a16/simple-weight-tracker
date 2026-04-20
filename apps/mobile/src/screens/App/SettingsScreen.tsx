import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { toCSV } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function SettingsScreen() {
  const { user } = useAuth()
  const { colors, dark, toggle } = useTheme()
  const s = makeStyles(colors)

  const [exporting, setExporting] = useState(false)
  const [name, setName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('name').eq('id', user.id).single()
      .then(({ data }) => { if (data?.name) setName(data.name) })
  }, [user])

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) { Alert.alert('Error', 'Name is required.'); return }
    if (trimmed.length > 100) { Alert.alert('Error', 'Name too long.'); return }
    setNameSaving(true)
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', user!.id)
    setNameSaving(false)
    if (error) { Alert.alert('Error', 'Failed to save. Try again.'); return }
    setName(trimmed)
    setEditingName(false)
  }

  async function handleExport() {
    if (!user) return
    setExporting(true)
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
    setExporting(false)
    if (error || !data?.length) {
      Alert.alert('Nothing to export', 'No weight entries found.')
      return
    }
    const csv = toCSV(data)
    const filename = `weight-log-${new Date().toISOString().slice(0, 10)}.csv`
    const path = FileSystem.cacheDirectory + filename
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 })
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Weight Log' })
  }

  return (
    <View style={s.container}>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>

        <View style={[s.row, s.nameRow]}>
          {editingName ? (
            <View style={s.nameEditContainer}>
              <TextInput
                style={s.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                placeholderTextColor={colors.textSecondary}
              />
              <View style={s.nameEditBtns}>
                <TouchableOpacity
                  style={[s.saveBtn, nameSaving && s.saveBtnDisabled]}
                  onPress={handleSaveName}
                  disabled={nameSaving}
                  activeOpacity={0.7}
                >
                  {nameSaving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.saveBtnText}>Save</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => setEditingName(false)}
                  activeOpacity={0.7}
                >
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={s.rowLabel}>Name</Text>
              <View style={s.nameValueRow}>
                <Text style={s.rowValue} numberOfLines={1}>{name}</Text>
                <TouchableOpacity
                  onPress={() => { setNameInput(name); setEditingName(true) }}
                  activeOpacity={0.7}
                  style={s.editNameBtn}
                >
                  <Text style={s.editNameText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={s.row}>
          <Text style={s.rowLabel}>Signed in as</Text>
          <Text style={s.rowValue} numberOfLines={1}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={s.row} onPress={() => supabase.auth.signOut()} activeOpacity={0.7}>
          <Text style={[s.rowLabel, s.danger]}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Appearance</Text>
        <TouchableOpacity style={s.row} onPress={toggle} activeOpacity={0.7}>
          <Text style={s.rowLabel}>Dark mode</Text>
          <Text style={s.rowValue}>{dark ? 'On' : 'Off'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Data</Text>
        <TouchableOpacity style={s.row} onPress={handleExport} disabled={exporting} activeOpacity={0.7}>
          <Text style={s.rowLabel}>Export CSV</Text>
          {exporting
            ? <ActivityIndicator size="small" color="#2563eb" />
            : <Text style={s.rowChevron}>›</Text>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
    section: {
      backgroundColor: colors.surface, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 12, fontWeight: '600', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.6,
      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
    },
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      borderTopWidth: 1, borderTopColor: colors.divider,
    },
    nameRow: { flexDirection: 'column', alignItems: 'stretch' },
    nameEditContainer: { width: '100%', gap: 10 },
    nameInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
      backgroundColor: colors.inputBg, color: colors.text,
    },
    nameEditBtns: { flexDirection: 'row', gap: 8 },
    saveBtn: {
      flex: 1, backgroundColor: '#2563eb', borderRadius: 8,
      paddingVertical: 10, alignItems: 'center',
    },
    saveBtnDisabled: { backgroundColor: '#93c5fd' },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    cancelBtn: {
      flex: 1, borderRadius: 8, paddingVertical: 10,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    cancelBtnText: { color: colors.text, fontSize: 14 },
    nameValueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    editNameBtn: { paddingVertical: 2 },
    editNameText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
    rowLabel: { fontSize: 15, color: colors.text },
    rowValue: { fontSize: 15, color: colors.textSecondary, maxWidth: '55%', textAlign: 'right' },
    rowChevron: { fontSize: 20, color: colors.textSecondary, lineHeight: 22 },
    danger: { color: '#ef4444' },
  })
}
