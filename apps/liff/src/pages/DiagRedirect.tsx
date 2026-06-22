import { useEffect, useState } from 'react';
import { getLineUserId } from '../lib/liff-auth.js';

export default function DiagRedirect() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const lineUserId = getLineUserId();
      if (!lineUserId) {
        throw new Error('LINE ユーザーIDが取得できませんでした。');
      }
      
      // バージョンパラメータ（キャッシュ回避用）: YYMMDD形式
      const now = new Date();
      const y = String(now.getFullYear()).slice(-2);
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const v = `${y}${m}${d}01`;

      const targetUrl = new URL('https://loopheart.jp/diag/index.html');
      targetUrl.searchParams.set('token', 'hapreb2026diag');
      targetUrl.searchParams.set('lineUserId', lineUserId);
      targetUrl.searchParams.set('v', v);

      window.location.replace(targetUrl.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p className="font-bold">エラーが発生しました</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-gray-500">
      <p>診断ページへ移動しています...</p>
    </div>
  );
}
