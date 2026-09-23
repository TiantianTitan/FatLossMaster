import { X } from 'lucide-react'
export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal-sheet" role="dialog" aria-modal="true"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={20}/></button></div>{children}</div></div>
}
