'use client'

import { BarChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts'
import {
  AriaComponent,
  DataZoomSliderComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapContinuousComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useRef } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { ChartOption } from './chart-option'
import { buildTheme, type ChartMode } from './chart-theme'

// Only the pieces the four charts use are bundled. Adding a chart type means adding it here.
echarts.use([
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomSliderComponent,
  VisualMapContinuousComponent,
  AriaComponent,
  CanvasRenderer,
])

let themesRegistered = false
function registerThemes(fontFamily: string) {
  if (themesRegistered) return
  echarts.registerTheme('pulse-light', buildTheme('light', fontFamily))
  echarts.registerTheme('pulse-dark', buildTheme('dark', fontFamily))
  themesRegistered = true
}

export interface ChartProps {
  option: ChartOption
  mode: ChartMode
  /** One sentence for assistive technology: what the chart shows. */
  description: string
  className?: string
}

/**
 * The one place ECharts is touched. Owns the instance for the life of the element, resizes
 * with its container, switches theme when the app does, and turns animation off for people
 * who asked for reduced motion. Everything else is an option object built by a pure function.
 */
export function Chart({ option, mode, description, className }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const appliedTheme = useRef<ChartMode | null>(null)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  // The latest props, readable from the deferred initialiser without re-running it.
  const latest = useRef({ option, mode, description, reduceMotion })
  latest.current = { option, mode, description, reduceMotion }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let chart: echarts.ECharts | null = null
    const observer = new ResizeObserver(() => chart?.resize())
    // Each chart initialises in its own task, so four charts never block the main thread as one long job.
    const timer = window.setTimeout(() => {
      registerThemes(getComputedStyle(el).fontFamily)
      chart = echarts.init(el, `pulse-${latest.current.mode}`)
      chartRef.current = chart
      appliedTheme.current = latest.current.mode
      applyOption(chart, appliedTheme, latest.current)
      observer.observe(el)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
      chart?.dispose()
      chartRef.current = null
      appliedTheme.current = null
    }
  }, [])

  useEffect(() => {
    if (chartRef.current) applyOption(chartRef.current, appliedTheme, { option, mode, description, reduceMotion })
  }, [option, mode, reduceMotion, description])

  return <div ref={containerRef} className={className} role="img" aria-label={description} />
}

function applyOption(
  chart: echarts.ECharts,
  appliedTheme: { current: ChartMode | null },
  { option, mode, description, reduceMotion }: { option: ChartOption; mode: ChartMode; description: string; reduceMotion: boolean },
) {
  if (appliedTheme.current !== mode) {
    chart.setTheme(`pulse-${mode}`)
    appliedTheme.current = mode
  }
  // notMerge: every option is complete, so nothing from a previous layout (a legend position,
  // a zoom window) survives a filter or theme change by accident.
  chart.setOption({ ...option, animation: !reduceMotion, aria: { enabled: true, label: { description } } }, { notMerge: true })
}
