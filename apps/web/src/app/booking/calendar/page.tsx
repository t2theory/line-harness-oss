'use client'

import { useCallback, useEffect, useState } from 'react'
import Header from '@/components/layout/header'
import { bookingApi, type BookingShift, type BookingStaff, type BookingRequest } from '@/lib/api'
import { useAccount } from '@/contexts/account-context'

// タイムグリッドの設定
const START_HOUR = 9
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_HEIGHT = 60

function getDayRange(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  const startOfWeek = new Date(d.setDate(diff))
  const days = []
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(startOfWeek)
    nextDate.setDate(startOfWeek.getDate() + i)
    days.push(nextDate)
  }
  return days
}

export default function CalendarPage() {
  const { selectedAccountId } = useAccount()
  const [staffList, setStaffList] = useState<BookingStaff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [shifts, setShifts] = useState<BookingShift[]>([])
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  
  const [loading, setLoading] = useState(false)

  const days = getDayRange(currentDate)
  const fromStr = days[0].toISOString().slice(0, 10)
  const toStr = days[6].toISOString().slice(0, 10)

  // 1. スタッフ一覧の取得
  useEffect(() => {
    if (!selectedAccountId) return
    bookingApi.listStaff(selectedAccountId).then(res => {
      setStaffList(res.staff)
      if (res.staff.length > 0 && !selectedStaffId) {
        setSelectedStaffId(res.staff[0].id)
      }
    }).catch(console.error)
  }, [selectedAccountId])

  // 2. シフトと予約の取得
  const loadData = useCallback(async () => {
    if (!selectedAccountId || !selectedStaffId) return
    setLoading(true)
    try {
      const [shiftRes, bookRes] = await Promise.all([
        bookingApi.getShifts(selectedAccountId, selectedStaffId, fromStr, toStr),
        bookingApi.getBookings(selectedAccountId, selectedStaffId, fromStr, toStr)
      ])
      setShifts(shiftRes.shifts)
      setBookings(bookRes.bookings)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedAccountId, selectedStaffId, fromStr, toStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePrevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }
  const handleNextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  // 時間をピクセル位置に変換するユーティリティ
  const timeToY = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    return (h - START_HOUR + m / 60) * HOUR_HEIGHT
  }
  
  const isoToY = (isoStr: string) => {
    const d = new Date(isoStr)
    // UTC -> JST補正 (+9h)
    const jstDate = new Date(d.getTime() + 9 * 3600_000)
    const h = jstDate.getUTCHours()
    const m = jstDate.getUTCMinutes()
    return (h - START_HOUR + m / 60) * HOUR_HEIGHT
  }

  // シフト追加モーダル
  const [showAddModal, setShowAddModal] = useState(false)
  const [addDate, setAddDate] = useState('')
  const [addStart, setAddStart] = useState('10:00')
  const [addEnd, setAddEnd] = useState('19:00')

  const handleGridClick = (dateStr: string, hour: number) => {
    setAddDate(dateStr)
    setAddStart(`${hour.toString().padStart(2, '0')}:00`)
    setAddEnd(`${(hour + 1).toString().padStart(2, '0')}:00`)
    setShowAddModal(true)
  }

  const submitAddShift = async () => {
    if (!selectedAccountId || !selectedStaffId) return
    try {
      // 既存のシフトに追加する形でPUTする（バックエンドはUPSERT）
      await bookingApi.postShifts(selectedAccountId, selectedStaffId, [
        { work_date: addDate, start_time: addStart, end_time: addEnd }
      ])
      setShowAddModal(false)
      loadData()
    } catch (e) {
      alert('保存に失敗しました')
      console.error(e)
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('この受付枠を削除しますか？\n（この枠に入っている予約は削除されません）')) return
    if (!selectedAccountId || !selectedStaffId) return
    try {
      await bookingApi.deleteShift(selectedAccountId, selectedStaffId, shiftId)
      loadData()
    } catch (e) {
      alert('削除に失敗しました')
      console.error(e)
    }
  }

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Header 
        title="予約カレンダー" 
        description="スタッフごとの受付可能枠や予約状況を視覚的に管理できます。空いている部分をクリックして受付枠を追加できます。" 
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <select
            className="rounded-lg border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
          >
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.display_name}</option>
            ))}
          </select>

          <div className="flex items-center rounded-md shadow-sm">
            <button
              onClick={handlePrevWeek}
              className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
            >
              前週
            </button>
            <span className="relative inline-flex items-center bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
              {fromStr} 〜 {toStr}
            </span>
            <button
              onClick={handleNextWeek}
              className="relative inline-flex items-center rounded-r-md bg-white px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
            >
              次週
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>受付枠</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>予約あり</div>
        </div>
      </div>

      {loading && <div className="text-gray-500 animate-pulse mb-4">読み込み中...</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* ヘッダー行 */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-20 shrink-0 border-r border-gray-200"></div>
            {days.map((d, i) => {
              const dateStr = d.toISOString().slice(0, 10)
              const isToday = dateStr === new Date().toISOString().slice(0, 10)
              return (
                <div key={i} className={`flex-1 py-3 text-center border-r border-gray-200 last:border-0 ${isToday ? 'bg-blue-50/50' : ''}`}>
                  <div className={`text-xs font-medium mb-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
                    {dayLabels[i]}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* カレンダー本体 */}
          <div className="flex relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
            {/* 時間軸ラベル */}
            <div className="w-20 shrink-0 border-r border-gray-200 bg-gray-50 relative">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div key={i} className="absolute w-full text-right pr-2 text-xs text-gray-500 -translate-y-2.5" style={{ top: i * HOUR_HEIGHT }}>
                  {START_HOUR + i}:00
                </div>
              ))}
            </div>

            {/* 背景グリッド線 */}
            <div className="absolute inset-0 left-20 pointer-events-none flex flex-col">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div key={i} className="border-b border-gray-100" style={{ height: HOUR_HEIGHT }}></div>
              ))}
            </div>

            {/* 日付ごとのカラム */}
            {days.map((d, dayIndex) => {
              const dateStr = d.toISOString().slice(0, 10)
              const dayShifts = shifts.filter(s => s.work_date === dateStr)
              
              const dayBookings = bookings.filter(b => {
                const bd = new Date(b.starts_at)
                // UTCからJSTへ補正して日付文字列化
                const jstD = new Date(bd.getTime() + 9 * 3600_000)
                return jstD.toISOString().slice(0, 10) === dateStr
              })

              return (
                <div key={dayIndex} className="flex-1 relative border-r border-gray-100 last:border-0 group">
                  {/* クリック領域（空き枠追加用） */}
                  {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => (
                    <div 
                      key={hourIndex}
                      className="absolute w-full cursor-pointer hover:bg-blue-50/30 transition-colors"
                      style={{ top: hourIndex * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                      onClick={() => handleGridClick(dateStr, START_HOUR + hourIndex)}
                    ></div>
                  ))}

                  {/* 受付枠（緑ブロック） */}
                  {dayShifts.map(shift => {
                    const top = timeToY(shift.start_time)
                    const bottom = timeToY(shift.end_time)
                    return (
                      <div 
                        key={shift.id}
                        className="absolute left-1 right-1 bg-green-100 border-l-4 border-green-500 rounded-r-md p-1.5 shadow-sm group/shift hover:z-10 transition-all"
                        style={{ top, height: bottom - top }}
                      >
                        <div className="text-xs font-semibold text-green-800 flex justify-between items-start">
                          <span>{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteShift(shift.id) }}
                            className="opacity-0 group-hover/shift:opacity-100 p-1 hover:bg-green-200 rounded text-green-700"
                            title="この受付枠を削除"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                        <div className="text-[10px] text-green-600 mt-0.5">受付枠</div>
                      </div>
                    )
                  })}

                  {/* 予約（青ブロック） */}
                  {dayBookings.map(b => {
                    const top = isoToY(b.starts_at)
                    const bottom = isoToY(b.ends_at)
                    return (
                      <div 
                        key={b.id}
                        className="absolute left-2 right-2 bg-blue-100 border border-blue-300 rounded p-1.5 shadow-sm overflow-hidden z-10"
                        style={{ top, height: Math.max(bottom - top, 24) }}
                      >
                        <div className="text-xs font-semibold text-blue-900 truncate">
                          {b.friend_name || 'ゲスト'}
                        </div>
                        <div className="text-[10px] text-blue-700 truncate">
                          {b.menu_name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">受付枠の追加</h3>
            <div className="mb-4 text-sm text-gray-500">
              日付: {addDate}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
                <input 
                  type="time" 
                  value={addStart} 
                  onChange={e => setAddStart(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了時間</label>
                <input 
                  type="time" 
                  value={addEnd} 
                  onChange={e => setAddEnd(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                キャンセル
              </button>
              <button 
                onClick={submitAddShift}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
