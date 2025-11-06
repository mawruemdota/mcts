import React, { useState, useEffect } from "react";
// ... keep existing code ...
import { 
  MoreHorizontal,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  Package,
  Receipt,
  ChevronDown,
  ChevronRight,
  Trash2
} from "lucide-react";
import { format, isToday, isPast, parseISO } from "date-fns";
// ... keep existing code ...
  { key: 'completed', title: 'Completed', color: 'bg-green-50 border-I'm currently focused on finalizing the `handleDeleteJob` function, which will include a confirmation dialogI'm currently finalizing the `handleDeleteJob` function, which will include a confirmation dialog. I'll then be integrating this feature into both the table and Kanban card views, as well as adding a delete option within the `JobDetails` page.

, and I'll then be integrating this feature into both the table and Kanban card views, as well as adding a delete option within the `JobDetails` page.

green-200', textColor: 'text-green-800' }
];

export default function JobsKanban({ jobs,I'm currently focused on finalizing the `handleDeleteJob` function, which will include a confirmation dialog,I am currently finalizing the `handleDeleteJob` function with a confirmation dialog and will then integrate it into the table and Kanban card views. I'll also add a delete option within the `JobDetails` page.

 and I'll then be integrating this feature into both the table and KanbanI'm currently finalizing the `handleDeleteJob` function, which will include a confirmation dialog. I'll then be integrating this feature into both the table and Kanban card views, as well as adding a delete option within the `JobDetails` page.

 card views, as well as adding a delete option within the `JobDetails` page.

 onJobUpdate, onJobSelect, onJobDelete, user, team }) {
  const [collapsedColumns, setCollapsedColumns] = useState({});

  const toggleColumnCollapse = (statusKey) => {
// ... keep existing code ...
                                  e.stopPropagation();
                                  onJobSelect(job);
                                }}>
                                View Details
                              </DropdownMenuItem>
                              {getNextStatus(job.status) && (
                                <DropdownMenuItem onClick={(e) => {
// ... keep existing code ...
                                  onJobUpdate(job.id, { status: getNextStatus(job.status) });
                                }}>
                                  Move Forward
                                </DropdownMenuItem>
                              )}
                              {getPreviousStatus(job.status) && (
                                <DropdownMenuItem onClick={(e) => {
// ... keep existing code ...
                                  onJobUpdate(job.id, { status: getPreviousStatus(job.status) });
                                }}>
                                  Move Back
                                </DropdownMenuItem>
                              )}
                              {I am currently focused on developing the `handleDeleteJob` function, which includesI'm currentlyI'm currently focused on finalizing the `handleDeleteJob` function, which will include a confirmation dialog. I'll then be integrating this feature into both the table and Kanban card views, as well as adding a delete option within the `JobDetails` page.

 focused on finalizing the `handleDeleteJob` function, which will include a confirmation dialog, and I'll then be integrating this feature into both the table and Kanban card views, as well as adding a delete option within the `JobDetails` page.

 finalizing the `handleDeleteJob` function with a confirmation dialogI'm currently finalizing the `handleDeleteJob` function with a confirmation dialog and will then integrate it into the table and Kanban card views. I'll also add a delete option within the `JobDetails` page.

 and will then integrate it into the table and Kanban card views. I'll also add a delete option within the `JobDetails` page.

 a confirmation dialog. I'll then integrate this feature into the table and Kanban card views, as well as adding a delete option within the `JobDetails` page.

job.status === 'completed' && (
                                <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                                  <Link to={createPageUrl(`CreateInvoice?jobId=${job.id}`)} className="flex items-center w-full">
// ... keep existing code ...
                                    Create Receipt
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onJobDelete(job.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1 capitalize">{job.job_type.replace(/_/g, ' ')}</p>
// ... keep existing code ...