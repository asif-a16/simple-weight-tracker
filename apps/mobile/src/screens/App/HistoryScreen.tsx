import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert, ActivityIndicator,
} from 'react-native'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import { formatDate, formatWeight, toCSV, type WeightLog } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import LogScreen from './LogScreen'

export default function HistoryScreen() {
  const { user } = useAuth()
  const { colors } = useTheme()
  const s = makeStyles(colors)
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editEntry, setEditEntry] = useState<WeightLog | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
    setLogs(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function handleDelete(id: string) {
    Alert.alert('Delete entry?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('weight_logs').delete().eq('id', id)
          if (error) Alert.alert('Error', 'Failed to delete entry.')
          else fetchLogs()
        },
      },
    ])
  }

  async function handleExport() {
    const csv = toCSV(logs)
    const filename = `weight-log-${new Date().toISOString().slice(0, 10)}.csv`
    const path = FileSystem.cacheDirectory + filename
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 })
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Weight Log' })
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />

  return (
    <View style={s.container}>
      {logs.length > 0 && (
        <TouchableOpacity style={s.exportBtn} onPress={handleExport}>
          <Text style={s.exportText}>Export CSV</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No weight entries yet.</Text>
            <Text style={s.emptySubText}>Log your first weight to see it here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Text style={s.date}>{formatDate(item.logged_at)}</Text>
              <Text style={s.weight}>{formatWeight(item.weight_kg)}</Text>
              {item.notes ? <Text style={s.notes} numberOfLines={1}>{item.notes}</Text> : null}
            </View>
            <View style={s.actions}>
              <TouchableOpacity onPress={() => setEditEntry(item)} style={s.editBtn}>
                <Text style={s.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
                <Text style={s.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={!!editEntry} animationType="slide" presentationStyle="pageSheet">
        {editEntry && (
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setEditEntry(null)}>
              <Text style={s.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
            <LogScreen
              entryId={editEntry.id}
              initialDate={editEntry.logged_at}
              initialWeight={editEntry.weight_kg}
              initialNotes={editEntry.notes}
              onSuccess={() => { setEditEntry(null); fetchLogs() }}
            />
          </View>
        )}
      </Modal>
    </View>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    exportBtn: {
      margin: 16, marginBottom: 8, paddingVertical: 10, borderRadius: 10,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center',
    },
    exportText: { fontSize: 14, fontWeight: '500', color: colors.text },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
    },
    rowLeft: { flex: 1 },
    date: { fontSize: 14, fontWeight: '600', color: colors.text },
    weight: { fontSize: 16, fontWeight: '700', color: '#2563eb', marginTop: 2 },
    notes: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 12 },
    editBtn: { paddingVertical: 4 },
    editText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
    deleteBtn: { paddingVertical: 4 },
    deleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
    empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 16, color: colors.textSecondary },
    emptySubText: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    closeBtn: { padding: 16 },
    closeBtnText: { color: '#2563eb', fontSize: 16 },
  })
}
