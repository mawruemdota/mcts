import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Eye, Trash2, FileText, Plus, Loader2, Download, Printer, Edit } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ReportMaker from "@/pages/ReportMaker";

export default function DailyReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showReportMaker, setShowReportMaker] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const allReports = await base44.entities.DailyReport.list("-created_date");
      setReports(allReports);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast({ title: "Error", description: "Failed to load reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      await base44.entities.DailyReport.delete(reportId);
      toast({ title: "Success", description: "Report deleted successfully" });
      loadReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({ title: "Error", description: "Failed to delete report", variant: "destructive" });
    }
  };

  const handlePreview = (report) => {
    setSelectedReport(report);
    setShowPreview(true);
  };

  const handlePrintReport = (report) => {
    setSelectedReport(report);
    setShowPreview(true);
    setTimeout(() => window.print(), 500);
  };

  const handleDownloadPDF = (report) => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.text(report.title, 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(report.report_date), "MMM dd, yyyy")}`, 14, yPos);
    doc.text(`Prepared by: ${report.prepared_by_name}`, 14, yPos + 5);
    yPos += 15;

    report.report_content.forEach(group => {
      if (group.tasks.length === 0) return;

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(group.status_group, 14, yPos);
      yPos += 5;
      doc.setFont(undefined, 'normal');

      const tableData = group.tasks.map(task => [
        task.job_title,
        task.client_name,
        task.deadline ? format(new Date(task.deadline), "MM/dd/yyyy") : "N/A",
        `${task.completed_quantity}/${task.total_quantity}`,
        task.notes || ""
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

    doc.save(`${report.title}.pdf`);
    toast({ title: "Success", description: "PDF downloaded successfully" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-2xl font-bold">Daily Reports</h2>
          <p className="text-muted-foreground">View and manage operational reports</p>
        </div>
        <Button onClick={() => setShowReportMaker(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      <Card className="w-full">
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No daily reports yet.</p>
              <Button onClick={() => setShowReportMaker(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Report
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Prepared By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>{format(new Date(report.report_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{report.prepared_by_name}</TableCell>
                    <TableCell>{format(new Date(report.created_date), "MMM dd, yyyy hh:mm a")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(report)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingReport(report)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(report)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(report.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Date: {format(new Date(selectedReport.report_date), "MMM dd, yyyy")}</p>
                <p>Prepared by: {selectedReport.prepared_by_name}</p>
              </div>

              {selectedReport.report_content.map((group, idx) => {
                const isPendingOrProduction = group.status_group === "Pending Approval" || group.status_group === "In Production";
                
                return (
                  <div key={idx} className="space-y-2">
                    <h3 className="font-semibold text-lg">{group.status_group}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Title</TableHead>
                          <TableHead>Client / Deadline</TableHead>
                          {isPendingOrProduction && <TableHead className="w-[120px]">Quantity</TableHead>}
                          {isPendingOrProduction && <TableHead>Notes</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.tasks.map((task, taskIdx) => (
                          <TableRow key={taskIdx}>
                            <TableCell className="font-medium w-[200px]">{task.job_title}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{task.client_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {task.deadline ? format(new Date(task.deadline), "MM/dd/yyyy") : "N/A"}
                                </div>
                              </div>
                            </TableCell>
                            {isPendingOrProduction && (
                              <TableCell className="w-[120px]">
                                {task.completed_quantity}/{task.total_quantity}
                              </TableCell>
                            )}
                            {isPendingOrProduction && (
                              <TableCell className="text-sm">{task.notes || "-"}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReportMaker 
        isOpen={showReportMaker} 
        onClose={() => setShowReportMaker(false)}
        onSaved={() => {
          setShowReportMaker(false);
          loadReports();
        }}
      />

      <ReportMaker 
        isOpen={!!editingReport} 
        onClose={() => setEditingReport(null)}
        editingReport={editingReport}
        onSaved={() => {
          setEditingReport(null);
          loadReports();
        }}
      />
    </div>
  );
}