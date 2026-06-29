'use client'

import { useEffect, useState } from 'react'
import type { FriendScenarioStepControl, Tag } from '@line-crm/shared'
import type { FriendListItem } from '@/lib/api'
import { api } from '@/lib/api'
import FriendListRow from './friend-list-row'
import TagBadge from './tag-badge'

interface Props {
  friends: FriendListItem[]
  allTags: Tag[]
  onRefresh: () => void
}

export default function FriendListTable({ friends, allTags, onRefresh }: Props) {
  // Inline tag-management expander. The row's primary click navigates to
  // /chats; tag editing stays available here as a secondary action because
  // the chats page's FriendInfoSidebar currently only displays tags (no
  // add/remove). Without this expander operators would lose the only path
  // to mutate friend tags from the admin UI.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingTagForFriend, setAddingTagForFriend] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [scenarioStepsByFriend, setScenarioStepsByFriend] = useState<Record<string, FriendScenarioStepControl[]>>({})
  const [loadingScenarioForFriend, setLoadingScenarioForFriend] = useState<string | null>(null)
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setAddingTagForFriend(null)
    setSelectedTagId('')
    setError('')
  }

  useEffect(() => {
    if (!expandedId || scenarioStepsByFriend[expandedId]) return
    void loadScenarioSteps(expandedId)
  }, [expandedId, scenarioStepsByFriend])

  const loadScenarioSteps = async (friendId: string) => {
    setLoadingScenarioForFriend(friendId)
    setError('')
    try {
      const res = await api.friends.scenarioSteps(friendId)
      setScenarioStepsByFriend((prev) => ({ ...prev, [friendId]: res.data }))
    } catch {
      setError('\u30b7\u30ca\u30ea\u30aa\u914d\u4fe1\u8a2d\u5b9a\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f')
    } finally {
      setLoadingScenarioForFriend(null)
    }
  }

  const handleScenarioStepToggle = async (friendId: string, stepId: string, nextEnabled: boolean) => {
    setUpdatingStepId(stepId)
    setError('')
    try {
      await api.friends.updateScenarioStep(friendId, stepId, nextEnabled)
      setScenarioStepsByFriend((prev) => ({
        ...prev,
        [friendId]: (prev[friendId] || []).map((step) =>
          step.stepId === stepId ? { ...step, isEnabled: nextEnabled } : step,
        ),
      }))
    } catch {
      setError('\u30b7\u30ca\u30ea\u30aa\u914d\u4fe1\u8a2d\u5b9a\u306e\u66f4\u65b0\u306b\u5931\u6557\u3057\u307e\u3057\u305f')
    } finally {
      setUpdatingStepId(null)
    }
  }

  const handleAddTag = async (friendId: string) => {
    if (!selectedTagId) return
    setLoading(true)
    setError('')
    try {
      await api.friends.addTag(friendId, selectedTagId)
      setAddingTagForFriend(null)
      setSelectedTagId('')
      onRefresh()
    } catch {
      setError('タグの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTag = async (friendId: string, tagId: string) => {
    setLoading(true)
    setError('')
    try {
      await api.friends.removeTag(friendId, tagId)
      onRefresh()
    } catch {
      setError('タグの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (friendId: string, displayName: string | null) => {
    const name = displayName || '（名前なし）'
    if (!window.confirm(`「${name}」を削除しますか？\n\nこの操作は取り消せません。タグ・シナリオ登録も同時に削除されます。`)) return
    setDeletingId(friendId)
    setError('')
    try {
      await api.friends.delete(friendId)
      onRefresh()
    } catch {
      setError('削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  if (friends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">友だちが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Header sits inside the same overflow container as the body so the
          column labels stay aligned with their values when the user scrolls
          horizontally on narrower viewports (e.g. desktop with sidebar open
          and the body forced to min-w-[900px]). */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="hidden lg:grid grid-cols-[80px_220px_120px_1fr_280px] gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <div>対応マーク</div>
            <div>名前</div>
            <div>シナリオ</div>
            <div>受信メッセージ</div>
            <div>★つきタグ・友だち情報</div>
          </div>
          {friends.map((friend) => {
            const isExpanded = expandedId === friend.id
            const isAddingTag = addingTagForFriend === friend.id
            const availableTags = allTags.filter(
              (t) => !friend.tags.some((ft) => ft.id === t.id),
            )

            return (
              <div key={friend.id}>
                <FriendListRow
                  friend={friend}
                  onTagEditClick={() => toggleExpand(friend.id)}
                />

                {isExpanded && (
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">LINE ユーザーID</p>
                      <p className="text-xs text-gray-600 font-mono break-all select-all">{friend.lineUserId}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">タグ管理</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {friend.tags.map((tag) => (
                        <TagBadge
                          key={tag.id}
                          tag={tag}
                          onRemove={() => handleRemoveTag(friend.id, tag.id)}
                        />
                      ))}
                    </div>

                    {isAddingTag ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={selectedTagId}
                          onChange={(e) => setSelectedTagId(e.target.value)}
                        >
                          <option value="">タグを選択...</option>
                          {availableTags.map((tag) => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddTag(friend.id)}
                          disabled={!selectedTagId || loading}
                          className="px-3 py-1 text-xs font-medium rounded-md text-white disabled:opacity-50 transition-opacity"
                          style={{ backgroundColor: '#06C755' }}
                        >
                          追加
                        </button>
                        <button
                          onClick={() => { setAddingTagForFriend(null); setSelectedTagId('') }}
                          className="px-3 py-1 text-xs font-medium rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      availableTags.length > 0 && (
                        <button
                          onClick={() => setAddingTagForFriend(friend.id)}
                          className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          タグを追加
                        </button>
                      )
                    )}

                    {/* Scenario delivery controls */}
                    <div className="pt-3 border-t border-gray-200 mt-1">
                      <p className="text-xs font-semibold text-gray-500 mb-2">{'\u30b7\u30ca\u30ea\u30aa\u914d\u4fe1\u7ba1\u7406'}</p>
                      {loadingScenarioForFriend === friend.id ? (
                        <p className="text-xs text-gray-400">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</p>
                      ) : (scenarioStepsByFriend[friend.id]?.length ?? 0) > 0 ? (
                        <div className="space-y-2">
                          {scenarioStepsByFriend[friend.id].map((step) => (
                            <label
                              key={step.stepId}
                              className="flex items-start justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs"
                            >
                              <span className="min-w-0">
                                <span className="block font-medium text-gray-700 truncate">
                                  {step.scenarioName} / {step.stepOrder}{'\u901a\u76ee'}
                                </span>
                                <span className="block text-[11px] text-gray-400 truncate">
                                  {step.messageType === 'text' ? step.messageContent : '[' + step.messageType + ']'}
                                </span>
                              </span>
                              <span className="inline-flex flex-shrink-0 items-center gap-2 text-[11px] text-gray-600">
                                {step.isEnabled ? '\u9001\u4fe1' : '\u505c\u6b62'}
                                <input
                                  type="checkbox"
                                  checked={step.isEnabled}
                                  disabled={updatingStepId === step.stepId}
                                  onChange={(e) => handleScenarioStepToggle(friend.id, step.stepId, e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">{'\u914d\u4fe1\u4e2d\u306e\u30b7\u30ca\u30ea\u30aa\u306f\u3042\u308a\u307e\u305b\u3093'}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-200 mt-1">
                      <button
                        onClick={() => handleDelete(friend.id, friend.displayName ?? null)}
                        disabled={deletingId === friend.id}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {deletingId === friend.id ? '削除中...' : 'この友だちを削除'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

