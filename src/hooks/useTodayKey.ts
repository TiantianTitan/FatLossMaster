import { useEffect, useState } from 'react'
import { todayKey } from '../lib/date'

export const useTodayKey = () => {
  const [date,setDate]=useState(todayKey)
  useEffect(()=>{
    let timer=0
    const sync=()=>{
      setDate(todayKey())
      window.clearTimeout(timer)
      const now=new Date(),next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)
      timer=window.setTimeout(sync,Math.max(next.getTime()-now.getTime()+100,1000))
    }
    const resume=()=>{if(!document.hidden)sync()}
    sync();window.addEventListener('focus',sync);document.addEventListener('visibilitychange',resume)
    return()=>{window.clearTimeout(timer);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',resume)}
  },[])
  return date
}
