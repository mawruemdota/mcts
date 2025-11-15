import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  Clock,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function RecentActivityWidget({ limit = 10 }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const logs = await base44.entities.ActivityLog.list('-created_date', limit);
        setActivities(logs);
      } catch (error) {
        console.error('Error loading recent activities:', error);
      }
      setIsLoading(false);
    };

    loadActivities();
  }, [limit]);

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'created': return <Plus className="w-3 h-3" />;
      case 'updated': return <Edit className="w-3 h-3" />;
      case 'deleted': return <Trash2 className="w-3 h-3" />;
      case 'status_changed': return <RefreshCw className="w-3 h-3" />;
      case 'assigned': return <UserCheck className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'created': return 'text-green-600';
      case 'updated': return 'text-blue-600';
      case 'deleted': return 'text-red-600';
      case 'status_changed': return 'text-orange-600';
      case 'assigned': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          Recent Activity
        </CardTitle>
        <Link to={createPageUrl('ActivityLog')}>
          <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-2 bg-secondary rounded-lg">
                <div className={`mt-0.5 ${getActionColor(activity.action_type)}`}>
                  {getActionIcon(activity.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user_name || activity.user_email}</span>
                    {' '}
                    <span className="text-muted-foreground">{activity.action_type}</span>
                    {' '}
                    <span className="font-medium">{activity.entity_name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{activity.entity_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}