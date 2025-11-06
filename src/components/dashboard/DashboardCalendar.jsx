import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job, Reminder } from '@/entities/all';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarIcon, Briefcase, Bell } from 'lucide-react';

export default function DashboardCalendar({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [jobs, setJobs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const [jobsData, remindersData] = await Promise.all([
        Job.list('-deadline', 50),
        Reminder.filter({ user_email: user.email, status: 'pending' }, '-deadline', 50)
      ]);
      
      setJobs(jobsData.filter(j => j.deadline && j.status !== 'archived' && j.status !== 'cancelled'));
      setReminders(remindersData.filter(r => r.deadline));
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
    setIsLoading(false);
  }, [user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getEventsForDate = (date) => {
    const jobsOnDate = jobs.filter(job => {
      if (!job.deadline) return false;
      return isSameDay(parseISO(job.deadline), date);
    });

    const remindersOnDate = reminders.filter(reminder => {
      if (!reminder.deadline) return false;
      return isSameDay(parseISO(reminder.deadline), date);
    });

    return { jobs: jobsOnDate, reminders: remindersOnDate };
  };

  const hasEventsOnDate = (date) => {
    const { jobs, reminders } = getEventsForDate(date);
    return jobs.length > 0 || reminders.length > 0;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <Card className="bg-card border-border w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <style>{`
          /* Make calendar fully responsive with dynamic day cell spacing */
          .calendar-wrapper .rdp {
            width: 100%;
          }
          
          .calendar-wrapper .rdp-months {
            width: 100%;
            justify-content: center;
          }
          
          .calendar-wrapper .rdp-month {
            width: 100%;
          }
          
          .calendar-wrapper .rdp-table {
            width: 100%;
            max-width: 100%;
          }
          
          .calendar-wrapper .rdp-head_cell {
            width: 14.28%; /* 100% / 7 days */
            padding: 0;
          }
          
          .calendar-wrapper .rdp-cell {
            width: 14.28%; /* 100% / 7 days */
            padding: 0;
          }
          
          /* Make day buttons fill their cells dynamically */
          .calendar-wrapper .rdp-day {
            width: 100%;
            height: 100%;
            min-height: 36px;
          }
          
          .calendar-wrapper .rdp-button {
            width: 100%;
            height: 100%;
            min-height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          
          /* Event indicators - positioned relative to button */
          .calendar-wrapper .has-events .rdp-button {
            font-weight: 600;
            position: relative;
          }
          
          .calendar-wrapper .has-events .rdp-button::after {
            content: '';
            position: absolute;
            bottom: 3px;
            left: 50%;
            transform: translateX(-50%);
            width: 5px;
            height: 5px;
            background-color: #8B5CF6;
            border-radius: 50%;
            z-index: 1;
          }
        `}</style>
        <div className="calendar-wrapper w-full">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border w-full"
            modifiers={{
              hasEvents: (date) => hasEventsOnDate(date)
            }}
            modifiersClassNames={{
              hasEvents: 'has-events'
            }}
          />
        </div>

        {/* Events for selected date */}
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h4>
          
          {selectedDateEvents.jobs.length === 0 && selectedDateEvents.reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events on this date</p>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.jobs.map(job => (
                <div key={job.id} className="flex items-start gap-2 p-2 bg-secondary rounded-lg">
                  <Briefcase className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.client_name}</p>
                  </div>
                </div>
              ))}
              
              {selectedDateEvents.reminders.map(reminder => (
                <div key={reminder.id} className="flex items-start gap-2 p-2 bg-secondary rounded-lg">
                  <Bell className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{reminder.title}</p>
                    {reminder.description && (
                      <p className="text-xs text-muted-foreground truncate">{reminder.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}