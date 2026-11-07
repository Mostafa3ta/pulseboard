import { delta, type Kpis } from '@/lib/aggregate'
import { formatInteger, formatMoney, formatMoneyCompact, formatMoneyExact, formatPercent } from '@/lib/format'
import { KpiTile } from './kpi-tile'

interface KpiRowProps {
  kpis: Kpis
  /** The same figures for the period of equal length just before, or null when the data does not reach back. */
  previous: Kpis | null
  /** "vs 5 May – 2 Aug 2026" */
  comparison: string | null
}

export function KpiRow({ kpis, previous, comparison }: KpiRowProps) {
  return (
    <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KpiTile
        label="Revenue"
        value={formatMoneyCompact(kpis.revenue)}
        exact={formatMoney(kpis.revenue)}
        delta={delta(kpis.revenue, previous?.revenue)}
        comparison={comparison}
      />
      <KpiTile label="Orders" value={formatInteger(kpis.orders)} delta={delta(kpis.orders, previous?.orders)} comparison={comparison} />
      <KpiTile
        label="Average order"
        value={formatMoneyExact(kpis.averageOrder)}
        delta={delta(kpis.averageOrder, previous?.averageOrder)}
        comparison={comparison}
      />
      <KpiTile
        label="Refund rate"
        value={formatPercent(kpis.refundRate)}
        delta={delta(kpis.refundRate, previous?.refundRate)}
        comparison={comparison}
        upIsGood={false}
      />
    </section>
  )
}
