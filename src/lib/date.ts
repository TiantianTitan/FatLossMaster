import { format, isToday, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export const todayKey = () => format(new Date(), 'yyyy-MM-dd')
export const displayDate = (date: string) => format(parseISO(date), 'M月d日 EEEE', { locale: zhCN })
export const fullDisplayDate = (date: string) => format(parseISO(date), 'yyyy年M月d日', { locale: zhCN })
export const relativeDateTitle = (date: string) => isToday(parseISO(date)) ? '今天' : format(parseISO(date), 'M月d日', { locale: zhCN })
