import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarIcon, Briefcase, Bell, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardCalendar({ user }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
        base44.entities.Job.list('-deadline', 100),
        base44.entities.CreativeTask.list('-deadline', 100),
        base44.entities.Reminder.filter({ user_email: user.email, status: 'pending' }, '-deadline', 100)
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
      try {
        return isSameDay(parseISO(job.deadline), date);
      } catch {
        return false;
      }
    });

    const creativeTasksOnDate = creativeTasks.filter(task => {
      if (!task.deadline) return false;
      try {
        return isSameDay(parseISO(task.deadline), date);
      } catch {
        return false;
      }
    });

    const remindersOnDate = reminders.filter(reminder => {
      if (!reminder.deadline) return false;
      try {
        return isSameDay(parseISO(reminder.deadline), date);
      } catch {
        return false;
      }
    });

    return { jobs: jobsOnDate, creativeTasks: creativeTasksOnDate, reminders: remindersOnDate };
  };

  const hasEventsOnDate = (date) => {
    const { jobs, creativeTasks, reminders } = getEventsForDate(date);
    return jobs.length > 0 || creativeTasks.length > 0 || reminders.length > 0;
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = [];
    
    // Get the first day of the month (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = start.getDay();
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let day = 1; day <= end.getDate(); day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (date) => {
    if (!date) return false;
    return isSameDay(date, new Date());
  };

  const isSelected = (date) => {
    if (!date) return false;
    return isSameDay(date, selectedDate);
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const daysInMonth = getDaysInMonth();

  return (
    <Card className="bg-card border-border w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={previousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden bg-background">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b bg-muted">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {daysInMonth.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square border-r border-b" />;
              }

              const hasEvents = hasEventsOnDate(date);
              const today = isToday(date);
              const selected = isSelected(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    aspect-square border-r border-b p-1 relative
                    hover:bg-accent transition-colors
                    ${selected ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}
                    ${today && !selected ? 'bg-secondary' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-sm ${selected ? 'font-bold' : ''}`}>
                      {date.getDate()}
                    </span>
                    {hasEvents && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        selected ? 'bg-primary-foreground' : 'bg-purple-500'
                      }`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Events for selected date */}
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h4>
          
          {selectedDateEvents.jobs.length === 0 && 
           selectedDateEvents.creativeTasks.length === 0 && 
           selectedDateEvents.reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events on this date</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
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