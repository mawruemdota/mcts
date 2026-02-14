import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Eye, Trash2, FileText, Plus, Loader2, Download, Printer, Edit, MessageCircle, User, Calendar, Package, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import ReportMaker from "@/pages/ReportMaker";

export default function DailyReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showReportMaker, setShowReportMaker] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [sharingReport, setSharingReport] = useState(false);

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

  const handleShareToMessenger = async (report) => {
    setSharingReport(true);
    try {
      const element = document.getElementById('shareable-report-preview');
      if (!element) {
        toast({ title: "Error", description: "Report preview not found", variant: "destructive" });
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.title}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Screenshot downloaded! You can now share it to Messenger." });
      });
    } catch (error) {
      console.error("Error generating screenshot:", error);
      toast({ title: "Error", description: "Failed to generate screenshot", variant: "destructive" });
    } finally {
      setSharingReport(false);
    }
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedReport?.title}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareToMessenger(selectedReport)}
                disabled={sharingReport}
              >
                {sharingReport ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4 mr-2" />
                )}
                Share to Messenger
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div id="shareable-report-preview" className="bg-white p-6 md:p-8 space-y-6">
              <div className="border-b-2 border-gray-200 pb-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedReport.title}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(selectedReport.report_date), "MMMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{selectedReport.prepared_by_name}</span>
                  </div>
                </div>
              </div>

              {selectedReport.report_content.map((group, idx) => {
                if (group.tasks.length === 0) return null;
                const isPendingOrProduction = group.status_group === "Pending Approval" || group.status_group === "In Production";
                
                return (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                      <Package className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg md:text-xl font-bold text-gray-900">{group.status_group}</h2>
                      <span className="ml-auto bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {group.tasks.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.tasks.map((task, taskIdx) => (
                        <div key={taskIdx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1 break-words">{task.job_title}</h3>
                              <div className="flex flex-col gap-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="break-words">{task.client_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{task.deadline ? format(new Date(task.deadline), "MMM dd, yyyy") : "No deadline"}</span>
                                </div>
                              </div>
                            </div>

                            {isPendingOrProduction && (
                              <div className="flex flex-col gap-2 sm:items-end">
                                <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                  <Package className="w-4 h-4 text-blue-600" />
                                  <span className="font-bold text-blue-900">
                                    {task.completed_quantity}/{task.total_quantity}
                                  </span>
                                </div>
                                {task.completed_quantity === task.total_quantity && task.total_quantity > 0 && (
                                  <div className="inline-flex items-center gap-1 text-green-600 text-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="font-semibold">Complete</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {isPendingOrProduction && task.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-700 italic break-words">{task.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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