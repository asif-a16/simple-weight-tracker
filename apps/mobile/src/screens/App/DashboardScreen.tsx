import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { VictoryLine, VictoryChart, VictoryAxis, VictoryScatter, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native'
import { getDateRange, formatDate, formatWeight, type DateFilter } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

type FilterOption = { label: string; value: DateFilter }
const FILTERS: FilterOption[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1yr', value: '1y' },
]

interface LogEntry { id: string; weight_kg: number; logged_at: string }

type Props = { navigation: BottomTabNavigationProp<any> }

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth()
  const { colors, dark } = useTheme()
  const s = makeStyles(colors)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<DateFilter>('30d')
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
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
  }, [user]))

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
  const gridColor = dark ? '#374151' : '#f3f4f6'
  const tickColor = dark ? '#9CA3AF' : '#9ca3af'

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Dashboard</Text>

      <TouchableOpacity style={s.logBtn} onPress={() => navigation.navigate('Log')} activeOpacity={0.85}>
        <Text style={s.logBtnText}>+ Log Weight</Text>
      </TouchableOpacity>

      <View style={s.filterRow}>
        {FILTERS.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            onPress={() => setFilter(value)}
            style={[s.filterBtn, filter === value && s.filterBtnActive]}
          >
            <Text style={[s.filterText, filter === value && s.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.card}>
        {loading ? (
          <ActivityIndicator style={{ height: 200 }} />
        ) : chartData.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No data for this period</Text>
          </View>
        ) : (
          <VictoryChart
            width={screenWidth - 48}
            height={240}
            padding={{ top: 16, bottom: 40, left: 48, right: 16 }}
            containerComponent={
              <VictoryVoronoiContainer
                voronoiDimension="x"
                labels={({ datum }) => `${formatWeight(datum.y)}\n${formatDate(datum.x)}`}
                labelComponent={
                  <VictoryTooltip
                    flyoutStyle={{ fill: colors.surface, stroke: colors.border }}
                    style={{ fontSize: 11, fill: colors.text }}
                  />
                }
              />
            }
          >
            <VictoryAxis
              style={{ tickLabels: { fontSize: 10, fill: tickColor }, axis: { stroke: 'none' }, grid: { stroke: gridColor } }}
              tickFormat={(d: string) => {
                const [, m, day] = d.split('-')
                return `${day}/${m}`
              }}
              tickCount={5}
            />
            <VictoryAxis
              dependentAxis
              domain={[minW - pad, maxW + pad]}
              style={{ tickLabels: { fontSize: 10, fill: tickColor }, axis: { stroke: 'none' }, grid: { stroke: gridColor } }}
            />
            <VictoryLine
              data={chartData}
              style={{ data: { stroke: '#2563eb', strokeWidth: 2 } }}
              interpolation="linear"
            />
            <VictoryScatter
              data={chartData}
              size={4}
              style={{ data: { fill: '#2563eb', stroke: colors.surface, strokeWidth: 2 } }}
            />
          </VictoryChart>
        )}
      </View>

      {filtered.length > 0 && (
        <View style={s.statsRow}>
          {[
            { label: 'Entries', value: filtered.length.toString() },
            { label: 'Min', value: formatWeight(Math.min(...weights)) },
            { label: 'Max', value: formatWeight(Math.max(...weights)) },
          ].map(({ label, value }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statValue}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 100 },
    heading: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
    logBtn: {
      backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 18,
      alignItems: 'center', marginBottom: 20,
      shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    logBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    filterBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    filterBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    filterText: { fontSize: 13, fontWeight: '500', color: colors.text },
    filterTextActive: { color: '#fff' },
    card: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16,
    },
    empty: { height: 200, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: colors.textSecondary, fontSize: 15 },
    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  })
}
