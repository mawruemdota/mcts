import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Save, Printer, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ReportMaker({ isOpen, onClose, onSaved, editingReport = null }) {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [reportTitle, setReportTitle] = useState(
    editingReport?.title || `Daily Report - ${format(new Date(), "MMM dd, yyyy")}`
  );
  const [reportDate, setReportDate] = useState(
    editingReport?.report_date || format(new Date(), "yyyy-MM-dd")
  );
  
  const statusOptions = [
    { value: "pending_approval", label: "Pending Approval", editable: true },
    { value: "in_production", label: "In Production", editable: true },
    { value: "quality_check", label: "Quality Check", editable: false },
    { value: "ready_pickup", label: "Ready for Pickup", editable: false },
    { value: "completed", label: "Completed", editable: false }
  ];
  
  const [selectedStatuses, setSelectedStatuses] = useState(
    editingReport?.report_content?.map(group => 
      statusOptions.find(s => s.label === group.status_group)?.value
    ).filter(Boolean) || ["pending_approval", "in_production", "quality_check", "ready_pickup", "completed"]
  );
  const [taskData, setTaskData] = useState({});

  useEffect(() => {
    loadData();
  }, [editingReport]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const allJobs = await base44.entities.Job.list();
      const activeJobs = allJobs.filter(job => 
        job.status !== "cancelled" && 
        job.status !== "archived"
      );
      setJobs(activeJobs);
      
      const initialTaskData = {};
      
      if (editingReport) {
        editingReport.report_content?.forEach(group => {
          group.tasks?.forEach(task => {
            const job = activeJobs.find(j => j.job_id === task.job_id);
            if (job) {
              initialTaskData[job.id] = {
                completed_quantity: task.completed_quantity || 0,
                notes: task.notes || ""
              };
            }
          });
        });
      }
      
      activeJobs.forEach(job => {
        if (!initialTaskData[job.id]) {
          initialTaskData[job.id] = {
            completed_quantity: 0,
            notes: ""
          };
        }
      });
      setTaskData(initialTaskData);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (statusValue) => {
    setSelectedStatuses(prev => 
      prev.includes(statusValue) 
        ? prev.filter(s => s !== statusValue)
        : [...prev, statusValue]
    );
  };

  const handleTaskDataChange = (jobId, field, value) => {
    setTaskData(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        [field]: value
      }
    }));
  };

  const getFilteredJobs = (status) => {
    return jobs.filter(job => job.status === status);
  };

  const handleSave = async () => {
    if (!reportTitle.trim()) {
      toast({ title: "Error", description: "Please enter a report title", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const reportContent = selectedStatuses.map(status => ({
        status_group: statusOptions.find(s => s.value === status)?.label || status,
        tasks: getFilteredJobs(status).map(job => ({
          job_id: job.job_id,
          job_title: job.title,
          client_name: job.client_name,
          deadline: job.deadline,
          total_quantity: job.quantity || 0,
          completed_quantity: taskData[job.id]?.completed_quantity || 0,
          notes: taskData[job.id]?.notes || ""
        }))
      })).filter(group => group.tasks.length > 0);

      if (editingReport) {
        await base44.entities.DailyReport.update(editingReport.id, {
          title: reportTitle,
          report_date: reportDate,
          report_content: reportContent
        });
        toast({ title: "Success", description: "Report updated successfully" });
      } else {
        await base44.entities.DailyReport.create({
          title: reportTitle,
          report_date: reportDate,
          prepared_by_email: user.email,
          prepared_by_name: user.full_name,
          report_content: reportContent
        });
        toast({ title: "Success", description: "Report saved successfully" });
      }
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving report:", error);
      toast({ title: "Error", description: "Failed to save report", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.text(reportTitle, 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(reportDate), "MMM dd, yyyy")}`, 14, yPos);
    doc.text(`Prepared by: ${user?.full_name || ""}`, 14, yPos + 5);
    yPos += 15;

    selectedStatuses.forEach(status => {
      const statusJobs = getFilteredJobs(status);
      if (statusJobs.length === 0) return;

      const statusLabel = statusOptions.find(s => s.value === status)?.label || status;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(statusLabel, 14, yPos);
      yPos += 5;
      doc.setFont(undefined, 'normal');

      const tableData = statusJobs.map(job => [
        job.title,
        job.client_name,
        job.deadline ? format(new Date(job.deadline), "MM/dd/yyyy") : "N/A",
        `${taskData[job.id]?.completed_quantity || 0}/${job.quantity || 0}`,
        taskData[job.id]?.notes || ""
      ]);

      doc.autoTable({
        startY: yPos,
        head: [["Title", "Client", "Deadline", "Quantity", "Notes"]],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`${reportTitle}.pdf`);
    toast({ title: "Success", description: "PDF downloaded successfully" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingReport ? "Edit" : "Create"} Daily Report</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <style>{`
              @media print {
                .no-print { display: none !important; }
                body { background: white; }
              }
            `}</style>

            <div className="flex justify-end gap-2 no-print">
              <Button variant="outline" onClick={handlePrint} size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingReport ? "Update" : "Save"} Report
              </Button>
            </div>

      <Card className="mb-6 no-print">
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Report Title</Label>
              <Input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title"
              />
            </div>
            <div>
              <Label>Report Date</Label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

            <Card className="no-print">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Select Task Statuses</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedStatuses([])}
                  disabled={selectedStatuses.length === 0}
                >
                  Uncheck All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {statusOptions.map(status => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={status.value}
                        checked={selectedStatuses.includes(status.value)}
                        onCheckedChange={() => handleStatusToggle(status.value)}
                      />
                      <Label htmlFor={status.value} className="cursor-pointer">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="print:block">
              <div className="mb-4 print:block hidden">
                <h1 className="text-2xl font-bold">{reportTitle}</h1>
                <p className="text-sm text-muted-foreground">Date: {format(new Date(reportDate), "MMM dd, yyyy")}</p>
                <p className="text-sm text-muted-foreground">Prepared by: {user?.full_name}</p>
              </div>

              <div className="space-y-6">
                {selectedStatuses.map(status => {
                  const statusJobs = getFilteredJobs(status);
                  if (statusJobs.length === 0) return null;

                  const statusLabel = statusOptions.find(s => s.value === status)?.label || status;
                  const isEditable = statusOptions.find(s => s.value === status)?.editable;

                  return (
                    <Card key={status} className="break-inside-avoid">
                      <CardHeader>
                        <CardTitle className="text-xl">{statusLabel}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              {isEditable && <TableHead className="w-[120px]">Quantity</TableHead>}
                              {isEditable && <TableHead>Notes</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statusJobs.map(job => (
                              <TableRow key={job.id}>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium">{job.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      <div>{job.client_name}</div>
                                      <div>{job.deadline ? format(new Date(job.deadline), "MM/dd/yyyy") : "N/A"}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                {isEditable && (
                                  <TableCell className="w-[120px]">
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        min="0"
                                        max={job.quantity || 999}
                                        value={taskData[job.id]?.completed_quantity || 0}
                                        onChange={(e) => handleTaskDataChange(job.id, "completed_quantity", parseInt(e.target.value) || 0)}
                                        className="w-16 h-8 no-print"
                                      />
                                      <span className="hidden print:inline">{taskData[job.id]?.completed_quantity || 0}</span>
                                      <span>/ {job.quantity || 0}</span>
                                    </div>
                                  </TableCell>
                                )}
                                {isEditable && (
                                  <TableCell>
                                    <Textarea
                                      value={taskData[job.id]?.notes || ""}
                                      onChange={(e) => handleTaskDataChange(job.id, "notes", e.target.value)}
                                      placeholder="Add notes..."
                                      className="min-h-[60px] no-print w-full"
                                    />
                                    <span className="hidden print:inline text-sm">{taskData[job.id]?.notes || ""}</span>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {selectedStatuses.every(status => getFilteredJobs(status).length === 0) && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No tasks found for the selected statuses.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}