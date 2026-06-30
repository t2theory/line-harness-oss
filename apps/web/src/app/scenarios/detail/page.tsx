'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ScenarioDetailClient from './scenario-detail-client'

function ScenarioDetailContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  if (!id) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        シナリオ ID が指定されていません
      </div>
    )
  }
  return <ScenarioDetailClient scenarioId={id} />
}

export default function ScenarioDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">読み込み中...</div>}>
      <ScenarioDetailContent />
    </Suspense>
  )
}
