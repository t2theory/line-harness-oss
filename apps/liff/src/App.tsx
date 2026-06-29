import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Booking from './pages/Booking.js';
import BookingHistory from './pages/BookingHistory.js';
import Event from './pages/Event.js';
import EventConfirm from './pages/EventConfirm.js';
import EventDone from './pages/EventDone.js';
import EventBookings from './pages/EventBookings.js';
import DiagRedirect from './pages/DiagRedirect.js';

function NotFoundFallback() {
  return (
    <div className="p-8 text-center text-gray-500">
      読み込み中...
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/diag-redirect" element={<DiagRedirect />} />
      <Route path="/booking/diag-redirect" element={<DiagRedirect />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/booking/history" element={<BookingHistory />} />
      <Route path="/events/me" element={<EventBookings />} />
      <Route path="/events/:id/confirm" element={<EventConfirm />} />
      <Route path="/events/:id/done" element={<EventDone />} />
      <Route path="/events/:id" element={<Event />} />
      <Route path="/" element={<Navigate to="/booking" replace />} />
      <Route path="*" element={<NotFoundFallback />} />
    </Routes>
  );
}
