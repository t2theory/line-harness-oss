import liff from '@line/liff';

let _liffId: string | null = null;
let _lineUserId: string | null = null;
let _idToken: string | null = null;

const DEFAULT_LIFF_ID = import.meta.env.VITE_DEFAULT_LIFF_ID ?? '2010454210-ewqCZNtD';
const LIFF_ID_STORAGE_KEY = 'line_harness_liff_id';

function rememberLiffId(liffId: string): void {
  try {
    sessionStorage.setItem(LIFF_ID_STORAGE_KEY, liffId);
    localStorage.setItem(LIFF_ID_STORAGE_KEY, liffId);
  } catch {
    // Storage can be unavailable in some in-app browsers. The in-memory value is enough for this load.
  }
}

function getRememberedLiffId(): string | null {
  try {
    return sessionStorage.getItem(LIFF_ID_STORAGE_KEY) ?? localStorage.getItem(LIFF_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function initLiff(): Promise<void> {
  const url = new URL(window.location.href);
  const liffId = url.searchParams.get('liffId') ?? getRememberedLiffId() ?? DEFAULT_LIFF_ID;
  if (!liffId) {
    throw new Error('liffId not provided. Append ?liffId=... to the URL.');
  }
  _liffId = liffId;
  rememberLiffId(liffId);
  await liff.init({ liffId });
  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }
  const profile = await liff.getProfile();
  _lineUserId = profile.userId;
  // id_token は Worker 側で LINE Login verify API を叩いて caller を確定するために使う。
  _idToken = liff.getIDToken();
}

export function getLiffId(): string {
  if (!_liffId) throw new Error('LIFF not initialized');
  return _liffId;
}

export function getLineUserId(): string {
  if (!_lineUserId) throw new Error('LIFF not initialized');
  return _lineUserId;
}

export function getIdToken(): string {
  if (!_idToken) throw new Error('LIFF not initialized or id_token not available');
  return _idToken;
}
