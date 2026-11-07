// Colours and chrome for the canvas charts. ECharts paints on a canvas, so it cannot read CSS
// variables; these hex values are the same ones declared in app/globals.css. Two themes are
// registered with ECharts, one per surface, and the wrapper switches between them.

export type ChartMode = 'light' | 'dark'

/** The four series colours, in the fixed order used for regions everywhere. Stepped per surface. */
export const SERIES: Record<ChartMode, readonly [string, string, string, string]> = {
  light: ['#c13e2e', '#129a92', '#aa8722', '#5e57c1'],
  dark: ['#e36654', '#1ba09c', '#b78b01', '#807fde'],
}

/** One-hue ramp for magnitude (the heatmap): near the surface for "few", deep terracotta for "many". */
export const SEQUENTIAL: Record<ChartMode, readonly string[]> = {
  light: ['#fbe1dc', '#f4b1a6', '#e47d6d', '#c84435', '#942318'],
  dark: ['#402622', '#76382e', '#b1483a', '#e36654', '#f68675'],
}

export interface Chrome {
  /** Primary text and the single-series line. */
  ink: string
  /** Axis labels and secondary text. */
  muted: string
  /** Hairline gridlines. */
  grid: string
  /** Axis lines and leader lines. */
  axis: string
  /** The card the chart sits on; used for the gaps between marks. */
  surface: string
  border: string
}

export const CHROME: Record<ChartMode, Chrome> = {
  light: { ink: '#221811', muted: '#6c6158', grid: '#e2ddd5', axis: '#c3bdb3', surface: '#fffdfa', border: '#dcd7cf' },
  dark: { ink: '#f2eee7', muted: '#989fab', grid: '#2b3342', axis: '#454d5e', surface: '#1c2435', border: '#303848' },
}

/** An ECharts theme object: series colours, text, axes, legend, tooltip and zoom slider for one surface. */
export function buildTheme(mode: ChartMode, fontFamily: string): object {
  const c = CHROME[mode]
  const axis = {
    axisLine: { show: true, lineStyle: { color: c.axis, width: 1 } },
    axisTick: { show: false },
    axisLabel: { color: c.muted, fontSize: 11 },
    splitLine: { show: true, lineStyle: { color: c.grid, width: 1, type: 'solid' } },
    splitArea: { show: false },
    nameTextStyle: { color: c.muted },
  }
  return {
    color: [...SERIES[mode]],
    backgroundColor: 'transparent',
    textStyle: { color: c.muted, fontFamily },
    legend: {
      textStyle: { color: c.ink, fontSize: 12 },
      inactiveColor: c.axis,
      pageTextStyle: { color: c.muted },
    },
    tooltip: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: c.ink, fontSize: 12 },
      extraCssText: 'box-shadow: 0 8px 24px rgb(0 0 0 / 0.12); border-radius: 8px;',
      axisPointer: { lineStyle: { color: c.axis }, crossStyle: { color: c.axis } },
    },
    categoryAxis: axis,
    valueAxis: axis,
    timeAxis: axis,
    logAxis: axis,
    dataZoom: {
      borderColor: c.border,
      borderRadius: 4,
      textStyle: { color: c.muted },
      fillerColor: mode === 'light' ? 'rgba(34, 24, 17, 0.06)' : 'rgba(242, 238, 231, 0.08)',
      dataBackground: { lineStyle: { color: c.axis, width: 1 }, areaStyle: { color: c.grid, opacity: 1 } },
      selectedDataBackground: { lineStyle: { color: c.muted, width: 1 }, areaStyle: { color: c.axis, opacity: 0.6 } },
      handleStyle: { color: c.surface, borderColor: c.muted },
      moveHandleStyle: { color: c.axis },
      emphasis: { handleStyle: { borderColor: c.ink }, moveHandleStyle: { color: c.muted } },
      brushStyle: { color: 'transparent' },
    },
    visualMap: { textStyle: { color: c.muted, fontSize: 11 } },
    line: { lineStyle: { width: 2 }, symbolSize: 8, symbol: 'circle', smooth: false },
    bar: { itemStyle: { borderWidth: 0 } },
    pie: { itemStyle: { borderColor: c.surface, borderWidth: 2 } },
    heatmap: { itemStyle: { borderColor: c.surface, borderWidth: 2 } },
  }
}

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch)

export interface TooltipRow {
  label: string
  value: string
  /** Series colour shown as a short line key beside the label. */
  swatch?: string
}

/** Tooltip markup shared by every chart: a title, then "label … value" rows with the value emphasised. */
export function tooltipHtml(title: string, rows: readonly TooltipRow[]): string {
  const items = rows
    .map(
      (row) =>
        `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px">` +
        `<span style="display:flex;align-items:center;gap:6px;opacity:.8">` +
        (row.swatch ? `<span style="display:inline-block;width:10px;height:3px;border-radius:2px;background:${row.swatch}"></span>` : '') +
        `${escapeHtml(row.label)}</span>` +
        `<strong style="font-variant-numeric:tabular-nums">${escapeHtml(row.value)}</strong></div>`,
    )
    .join('')
  return `<div style="min-width:170px;font-size:12px;line-height:1.6"><div style="font-weight:600;margin-bottom:4px">${escapeHtml(title)}</div>${items}</div>`
}
