import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert, ActivityIndicator, ScrollView,
} from 'react-native'
import DateRangePicker from '../../components/DateRangePicker'
import { formatDate, formatWeight, getDateRange, type WeightLog, type DateFilter } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import LogScreen from './LogScreen'

type HistoryFilter = DateFilter
const FILTERS: { label: string; value: HistoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1yr', value: '1y' },
  { label: 'Custom', value: 'custom' },
]

export default function HistoryScreen() {
  const { user } = useAuth()
  const { colors } = useTheme()
  const s = makeStyles(colors)
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editEntry, setEditEntry] = useState<WeightLog | null>(null)
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

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

  const filtered = useMemo(() => {
    if (filter === 'all') return logs
    if (filter === 'custom') {
      if (!customFrom || !customTo || customFrom > customTo) return logs
      return logs.filter(l => l.logged_at >= customFrom && l.logged_at <= customTo)
    }
    const { from, to } = getDateRange(filter)
    return logs.filter((l) => l.logged_at >= from && l.logged_at <= to)
  }, [logs, filter, customFrom, customTo])

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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />

  return (
    <View style={s.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {FILTERS.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            onPress={() => setFilter(value)}
            style={[s.filterBtn, filter === value && s.filterBtnActive]}
          >
            <Text style={[s.filterText, filter === value && s.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filter === 'custom' && (
        <View style={s.customRow}>
          <DateRangePicker
            from={customFrom}
            to={customTo}
            onChange={(f, t) => { setCustomFrom(f); setCustomTo(t) }}
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>{logs.length === 0 ? 'No weight entries yet.' : 'No entries for this period.'}</Text>
            {logs.length === 0 && <Text style={s.emptySubText}>Log your first weight to see it here.</Text>}
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

      <Modal visible={!!editEntry} animationType="slide">
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
              showHeading
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
    filterScroll: { flexGrow: 0, flexShrink: 0 },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, alignItems: 'center' },
    filterBtn: {
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    filterBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    filterText: { fontSize: 13, fontWeight: '500', color: colors.text, lineHeight: 20, includeFontPadding: false },
    customRow: { paddingHorizontal: 16, paddingBottom: 8 },
    filterTextActive: { color: '#fff' },
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
