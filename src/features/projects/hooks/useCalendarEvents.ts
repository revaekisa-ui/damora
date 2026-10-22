import { useState, useEffect } from 'react';
import { CalendarEvent } from '../../../types';
import { getEvents } from '../../../services/events';

export const useCalendarEvents = (startDate: string, endDate: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await getEvents(startDate, endDate);
      setEvents(data);
    } catch (err) {
      setError('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [startDate, endDate]);

  return { events, isLoading, error, refetch: fetchEvents };
};
