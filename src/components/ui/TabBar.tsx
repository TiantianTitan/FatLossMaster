import type { Page } from '../../types/record'
import { pageIcons } from './Icons'

const tabs: Array<{id: Page; label: string}> = [{id:'today',label:'今天'},{id:'records',label:'记录'},{id:'trends',label:'趋势'},{id:'settings',label:'设置'}]
export function TabBar({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  return <nav className="tabbar" aria-label="主导航">{tabs.map(tab => { const Icon = pageIcons[tab.id]; return <button key={tab.id} className={page === tab.id ? 'active' : ''} onClick={() => onChange(tab.id)}><Icon size={21} strokeWidth={page === tab.id ? 2.5 : 1.8}/><span>{tab.label}</span></button> })}</nav>
}
