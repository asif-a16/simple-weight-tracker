import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, TextInput,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { VictoryLine, VictoryChart, VictoryAxis, VictoryScatter, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native'
import { getDateRange, formatDate, formatWeight, type DateFilter } from '@simple-wt/shared'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

type ChartFilter = DateFilter | 'year'
const FILTERS: { label: string; value: ChartFilter }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1yr', value: '1y' },
  { label: 'Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface LogEntry { id: string; weight_kg: number; logged_at: string }

type Props = { navigation: BottomTabNavigationProp<any> }

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth()
  const { colors, dark } = useTheme()
  const s = makeStyles(colors)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<ChartFilter>('30d')
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useFocusEffect(useCallback(() => {
    if (!user) return
    supabase
      .from('weight_logs')
      .select('id, weight_kg, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true })
      .then(({ data }) => { setLogs(data ?? []); setLoading(false) })
  }, [user]))

  const earliestYear = logs.length > 0
    ? Math.min(...logs.map(l => parseInt(l.logged_at.slice(0, 4))))
    : currentYear

  const filtered = useMemo(() => {
    if (filter === 'year') {
      return logs.filter(l => l.logged_at.startsWith(`${selectedYear}`))
    }
    if (filter === 'custom') {
      if (!customFrom || !customTo || customFrom > customTo) return []
      return logs.filter(l => l.logged_at >= customFrom && l.logged_at <= customTo)
    }
    const { from, to } = getDateRange(filter as DateFilter)
    return logs.filter((l) => l.logged_at >= from && l.logged_at <= to)
  }, [logs, filter, selectedYear, customFrom, customTo])

  const chartData = filtered.map((l) => ({ x: l.logged_at, y: l.weight_kg }))
  const weights = filtered.map((l) => l.weight_kg)
  const minW = weights.length ? Math.min(...weights) : 0
  const maxW = weights.length ? Math.max(...weights) : 100
  const pad = (maxW - minW) * 0.1 || 5
  const screenWidth = Dimensions.get('window').width
  const gridColor = dark ? '#374151' : '#f3f4f6'
  const tickColor = dark ? '#9CA3AF' : '#9ca3af'

  const isYearView = filter === 'year'

  return (
    <View style={s.outer}>
    <ScrollView style={s.container} contentContainerStyle={s.content}>
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

      {filter === 'year' && (
        <View style={s.yearNav}>
          <TouchableOpacity
            onPress={() => setSelectedYear(y => y - 1)}
            disabled={selectedYear <= earliestYear}
            style={[s.yearArrow, selectedYear <= earliestYear && s.yearArrowDisabled]}
          >
            <Text style={s.yearArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.yearLabel}>{selectedYear}</Text>
          <TouchableOpacity
            onPress={() => setSelectedYear(y => y + 1)}
            disabled={selectedYear >= currentYear}
            style={[s.yearArrow, selectedYear >= currentYear && s.yearArrowDisabled]}
          >
            <Text style={s.yearArrowText}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {filter === 'custom' && (
        <View style={s.customRow}>
          <TextInput
            style={s.dateInput}
            value={customFrom}
            onChangeText={setCustomFrom}
            placeholder="From YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            maxLength={10}
          />
          <Text style={s.dateSep}>→</Text>
          <TextInput
            style={s.dateInput}
            value={customTo}
            onChangeText={setCustomTo}
            placeholder="To YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            maxLength={10}
          />
        </View>
      )}

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
                return isYearView ? MONTHS[parseInt(m) - 1] : `${day}/${m}`
              }}
              tickCount={isYearView ? 12 : 5}
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

    <View style={s.bottomBar}>
      <TouchableOpacity style={s.logBtn} onPress={() => navigation.navigate('Log')} activeOpacity={0.85}>
        <Text style={s.logBtnText}>+ Log Weight</Text>
      </TouchableOpacity>
    </View>
    </View>
  )
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    outer: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 16 },
    bottomBar: { padding: 16, paddingBottom: 24, backgroundColor: colors.bg },
    logBtn: {
      backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 18,
      alignItems: 'center',
      shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    logBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
    filterScroll: { flexGrow: 0, marginBottom: 12 },
    filterRow: { flexDirection: 'row', gap: 8 },
    filterBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    filterBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    filterText: { fontSize: 13, fontWeight: '500', color: colors.text },
    filterTextActive: { color: '#fff' },
    yearNav: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      marginBottom: 12, gap: 20,
    },
    yearArrow: { padding: 8 },
    yearArrowDisabled: { opacity: 0.25 },
    yearArrowText: { fontSize: 26, fontWeight: '600', color: '#2563eb' },
    yearLabel: { fontSize: 18, fontWeight: '700', color: colors.text, minWidth: 56, textAlign: 'center' },
    customRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    dateInput: {
      flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 8, fontSize: 13,
      color: colors.text, backgroundColor: colors.surface,
    },
    dateSep: { color: colors.textSecondary, fontSize: 14 },
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
