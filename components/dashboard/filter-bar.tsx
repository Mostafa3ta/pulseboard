'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { RotateCcw } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DATA_END, DATA_START } from '@/data/range'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DEFAULT_FILTERS, PRESETS, activePreset, isDefaultFilters, isISODate, presetRange, type Filters, type PresetId } from '@/lib/filters'
import { formatDate } from '@/lib/format'
import { GRANULARITIES, isGranularity, pickGranularity, type Granularity } from '@/lib/periods'
import { CATEGORIES, CATEGORY_LABELS, REGIONS, REGION_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

// One row of controls above everything it scopes. The bar is controlled: it renders the given
// filters and reports a complete new Filters object; the dashboard decides what to do with it.

const SERIES_DOT = ['bg-series-1', 'bg-series-2', 'bg-series-3', 'bg-series-4'] as const
const GRANULARITY_LABELS: Record<Granularity, string> = { day: 'Day', week: 'Week', month: 'Month' }

interface FilterBarProps {
  filters: Filters
  onChange: (next: Filters) => void
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const preset = activePreset(filters)
  // The custom form shows for a range no preset matches (for example from a shared link) and
  // closes again when the range becomes a preset, whether through this bar or from outside.
  const [customOpen, setCustomOpen] = useState(preset === null)
  useEffect(() => {
    setCustomOpen(preset === null)
  }, [preset])

  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const autoGranularity = pickGranularity(filters.from, filters.to)

  return (
    <section aria-label="Filters" className="grid gap-3 rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <FilterGroup label="Period">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex-wrap"
            aria-label="Date range"
            value={customOpen ? 'custom' : (preset ?? '')}
            onValueChange={(value) => {
              if (!value) return
              if (value === 'custom') {
                setCustomOpen(true)
                return
              }
              setCustomOpen(false)
              update(presetRange(value as PresetId))
            }}
          >
            {PRESETS.map((p) => (
              <ToggleGroupItem key={p.id} value={p.id}>
                {p.label}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem value="custom">Custom…</ToggleGroupItem>
          </ToggleGroup>
        </FilterGroup>

        <FilterGroup label="Region">
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            className="flex-wrap"
            aria-label="Regions"
            value={filters.regions}
            onValueChange={(value) => update({ regions: REGIONS.filter((r) => value.includes(r)) })}
          >
            {REGIONS.map((region, i) => (
              <ToggleGroupItem key={region} value={region}>
                <span className={cn('size-2 rounded-full', SERIES_DOT[i])} aria-hidden />
                {REGION_LABELS[region]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterGroup>

        <FilterGroup label="Category">
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            className="flex-wrap"
            aria-label="Categories"
            value={filters.categories}
            onValueChange={(value) => update({ categories: CATEGORIES.filter((c) => value.includes(c)) })}
          >
            {CATEGORIES.map((category) => (
              <ToggleGroupItem key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterGroup>

        <FilterGroup label="Group by">
          <Select
            value={filters.granularity ?? 'auto'}
            onValueChange={(value) => update({ granularity: isGranularity(value) ? value : null })}
          >
            <SelectTrigger size="sm" className="w-40" aria-label="Group by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto ({GRANULARITY_LABELS[autoGranularity].toLowerCase()})</SelectItem>
              {GRANULARITIES.map((g) => (
                <SelectItem key={g} value={g}>
                  {GRANULARITY_LABELS[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterGroup>

        {!isDefaultFilters(filters) && (
          <Button
            variant="ghost"
            size="sm"
            className="self-end"
            onClick={() => {
              setCustomOpen(false)
              onChange(DEFAULT_FILTERS)
            }}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
        )}
      </div>

      {customOpen && <CustomRangeForm from={filters.from} to={filters.to} onApply={(range) => update(range)} />}
    </section>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

const dateField = z.string().refine(isISODate, 'Enter a date as yyyy-mm-dd')
const customRangeSchema = z
  .object({ from: dateField, to: dateField })
  .refine((v) => !isISODate(v.from) || (v.from >= DATA_START && v.from <= DATA_END), {
    path: ['from'],
    message: `Data covers ${formatDate(DATA_START)} to ${formatDate(DATA_END)}`,
  })
  .refine((v) => !isISODate(v.to) || (v.to >= DATA_START && v.to <= DATA_END), {
    path: ['to'],
    message: `Data covers ${formatDate(DATA_START)} to ${formatDate(DATA_END)}`,
  })
  .refine((v) => !isISODate(v.from) || !isISODate(v.to) || v.from <= v.to, {
    path: ['to'],
    message: 'End must be on or after start',
  })
type CustomRange = z.infer<typeof customRangeSchema>

function CustomRangeForm({ from, to, onApply }: { from: string; to: string; onApply: (range: CustomRange) => void }) {
  const id = useId()
  const form = useForm<CustomRange>({ resolver: zodResolver(customRangeSchema), defaultValues: { from, to } })
  const { errors } = form.formState
  useEffect(() => form.reset({ from, to }), [form, from, to])

  return (
    <form
      aria-label="Custom date range"
      className="flex flex-wrap items-start gap-3 border-t pt-3"
      onSubmit={form.handleSubmit((values) => onApply(values))}
      noValidate
    >
      <div className="grid gap-1">
        <Label htmlFor={`${id}-from`}>From</Label>
        <Input
          id={`${id}-from`}
          type="date"
          min={DATA_START}
          max={DATA_END}
          className="h-8 w-40"
          aria-invalid={!!errors.from}
          aria-describedby={errors.from ? `${id}-from-error` : undefined}
          {...form.register('from')}
        />
        {errors.from && (
          <p id={`${id}-from-error`} role="alert" className="text-xs text-destructive">
            {errors.from.message}
          </p>
        )}
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-to`}>To</Label>
        <Input
          id={`${id}-to`}
          type="date"
          min={DATA_START}
          max={DATA_END}
          className="h-8 w-40"
          aria-invalid={!!errors.to}
          aria-describedby={errors.to ? `${id}-to-error` : undefined}
          {...form.register('to')}
        />
        {errors.to && (
          <p id={`${id}-to-error`} role="alert" className="text-xs text-destructive">
            {errors.to.message}
          </p>
        )}
      </div>
      <Button type="submit" size="sm" className="mt-6">
        Apply
      </Button>
    </form>
  )
}
