import ical, { ICalCalendarMethod, ICalEventStatus } from 'ical-generator'
import { DoctorAppointmentEmailRequest } from '../typings'

export class CalendarUtil {
  static generateAppointmentICS(
    data: DoctorAppointmentEmailRequest,
    method: 'REQUEST' | 'CANCEL' = 'REQUEST',
  ): string {
    const calendar = ical({
      method: method === 'CANCEL' ? ICalCalendarMethod.CANCEL : ICalCalendarMethod.REQUEST,
      name: 'AI+ Appointment',
      prodId: { company: 'AI+ Technology', product: 'Appointments' },
    })

    const event = calendar.createEvent({
      id: `appointment-${data.appointmentId}-${data.orgId}@aiplustechnology.com`,
      start: data.startDateUTC,
      end: data.endDateUTC,
      timezone: 'Asia/Kolkata',
      summary: `${data.appointmentType} - ${data.patientName}`,
      description: data.description || `Appointment with patient ${data.patientName}`,
      location: 'Clinic',
      organizer: {
        name: 'AI+ Technology',
        email: 'noreply@aiplustechnology.com',
      },
      attendees: [
        {
          name: `Dr. ${data.doctorName}`,
          email: data.doctorEmail,
          rsvp: true,
        },
      ],
    })

    if (method === 'CANCEL') {
      event.status(ICalEventStatus.CANCELLED)
      event.sequence(1)
    } else {
      event.status(ICalEventStatus.CONFIRMED)
      event.sequence(0)
    }

    return calendar.toString()
  }

  static createICSAttachment(
    data: DoctorAppointmentEmailRequest,
    method: 'REQUEST' | 'CANCEL' = 'REQUEST',
  ): { filename: string; content: string; contentType: string } {
    return {
      filename: 'appointment.ics',
      content: CalendarUtil.generateAppointmentICS(data, method),
      contentType: `text/calendar; method=${method}`,
    }
  }
}
