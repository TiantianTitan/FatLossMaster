export function UndoToast({ message, onUndo, undoing=false }: { message: string; onUndo: () => void; undoing?: boolean }) {
  return <div className="toast undo-toast" role="status"><span>{message}</span><button type="button" disabled={undoing} onClick={onUndo}>{undoing?'恢复中…':'撤销'}</button></div>
}
