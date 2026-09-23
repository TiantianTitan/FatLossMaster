import { BarChart3, CalendarDays, House, Settings2 } from 'lucide-react'
import type { Page } from '../../types/record'

export const pageIcons: Record<Page, typeof House> = { today: House, records: CalendarDays, trends: BarChart3, settings: Settings2 }
