// The dataset's shape and vocabulary. Regions and categories are fixed, ordered lists:
// the order decides chart colours and legend order, so it never changes at runtime.

export const REGIONS = ['na', 'eu', 'mea', 'apac'] as const
export type Region = (typeof REGIONS)[number]
export const REGION_LABELS: Record<Region, string> = {
  na: 'North America',
  eu: 'Europe',
  mea: 'Middle East & Africa',
  apac: 'Asia-Pacific',
}

export const CATEGORIES = ['apparel', 'electronics', 'home', 'beauty'] as const
export type Category = (typeof CATEGORIES)[number]
export const CATEGORY_LABELS: Record<Category, string> = {
  apparel: 'Apparel',
  electronics: 'Electronics',
  home: 'Home & Living',
  beauty: 'Beauty',
}

export interface Order {
  id: string
  /** Calendar date of the order, ISO `yyyy-MM-dd`. */
  date: string
  /** Hour of the day the order was placed in the customer's local time, 0–23. */
  hour: number
  region: Region
  category: Category
  /** Order value in USD. */
  amount: number
  refunded: boolean
}

export const isRegion = (value: string): value is Region => (REGIONS as readonly string[]).includes(value)
export const isCategory = (value: string): value is Category => (CATEGORIES as readonly string[]).includes(value)
