import { Component } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from 'fullcalendar';
import dayGridPlugin from 'fullcalendar/daygrid';
import interactionPlugin from 'fullcalendar/interaction';
import timeGridPlugin from 'fullcalendar/timegrid';

@Component({
  imports: [FullCalendarModule],
  selector: 'app-calendar',
  styleUrl: './calendar.css',
  templateUrl: './calendar.html',
})
export class Calendar {
  protected readonly options: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin], initialView: 'timeGridWeek', locale: 'tr',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    allDaySlot: false, nowIndicator: true, editable: true, selectable: true, slotMinTime: '08:00:00', slotMaxTime: '22:00:00',
    events: [
      { title: 'Elif · Hydrafacial', start: '2026-10-12T10:00:00', end: '2026-10-12T11:00:00', color: '#6366f1' },
      { title: 'Melis · Lazer', start: '2026-10-12T11:30:00', end: '2026-10-12T12:20:00', color: '#ec4899' },
      { title: 'Ceren · Lenf', start: '2026-10-13T14:00:00', end: '2026-10-13T14:45:00', color: '#10b981' },
    ],
  };
}
