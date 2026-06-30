// Google Calendar API client

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3';
const TIMEZONE = 'Asia/Tokyo';

export interface GoogleCalendarConfig {
  calendarId: string;
  accessToken: string;
}

export interface BusyInterval {
  start: string;
  end: string;
}

export interface CreateEventInput {
  summary: string;
  start: string;   // ISO datetime string
  end: string;     // ISO datetime string
  description?: string;
}

export class GoogleCalendarClient {
  constructor(private config: GoogleCalendarConfig) {}

  /**
   * Get busy time intervals from Google Calendar FreeBusy API.
   * Returns an array of { start, end } intervals when the calendar is busy.
   */
  async getFreeBusy(timeMin: string, timeMax: string): Promise<BusyInterval[]> {
    const url = `${GCAL_BASE}/freeBusy`;
    const body = {
      timeMin,
      timeMax,
      items: [{ id: this.config.calendarId }],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Google FreeBusy API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
    };

    const calendarData = data.calendars?.[this.config.calendarId];
    return calendarData?.busy ?? [];
  }

  /**
   * Create an event on Google Calendar.
   * Returns the created event's ID.
   */
  async createEvent(event: CreateEventInput): Promise<{ eventId: string }> {
    const url = `${GCAL_BASE}/calendars/${encodeURIComponent(this.config.calendarId)}/events`;

    const body = {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start, timeZone: TIMEZONE },
      end: { dateTime: event.end, timeZone: TIMEZONE },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Google Calendar createEvent error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as { id?: string };
    if (!data.id) {
      throw new Error('Google Calendar createEvent: response missing event id');
    }

    return { eventId: data.id };
  }

  /**
   * Delete an event from Google Calendar.
   */
  async deleteEvent(eventId: string): Promise<void> {
    const url = `${GCAL_BASE}/calendars/${encodeURIComponent(this.config.calendarId)}/events/${encodeURIComponent(eventId)}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    // 204 = success, 410 = already deleted — both are acceptable
    if (!res.ok && res.status !== 410) {
      const text = await res.text().catch(() => '');
      throw new Error(`Google Calendar deleteEvent error ${res.status}: ${text}`);
    }
  }
}


export type GoogleCalendarEnv = {
  GOOGLE_CALENDAR_CLIENT_ID?: string;
  GOOGLE_CALENDAR_CLIENT_SECRET?: string;
};

export type GoogleCalendarConnectionForSync = {
  id: string;
  calendar_id: string;
  access_token: string | null;
  refresh_token: string | null;
  auth_type: string;
  is_active: number;
};

export async function refreshGoogleCalendarAccessToken(
  env: GoogleCalendarEnv,
  refreshToken: string,
): Promise<string | null> {
  if (!env.GOOGLE_CALENDAR_CLIENT_ID || !env.GOOGLE_CALENDAR_CLIENT_SECRET) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn(`Google Calendar token refresh failed ${res.status}: ${text.slice(0, 200)}`);
    return null;
  }

  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function getActiveCalendarConnection(
  db: D1Database,
  env: GoogleCalendarEnv,
): Promise<GoogleCalendarConnectionForSync | null> {
  const conn = await db
    .prepare(
      `SELECT id, calendar_id, access_token, refresh_token, auth_type, is_active
         FROM google_calendar_connections
        WHERE is_active = 1
        ORDER BY updated_at DESC
        LIMIT 1`,
    )
    .first<GoogleCalendarConnectionForSync>();
  if (!conn) return null;

  if (conn.refresh_token) {
    const refreshed = await refreshGoogleCalendarAccessToken(env, conn.refresh_token);
    if (refreshed) {
      await db
        .prepare(
          `UPDATE google_calendar_connections
              SET access_token = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')
            WHERE id = ?`,
        )
        .bind(refreshed, conn.id)
        .run();
      conn.access_token = refreshed;
    }
  }

  return conn.access_token ? conn : null;
}

export async function createGoogleCalendarEventForBooking(
  db: D1Database,
  env: GoogleCalendarEnv,
  bookingId: string,
): Promise<boolean> {
  const conn = await getActiveCalendarConnection(db, env);
  if (!conn) return false;

  const row = await db
    .prepare(
      `SELECT b.id,
              b.starts_at,
              b.ends_at,
              b.external_event_id,
              m.name AS menu_name,
              s.display_name AS staff_name,
              f.display_name AS friend_name
         FROM bookings b
         INNER JOIN menus m ON m.id = b.menu_id
         INNER JOIN staff s ON s.id = b.staff_id
         INNER JOIN friends f ON f.id = b.friend_id
        WHERE b.id = ?`,
    )
    .bind(bookingId)
    .first<{
      id: string;
      starts_at: string;
      ends_at: string;
      external_event_id: string | null;
      menu_name: string;
      staff_name: string;
      friend_name: string | null;
    }>();
  if (!row || row.external_event_id) return false;

  const gcal = new GoogleCalendarClient({
    calendarId: conn.calendar_id,
    accessToken: conn.access_token!,
  });
  const { eventId } = await gcal.createEvent({
    summary: `HAPREB session - ${row.friend_name || 'unknown friend'}`,
    start: row.starts_at,
    end: row.ends_at,
    description: [
      `booking_id: ${row.id}`,
      `menu: ${row.menu_name}`,
      `staff: ${row.staff_name}`,
      row.friend_name ? `friend: ${row.friend_name}` : '',
    ].filter(Boolean).join('\n'),
  });

  await db
    .prepare(
      `UPDATE bookings
          SET external_event_id = ?,
              external_calendar_id = ?,
              updated_at = strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')
        WHERE id = ?`,
    )
    .bind(eventId, conn.calendar_id, bookingId)
    .run();
  return true;
}

export async function deleteGoogleCalendarEventForBooking(
  db: D1Database,
  env: GoogleCalendarEnv,
  bookingId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT external_event_id, external_calendar_id
         FROM bookings
        WHERE id = ?`,
    )
    .bind(bookingId)
    .first<{ external_event_id: string | null; external_calendar_id: string | null }>();
  if (!row?.external_event_id) return false;

  const conn = await getActiveCalendarConnection(db, env);
  if (!conn) return false;

  const gcal = new GoogleCalendarClient({
    calendarId: row.external_calendar_id || conn.calendar_id,
    accessToken: conn.access_token!,
  });
  await gcal.deleteEvent(row.external_event_id);
  await db
    .prepare(
      `UPDATE bookings
          SET external_event_id = NULL,
              external_calendar_id = NULL,
              updated_at = strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')
        WHERE id = ?`,
    )
    .bind(bookingId)
    .run();
  return true;
}
