import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
export function Modal({ title, children, onClose, dismissible=true }: { title: string; children: React.ReactNode; onClose: () => void; dismissible?: boolean }) {
  const closeRef=useRef(onClose)
  const dragStart=useRef<{y:number;time:number}|null>(null)
  const [closing,setClosing]=useState(false),[dragY,setDragY]=useState(0),[dragging,setDragging]=useState(false)
  useEffect(()=>{closeRef.current=onClose},[onClose])
  const requestClose=useCallback(()=>{if(dismissible&&!closing)setClosing(true)},[dismissible,closing])
  useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';const close=(event:KeyboardEvent)=>event.key==='Escape'&&requestClose();window.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',close)}},[requestClose])
  useEffect(()=>{if(!closing)return;const timer=window.setTimeout(()=>closeRef.current(),220);return()=>window.clearTimeout(timer)},[closing])
  const startDrag=(event:React.PointerEvent)=>{if(!dismissible)return;dragStart.current={y:event.clientY,time:performance.now()};setDragging(true);event.currentTarget.setPointerCapture(event.pointerId)}
  const moveDrag=(event:React.PointerEvent)=>{if(!dragStart.current)return;setDragY(Math.max(0,event.clientY-dragStart.current.y))}
  const endDrag=(event:React.PointerEvent)=>{if(!dragStart.current)return;const distance=Math.max(0,event.clientY-dragStart.current.y),elapsed=Math.max(performance.now()-dragStart.current.time,1),velocity=distance/elapsed;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);dragStart.current=null;setDragging(false);if(distance>96||velocity>.65)requestClose();else setDragY(0)}
  return <div className={`modal-backdrop ${closing?'closing':''}`} onMouseDown={e => e.target === e.currentTarget && requestClose()}><div className={`modal-sheet ${dragging?'dragging':''}`} style={{'--sheet-drag':`${dragY}px`} as React.CSSProperties} role="dialog" aria-modal="true" aria-label={title}><div className={`sheet-grabber ${dismissible?'dismissible':''}`} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><div className="sheet-handle"/></div><div className="modal-head"><h2>{title}</h2>{dismissible&&<button type="button" className="icon-button" onClick={requestClose} aria-label="关闭"><X size={20}/></button>}</div><div className="modal-content">{children}</div></div></div>
}
