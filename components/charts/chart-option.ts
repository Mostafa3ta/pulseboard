import type { BarSeriesOption, HeatmapSeriesOption, LineSeriesOption, PieSeriesOption } from 'echarts/charts'
import type {
  AriaComponentOption,
  DataZoomComponentOption,
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
  VisualMapComponentOption,
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'

/** The option type for exactly the chart and component modules this app registers. Anything else is a type error. */
export type ChartOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | PieSeriesOption
  | HeatmapSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | DataZoomComponentOption
  | VisualMapComponentOption
  | AriaComponentOption
>
