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
import LogScreen from './LogScreen'

export default function HistoryScreen() {
  const { user } = useAuth()
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
    <View style={styles.container}>
      {logs.length > 0 && (
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportText}>Export CSV</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No weight entries yet.</Text>
            <Text style={styles.emptySubText}>Log your first weight to see it here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.date}>{formatDate(item.logged_at)}</Text>
              <Text style={styles.weight}>{formatWeight(item.weight_kg)}</Text>
              {item.notes ? <Text style={styles.notes} numberOfLines={1}>{item.notes}</Text> : null}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setEditEntry(item)} style={styles.editBtn}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={!!editEntry} animationType="slide" presentationStyle="pageSheet">
        {editEntry && (
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setEditEntry(null)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  exportBtn: {
    margin: 16, marginBottom: 8, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', alignItems: 'center',
  },
  exportText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  rowLeft: { flex: 1 },
  date: { fontSize: 14, fontWeight: '600', color: '#111827' },
  weight: { fontSize: 16, fontWeight: '700', color: '#2563eb', marginTop: 2 },
  notes: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  editBtn: { paddingVertical: 4 },
  editText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  deleteBtn: { paddingVertical: 4 },
  deleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  emptySubText: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  closeBtn: { padding: 16 },
  closeBtnText: { color: '#2563eb', fontSize: 16 },
})
