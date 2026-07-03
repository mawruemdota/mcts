import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Facebook, Instagram } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";

export default function PostCalendarGrid({ currentMonth, posts, onPostClick }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const postsForDay = (day) => {
    const dayKey = format(day, "yyyy-MM-dd");
    return posts.filter((p) => p.scheduled_date === dayKey);
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="text-center text-xs font-semibold text-muted-foreground pb-1">
          {d}
        </div>
      ))}
      {days.map((day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        const dayPosts = postsForDay(day);
        return (
          <Droppable key={dayKey} droppableId={dayKey}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "min-h-[100px] rounded-lg border p-1.5 space-y-1",
                  isSameMonth(day, currentMonth) ? "bg-card" : "bg-muted/30",
                  isToday(day) && "border-primary",
                  snapshot.isDraggingOver && "bg-primary/10"
                )}
              >
                <div className={cn(
                  "text-xs font-medium mb-1",
                  isSameMonth(day, currentMonth) ? "text-foreground" : "text-muted-foreground"
                )}>
                  {format(day, "d")}
                </div>
                {dayPosts.map((post, index) => (
                  <Draggable key={post.id} draggableId={post.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        onClick={() => onPostClick(post)}
                        className={cn(
                          "flex items-center gap-1 p-1 rounded bg-secondary cursor-pointer hover:bg-secondary/80",
                          dragSnapshot.isDragging && "shadow-lg opacity-90"
                        )}
                      >
                        {post.image_url ? (
                          <img src={post.image_url} alt="Post" className="w-6 h-6 object-cover rounded flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-muted flex-shrink-0" />
                        )}
                        {post.platform === "facebook" ? (
                          <Facebook className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Instagram className="w-3 h-3 text-pink-600 flex-shrink-0" />
                        )}
                        <span className="text-[10px] truncate flex-1">{post.caption || "Untitled"}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        );
      })}
    </div>
  );
}