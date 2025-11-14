import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarIcon, Briefcase, Bell, Palette } from 'lucide-react';

export default function DashboardCalendar({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [jobs, setJobs] = useState([]);
  const [creativeTasks, setCreativeTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const [jobsData, creativeTasksData, remindersData] = await Promise.all([
        base44.entities.Job.list('-deadline', 50),
        base44.entities.CreativeTask.list('-deadline', 50),
        base44.entities.Reminder.filter({ user_email: user.email, status: 'pending' }, '-deadline', 50)
      ]);
      
      setJobs(jobsData.filter(j => j.deadline && j.status !== 'archived' && j.status !== 'cancelled'));
      setCreativeTasks(creativeTasksData.filter(ct => ct.deadline && ct.status !== 'done'));
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

    const creativeTasksOnDate = creativeTasks.filter(task => {
      if (!task.deadline) return false;
      return isSameDay(parseISO(task.deadline), date);
    });

    const remindersOnDate = reminders.filter(reminder => {
      if (!reminder.deadline) return false;
      return isSameDay(parseISO(reminder.deadline), date);
    });

    return { jobs: jobsOnDate, creativeTasks: creativeTasksOnDate, reminders: remindersOnDate };
  };

  const hasEventsOnDate = (date) => {
    const { jobs, creativeTasks, reminders } = getEventsForDate(date);
    return jobs.length > 0 || creativeTasks.length > 0 || reminders.length > 0;
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
            border-spacing: 2px;
          }
          
          .calendar-wrapper .rdp-head_cell {
            width: 14.28%;
            padding: 4px 2px;
            text-align: center;
          }
          
          .calendar-wrapper .rdp-cell {
            width: 14.28%;
            padding: 2px;
          }
          
          .calendar-wrapper .rdp-day {
            width: 100%;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .calendar-wrapper .rdp-button {
            width: 100%;
            height: 100%;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            border-radius: 6px;
          }
          
          /* Event indicator dot */
          .calendar-wrapper .has-events .rdp-button::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 5px;
            height: 5px;
            background-color: #8B5CF6;
            border-radius: 50%;
            z-index: 1;
          }
          
          /* Selected date with events */
          .calendar-wrapper .rdp-day_selected.has-events .rdp-button::after {
            background-color: white;
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
          
          {selectedDateEvents.jobs.length === 0 && selectedDateEvents.creativeTasks.length === 0 && selectedDateEvents.reminders.length === 0 ? (
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
              
              {selectedDateEvents.creativeTasks.map(task => (
                <div key={task.id} className="flex items-start gap-2 p-2 bg-secondary rounded-lg">
                  <Palette className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.client_name}</p>
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