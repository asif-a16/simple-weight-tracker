import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
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
        <Text style={s.sectionTitle}>Data</Text>
        <TouchableOpacity style={s.row} onPress={handleExport} disabled={exporting} activeOpacity={0.7}>
          <Text style={s.rowLabel}>Export CSV</Text>
          {exporting
            ? <ActivityIndicator size="small" color="#2563eb" />
            : <Text style={s.rowChevron}>›</Text>}
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
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Signed in as</Text>
          <Text style={s.rowValue} numberOfLines={1}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={s.row} onPress={() => supabase.auth.signOut()} activeOpacity={0.7}>
          <Text style={[s.rowLabel, s.danger]}>Sign out</Text>
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
    rowLabel: { fontSize: 15, color: colors.text },
    rowValue: { fontSize: 15, color: colors.textSecondary, maxWidth: '55%', textAlign: 'right' },
    rowChevron: { fontSize: 20, color: colors.textSecondary, lineHeight: 22 },
    danger: { color: '#ef4444' },
  })
}
