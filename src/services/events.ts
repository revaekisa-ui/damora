import { CalendarEvent } from '../types';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  listCalendarEventsInRange,
  updateCalendarEvent,
} from './calendarEvents';

export const getEvents = async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
  return listCalendarEventsInRange(startDate, endDate);
};

export const createEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> => {
  return createCalendarEvent({
    title: event.title,
    eventType: event.eventType,
    date: event.date || event.startAt.slice(0, 10),
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay,
    projectId: event.projectId,
    clientId: event.clientId,
    teamMemberId: event.teamMemberId,
    vendorId: event.vendorId,
    location: event.location,
    notes: event.notes,
    tasks: event.tasks,
  });
};

export const updateEvent = async (id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
  return updateCalendarEvent(id, event);
};

export const deleteEvent = async (id: string): Promise<void> => {
  return deleteCalendarEvent(id);
};
