import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_FILTERS } from '@/lib/filters'
import { FilterBar } from './filter-bar'

describe('FilterBar', () => {
  it('marks the active preset and reports a new range when another is chosen', async () => {
    const onChange = vi.fn()
    render(<FilterBar filters={DEFAULT_FILTERS} onChange={onChange} />)
    expect(screen.getByRole('radio', { name: 'Last 90 days' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()

    await userEvent.click(screen.getByRole('radio', { name: 'Last 7 days' }))
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, from: '2026-10-25', to: '2026-10-31' })
  })

  it('toggles regions and categories, keeping the fixed order', async () => {
    const onChange = vi.fn()
    render(<FilterBar filters={{ ...DEFAULT_FILTERS, regions: ['apac'] }} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Asia-Pacific' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Europe' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ regions: ['eu', 'apac'] }))

    await userEvent.click(screen.getByRole('button', { name: 'Home & Living' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ categories: ['home'] }))
  })

  it('validates a custom range before applying it', async () => {
    const onChange = vi.fn()
    render(<FilterBar filters={DEFAULT_FILTERS} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Custom…' }))
    const form = screen.getByRole('form', { name: 'Custom date range' })
    expect(form).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-01' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-01-01' } })
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('End must be on or after start')
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-03-31' } })
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, from: '2026-03-01', to: '2026-03-31' })
  })

  it('rejects dates outside the dataset', async () => {
    const onChange = vi.fn()
    render(<FilterBar filters={DEFAULT_FILTERS} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Custom…' }))
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2024-01-01' } })
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Data covers 1 Nov 2025 to 31 Oct 2026')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows the custom form for a range that matches no preset, and Reset restores the defaults', async () => {
    const onChange = vi.fn()
    render(<FilterBar filters={{ ...DEFAULT_FILTERS, from: '2026-01-01', to: '2026-01-31', categories: ['beauty'] }} onChange={onChange} />)
    expect(screen.getByRole('radio', { name: 'Custom…' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('From')).toHaveValue('2026-01-01')

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onChange).toHaveBeenCalledWith(DEFAULT_FILTERS)
  })
})
