import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
export function Modal({ title, children, onClose, dismissible=true }: { title: string; children: React.ReactNode; onClose: () => void; dismissible?: boolean }) {
  const closeRef=useRef(onClose)
  useEffect(()=>{closeRef.current=onClose},[onClose])
  useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';const close=(event:KeyboardEvent)=>event.key==='Escape'&&dismissible&&closeRef.current();window.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',close)}},[dismissible])
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && dismissible && onClose()}><div className="modal-sheet" role="dialog" aria-modal="true" aria-label={title}><div className="sheet-handle"/><div className="modal-head"><h2>{title}</h2>{dismissible&&<button type="button" className="icon-button" onClick={onClose} aria-label="关闭"><X size={20}/></button>}</div>{children}</div></div>
}
