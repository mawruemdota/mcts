import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";
import { Eye, Trash2, FileText, Plus, Loader2, Download, Printer, Edit, MessageCircle, User, Calendar, Package, CheckCircle2, Sparkles, TrendingUp, Search, Filter, X } from "lucide-react";
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
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryReport, setSummaryReport] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [generatingWeekly, setGeneratingWeekly] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyReportData, setWeeklyReportData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);

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

  const filteredAndSortedReports = () => {
    let filtered = [...reports];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => {
        // Search in report title
        if (report.title.toLowerCase().includes(query)) return true;
        
        // Search in prepared by name
        if (report.prepared_by_name?.toLowerCase().includes(query)) return true;
        
        // Search in report content (client names, job titles)
        return report.report_content.some(group => 
          group.tasks.some(task => 
            task.client_name?.toLowerCase().includes(query) ||
            task.job_title?.toLowerCase().includes(query)
          )
        );
      });
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(report => 
        new Date(report.report_date) >= dateFrom
      );
    }
    if (dateTo) {
      filtered = filtered.filter(report => 
        new Date(report.report_date) <= dateTo
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.report_date) - new Date(a.report_date);
        case "date-asc":
          return new Date(a.report_date) - new Date(b.report_date);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "created-desc":
          return new Date(b.created_date) - new Date(a.created_date);
        case "created-asc":
          return new Date(a.created_date) - new Date(b.created_date);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom(null);
    setDateTo(null);
    setSortBy("date-desc");
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || sortBy !== "date-desc";

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

  const handleGenerateSummary = async (report) => {
    setGeneratingSummary(true);
    setSummaryReport(report);
    setShowSummary(true);
    
    try {
      const reportText = report.report_content.map(group => {
        const tasks = group.tasks.map(task => 
          `- ${task.job_title} (Client: ${task.client_name}, Deadline: ${task.deadline ? format(new Date(task.deadline), "MMM dd") : "N/A"}, Progress: ${task.completed_quantity}/${task.total_quantity}${task.notes ? `, Notes: ${task.notes}` : ''})`
        ).join('\n');
        return `${group.status_group}:\n${tasks}`;
      }).join('\n\n');

      const prompt = `You are analyzing a daily operations report for a printing business. Generate a concise executive summary (3-4 paragraphs max) that highlights:

1. Key Achievements: What was completed or made significant progress
2. Current Focus: What's actively in production or pending
3. Potential Roadblocks: Any delays, issues, or concerns based on notes and progress
4. Overall Status: Brief assessment of operational health

Report Date: ${format(new Date(report.report_date), "MMMM dd, yyyy")}
Prepared by: ${report.prepared_by_name}

Report Details:
${reportText}

Keep it professional, concise, and actionable for busy stakeholders.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setGeneratedSummary(result);
      toast({ title: "Success", description: "Summary generated successfully" });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({ title: "Error", description: "Failed to generate summary", variant: "destructive" });
      setShowSummary(false);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    setGeneratingWeekly(true);
    
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyReports = reports.filter(r => 
        new Date(r.report_date) >= oneWeekAgo
      ).sort((a, b) => new Date(a.report_date) - new Date(b.report_date));

      if (weeklyReports.length === 0) {
        toast({ title: "No Data", description: "No reports found in the last 7 days", variant: "destructive" });
        setGeneratingWeekly(false);
        return;
      }

      const allTasks = [];
      const tasksByStatus = {};
      
      weeklyReports.forEach(report => {
        report.report_content.forEach(group => {
          if (!tasksByStatus[group.status_group]) {
            tasksByStatus[group.status_group] = [];
          }
          group.tasks.forEach(task => {
            allTasks.push({
              ...task,
              reportDate: report.report_date,
              status: group.status_group
            });
          });
        });
      });

      const reportText = weeklyReports.map(r => 
        `${format(new Date(r.report_date), "MMM dd, yyyy")}: ${r.title}`
      ).join('\n');

      const tasksText = Object.entries(tasksByStatus).map(([status, tasks]) => 
        `${status} (${tasks.length} tasks)`
      ).join(', ');

      const prompt = `Generate a comprehensive weekly operations summary for a printing business covering ${format(oneWeekAgo, "MMM dd")} to ${format(new Date(), "MMM dd, yyyy")}.

Based on ${weeklyReports.length} daily reports with these tasks: ${tasksText}

Provide:
1. Executive Summary: Overall week performance and highlights
2. Key Achievements: Major completions and milestones
3. Production Metrics: Volume and progress trends
4. Challenges & Issues: Any recurring problems or delays
5. Action Items: Recommendations for next week

Keep it concise but comprehensive, focusing on trends and patterns across the week.`;

      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setWeeklyReportData({
        dateRange: `${format(oneWeekAgo, "MMM dd")} - ${format(new Date(), "MMM dd, yyyy")}`,
        reportCount: weeklyReports.length,
        summary: summary,
        dailyReports: weeklyReports
      });
      
      setShowWeeklyReport(true);
      toast({ title: "Success", description: "Weekly report generated" });
    } catch (error) {
      console.error("Error generating weekly report:", error);
      toast({ title: "Error", description: "Failed to generate weekly report", variant: "destructive" });
    } finally {
      setGeneratingWeekly(false);
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

      <div className="space-y-4 no-print">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Daily Reports</h2>
            <p className="text-muted-foreground">View and manage operational reports</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleGenerateWeeklyReport}
              disabled={generatingWeekly || reports.length === 0}
            >
              {generatingWeekly ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              Weekly Report
            </Button>
            <Button onClick={() => setShowReportMaker(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, client, job, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Report Date (Newest)</SelectItem>
                      <SelectItem value="date-asc">Report Date (Oldest)</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                      <SelectItem value="created-desc">Created (Newest)</SelectItem>
                      <SelectItem value="created-asc">Created (Oldest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {filteredAndSortedReports().length} of {reports.length} reports</span>
              </div>
            )}
          </div>
        </Card>
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
                {filteredAndSortedReports().map(report => (
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
                        <Button variant="ghost" size="sm" onClick={() => handleGenerateSummary(report)}>
                          <Sparkles className="w-4 h-4 text-purple-500" />
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card">
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
            <div id="shareable-report-preview" className="bg-background rounded-lg space-y-3">
              <div className="mb-3">
                <h1 className="text-xl font-bold">{selectedReport.title} <span className="text-sm font-normal text-muted-foreground">by {selectedReport.prepared_by_name}</span></h1>
              </div>

              <div className="space-y-3">
                {(() => {
                  const simpleStatuses = ["Ready for Pickup", "Completed", "Quality Check"];
                  const simpleGroups = selectedReport.report_content.filter(g => simpleStatuses.includes(g.status_group) && g.tasks.length > 0);
                  const otherGroups = selectedReport.report_content.filter(g => !simpleStatuses.includes(g.status_group) && g.tasks.length > 0);

                  return (
                    <>
                      {simpleGroups.length > 0 && (
                        <Card>
                          <CardContent className="p-3">
                            <div className="grid grid-cols-3 gap-4">
                              {simpleGroups.map((group) => (
                                <div key={group.status_group} className="space-y-2">
                                  <div className="flex items-center gap-1.5 pb-2 border-b">
                                    <Package className="w-3 h-3" />
                                    <h3 className="text-xs font-bold">{group.status_group}</h3>
                                    <span className="text-xs text-muted-foreground">({group.tasks.length})</span>
                                  </div>
                                  <div className="space-y-2">
                                    {group.tasks.map((task, idx) => (
                                      <div key={idx} className="text-xs space-y-0.5">
                                        <p className="font-semibold">{task.job_title}</p>
                                        <p className="text-muted-foreground flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {task.client_name}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {otherGroups.map((group, idx) => {
                        const status = group.status_group;
                        const isPendingOrProduction = status === "Pending Approval" || status === "In Production";
                        
                        const statusColors = {
                          "Pending Approval": "bg-yellow-500/10 border-yellow-500/20 text-yellow-700",
                          "In Production": "bg-blue-500/10 border-blue-500/20 text-blue-700"
                        };
                        
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusColors[status] || "bg-primary/10 border-primary/20"}`}>
                                <Package className="w-3.5 h-3.5" />
                                <h2 className="text-sm font-bold">{status}</h2>
                                <span className="text-xs font-semibold ml-1">({group.tasks.length})</span>
                              </div>
                            </div>

                            <div className="grid gap-2">
                              {group.tasks.map((task, taskIdx) => (
                                <Card key={taskIdx}>
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm mb-1">{task.job_title}</h3>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{task.client_name}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{task.deadline ? format(new Date(task.deadline), "MMM dd") : "N/A"}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3">
                                        {isPendingOrProduction && (
                                          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                            <Package className="w-3 h-3 text-blue-600" />
                                            <span className="font-bold text-blue-600 text-xs">
                                              {task.completed_quantity}/{task.total_quantity}
                                            </span>
                                          </div>
                                        )}
                                        {isPendingOrProduction && task.notes && (
                                          <p className="text-xs text-muted-foreground italic max-w-xs">{task.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
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

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Summary: {summaryReport?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {generatingSummary ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                <p className="text-muted-foreground">Analyzing report and generating summary...</p>
              </div>
            ) : (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900 mb-2">Executive Summary</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {generatedSummary}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowSummary(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    navigator.clipboard.writeText(generatedSummary);
                    toast({ title: "Copied", description: "Summary copied to clipboard" });
                  }}>
                    Copy Summary
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWeeklyReport} onOpenChange={setShowWeeklyReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Weekly Operations Report
            </DialogTitle>
          </DialogHeader>
          {weeklyReportData && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Period:</span>
                    <p className="font-semibold text-gray-900">{weeklyReportData.dateRange}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Daily Reports:</span>
                    <p className="font-semibold text-gray-900">{weeklyReportData.reportCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {weeklyReportData.summary}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Included Daily Reports:</h3>
                <div className="space-y-2">
                  {weeklyReportData.dailyReports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-gray-600">{format(new Date(report.report_date), "MMM dd, yyyy")}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowWeeklyReport(false);
                          handlePreview(report);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowWeeklyReport(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  const fullReport = `Weekly Operations Report\n${weeklyReportData.dateRange}\n\n${weeklyReportData.summary}`;
                  navigator.clipboard.writeText(fullReport);
                  toast({ title: "Copied", description: "Weekly report copied to clipboard" });
                }}>
                  Copy Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}