import React, { useEffect, useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from 'react-native'
import { VictoryLine, VictoryChart, VictoryAxis, VictoryScatter, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native'
import { getDateRange, formatDate, type DateFilter } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

type FilterOption = { label: string; value: DateFilter }
const FILTERS: FilterOption[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1yr', value: '1y' },
]

interface LogEntry { id: string; weight_kg: number; logged_at: string }

export default function DashboardScreen() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<DateFilter>('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    supabase
      .from('weight_logs')
      .select('id, weight_kg, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', yearAgo.toISOString().slice(0, 10))
      .order('logged_at', { ascending: true })
      .then(({ data }) => { setLogs(data ?? []); setLoading(false) })
  }, [user])

  const filtered = useMemo(() => {
    const { from, to } = getDateRange(filter)
    return logs.filter((l) => l.logged_at >= from && l.logged_at <= to)
  }, [logs, filter])

  const chartData = filtered.map((l) => ({ x: l.logged_at, y: l.weight_kg }))
  const weights = filtered.map((l) => l.weight_kg)
  const minW = weights.length ? Math.min(...weights) : 0
  const maxW = weights.length ? Math.max(...weights) : 100
  const pad = (maxW - minW) * 0.1 || 5
  const screenWidth = Dimensions.get('window').width

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dashboard</Text>

      {/* Filter buttons */}
      <View style={styles.filterRow}>
        {FILTERS.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            onPress={() => setFilter(value)}
            style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator style={{ height: 200 }} />
        ) : chartData.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No data for this period</Text>
          </View>
        ) : (
          <VictoryChart
            width={screenWidth - 48}
            height={240}
            padding={{ top: 16, bottom: 40, left: 48, right: 16 }}
            containerComponent={
              <VictoryVoronoiContainer
                voronoiDimension="x"
                labels={({ datum }) => `${datum.y} kg\n${formatDate(datum.x)}`}
                labelComponent={<VictoryTooltip flyoutStyle={{ fill: '#fff', stroke: '#e5e7eb' }} style={{ fontSize: 11 }} />}
              />
            }
          >
            <VictoryAxis
              style={{ tickLabels: { fontSize: 10, fill: '#9ca3af' }, axis: { stroke: 'none' }, grid: { stroke: '#f3f4f6' } }}
              tickFormat={(d: string) => {
                const [, m, day] = d.split('-')
                return `${day}/${m}`
              }}
              tickCount={5}
            />
            <VictoryAxis
              dependentAxis
              domain={[minW - pad, maxW + pad]}
              style={{ tickLabels: { fontSize: 10, fill: '#9ca3af' }, axis: { stroke: 'none' }, grid: { stroke: '#f3f4f6' } }}
            />
            <VictoryLine
              data={chartData}
              style={{ data: { stroke: '#2563eb', strokeWidth: 2 } }}
              interpolation="linear"
            />
            <VictoryScatter
              data={chartData}
              size={4}
              style={{ data: { fill: '#2563eb', stroke: '#fff', strokeWidth: 2 } }}
            />
          </VictoryChart>
        )}
      </View>

      {/* Stats */}
      {filtered.length > 0 && (
        <View style={styles.statsRow}>
          {[
            { label: 'Entries', value: filtered.length.toString() },
            { label: 'Min', value: `${Math.min(...weights).toFixed(1)} kg` },
            { label: 'Max', value: `${Math.max(...weights).toFixed(1)} kg` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 100 },
  heading: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff',
  },
  filterBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  filterTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16,
  },
  empty: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
})
