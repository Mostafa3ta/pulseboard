import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KpiTile } from './kpi-tile'

describe('KpiTile', () => {
  it('shows the label, the value and a signed change against the comparison period', () => {
    render(<KpiTile label="Revenue" value="$1.2M" exact="$1,234,567" delta={0.042} comparison="vs 5 May – 2 Aug 2026" />)
    expect(screen.getByRole('article', { name: 'Revenue' })).toBeInTheDocument()
    expect(screen.getByText('$1.2M')).toHaveAttribute('title', '$1,234,567')
    expect(screen.getByText('+4.2%')).toBeInTheDocument()
    expect(screen.getByText('vs 5 May – 2 Aug 2026')).toBeInTheDocument()
    expect(screen.getByText('+4.2%').closest('p')).toHaveClass('text-up')
  })

  it('colours a fall as bad by default, and as good when a rise would be bad news', () => {
    const { rerender } = render(<KpiTile label="Orders" value="1,204" delta={-0.018} comparison="vs last week" />)
    expect(screen.getByText('−1.8%').closest('p')).toHaveClass('text-down')
    rerender(<KpiTile label="Refund rate" value="6.1%" delta={-0.018} comparison="vs last week" upIsGood={false} />)
    expect(screen.getByText('−1.8%').closest('p')).toHaveClass('text-up')
  })

  it('treats no movement as neutral and says when there is nothing to compare with', () => {
    const { rerender } = render(<KpiTile label="Orders" value="1,204" delta={0} comparison="vs last week" />)
    expect(screen.getByText('0%').closest('p')).toHaveClass('text-muted-foreground')
    rerender(<KpiTile label="Orders" value="1,204" delta={null} comparison={null} />)
    expect(screen.getByText('No earlier period to compare')).toBeInTheDocument()
  })
})
