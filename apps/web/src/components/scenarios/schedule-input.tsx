'use client'

import type { DeliveryMode } from '@line-crm/shared'

export interface ScheduleValue {
  delayMinutes: number
  offsetDays: number
  offsetHours: number
  offsetMinutesRemainder: number
  deliveryTime: string
}

export const emptySchedule: ScheduleValue = {
  delayMinutes: 0,
  offsetDays: 0,
  offsetHours: 0,
  offsetMinutesRemainder: 0,
  deliveryTime: '09:00',
}

/**
 * elapsed mode の DB 上の offsetMinutes は 0..1439 なので、
 * UI 側では 時間+分 に分けて編集する。
 */
export function offsetMinutesFromUI(value: ScheduleValue): number {
  return value.offsetHours * 60 + value.offsetMinutesRemainder
}

export function uiFromOffsetMinutes(offsetMinutes: number | null | undefined) {
  const m = offsetMinutes ?? 0
  return { offsetHours: Math.floor(m / 60), offsetMinutesRemainder: m % 60 }
}

interface Props {
  mode: DeliveryMode
  value: ScheduleValue
  onChange: (next: ScheduleValue) => void
}

const inputCls =
  'w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

export default function ScheduleInput({ mode, value, onChange }: Props) {
  // relative モード用のローカル分解状態
  const relDays = Math.floor(value.delayMinutes / (60 * 24))
  const relHours = Math.floor((value.delayMinutes % (60 * 24)) / 60)
  const relMins = value.delayMinutes % 60

  const setRelative = (d: number, h: number, m: number, t?: string) => {
    onChange({
      ...value,
      delayMinutes: d * 24 * 60 + h * 60 + m,
      deliveryTime: t ?? value.deliveryTime,
    })
  }

  if (mode === 'relative') {
    return (
      <div className="space-y-3">
        <label className="block text-xs font-medium text-gray-600">前のステップからの待機</label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={relDays}
            onChange={(e) => setRelative(Math.max(0, Number(e.target.value) || 0), relHours, relMins)}
          />
          <span className="text-sm text-gray-700">日</span>
          <input
            type="number"
            min={0}
            max={23}
            className={inputCls}
            value={relHours}
            onChange={(e) => setRelative(relDays, Math.max(0, Math.min(23, Number(e.target.value) || 0)), relMins)}
          />
          <span className="text-sm text-gray-700">時間</span>
          <input
            type="number"
            min={0}
            max={59}
            className={inputCls}
            value={relMins}
            onChange={(e) => setRelative(relDays, relHours, Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
          />
          <span className="text-sm text-gray-700">分後</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">配信時刻</span>
          <input
            type="time"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={value.deliveryTime}
            onChange={(e) => setRelative(relDays, relHours, relMins, e.target.value)}
          />
          <span className="text-xs text-gray-400">に配信</span>
        </div>
        <p className="text-xs text-gray-400">
          合計: {(relDays * 24 * 60 + relHours * 60 + relMins).toLocaleString('ja-JP')} 分後
        </p>
      </div>
    )
  }
  if (mode === 'elapsed') {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">購読開始から</label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={value.offsetDays}
            onChange={(e) => onChange({ ...value, offsetDays: Math.max(0, Number(e.target.value) || 0) })}
          />
          <span className="text-sm text-gray-700">日</span>
          <input
            type="number"
            min={0}
            max={23}
            className={inputCls}
            value={value.offsetHours}
            onChange={(e) =>
              onChange({ ...value, offsetHours: Math.max(0, Math.min(23, Number(e.target.value) || 0)) })
            }
          />
          <span className="text-sm text-gray-700">時間</span>
          <input
            type="number"
            min={0}
            max={59}
            className={inputCls}
            value={value.offsetMinutesRemainder}
            onChange={(e) =>
              onChange({
                ...value,
                offsetMinutesRemainder: Math.max(0, Math.min(59, Number(e.target.value) || 0)),
              })
            }
          />
          <span className="text-sm text-gray-700">分後に配信</span>
        </div>
      </div>
    )
  }
  // absolute_time
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">購読開始から</label>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number"
          min={0}
          className={inputCls}
          value={value.offsetDays}
          onChange={(e) => onChange({ ...value, offsetDays: Math.max(0, Number(e.target.value) || 0) })}
        />
        <span className="text-sm text-gray-700">日後の</span>
        <input
          type="time"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={value.deliveryTime}
          onChange={(e) => onChange({ ...value, deliveryTime: e.target.value })}
        />
        <span className="text-sm text-gray-700">に配信</span>
      </div>
      <p className="text-xs text-gray-400">ⓘ cron が 5 分粒度のため最大 5 分遅れる場合があります</p>
    </div>
  )
}

/**
 * ScheduleValue → API リクエストの schedule フィールド (delivery_mode に応じて取捨選択)
 */
export function buildSchedulePayload(mode: DeliveryMode, value: ScheduleValue) {
  if (mode === 'relative') {
    return { delayMinutes: value.delayMinutes }
  }
  if (mode === 'elapsed') {
    return {
      offsetDays: value.offsetDays,
      offsetMinutes: offsetMinutesFromUI(value),
    }
  }
  return {
    offsetDays: value.offsetDays,
    deliveryTime: value.deliveryTime,
  }
}
