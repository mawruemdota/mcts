
import React, { useState, useEffect } from "react";
import { TeamReport, Job, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Plus, AlertCircle, Check, MessageSquare, Briefcase } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const ReportSubmissionForm = ({ jobs, user, onSubmitted }) => {
  const [formData, setFormData] = useState({
    completed_jobs_summary: '',
    problem_encountered: '',
    related_job_ids: [],
    solution_applied: '',
    suggestions: ''
  });
  const { toast } = useToast();

  const handleJobSelection = (jobId) => {
    setFormData(prev => {
      const newJobIds = prev.related_job_ids.includes(jobId)
        ? prev.related_job_ids.filter(id => id !== jobId)
        : [...prev.related_job_ids, jobId];
      return { ...prev, related_job_ids: newJobIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.completed_jobs_summary) {
        toast({ variant: "destructive", title: "Error", description: "Completed jobs summary is required." });
        return;
    }
    await TeamReport.create({
      ...formData,
      submitted_by: user.email,
      report_date: new Date().toISOString().split('T')[0]
    });
    toast({ title: "Report Submitted", description: "Thank you for your feedback." });
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
      <div>
        <Label htmlFor="completed_jobs">Completed Jobs / Tasks Summary *</Label>
        <Textarea id="completed_jobs" value={formData.completed_jobs_summary} onChange={e => setFormData({...formData, completed_jobs_summary: e.target.value})} placeholder="List the jobs or tasks you've worked on today." required />
      </div>
      <div>
        <Label htmlFor="problem">Problem Encountered (if any)</Label>
        <Textarea id="problem" value={formData.problem_encountered} onChange={e => setFormData({...formData, problem_encountered: e.target.value})} placeholder="Describe any issues with machines, files, or materials." />
      </div>
      <div>
        <Label>Related Jobs</Label>
        <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-2">
            {jobs.map(job => (
                <div key={job.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`job-${job.id}`}
                        checked={formData.related_job_ids.includes(job.id)}
                        onCheckedChange={() => handleJobSelection(job.id)}
                    />
                    <label htmlFor={`job-${job.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {job.title || job.client_name}
                    </label>
                </div>
            ))}
        </div>
      </div>
      <div>
        <Label htmlFor="solution">Solution Applied</Label>
        <Textarea id="solution" value={formData.solution_applied} onChange={e => setFormData({...formData, solution_applied: e.target.value})} placeholder="How did you resolve the problem?" />
      </div>
      <div>
        <Label htmlFor="suggestions">Suggestions for Improvement</Label>
        <Textarea id="suggestions" value={formData.suggestions} onChange={e => setFormData({...formData, suggestions: e.target.value})} placeholder="Any ideas for making our workflow better?" />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Submit Report</Button>
      </div>
    </form>
  );
};


export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [reportsData, jobsData, userData] = await Promise.all([
      TeamReport.list("-report_date"),
      Job.list("-created_date", 50),
      User.me()
    ]);
    setReports(reportsData);
    setJobs(jobsData);
    setUser(userData);
    setIsLoading(false);
  };
  
  const getJobDetails = (jobId) => jobs.find(j => j.id === jobId);

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Team Reports</h1>
            <p className="text-muted-foreground mt-1">Daily reports, issues, and suggestions from the team.</p>
          </div>
           <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Submit New Report</Button>
            </DialogTrigger>
            <DialogContent className="dialog-content max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">Daily Report Submission</DialogTitle>
              </DialogHeader>
              <ReportSubmissionForm user={user} jobs={jobs} onSubmitted={() => { loadData(); setShowForm(false); }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {isLoading ? <p className="text-foreground">Loading reports...</p> :
           reports.length === 0 ? <p className="text-center py-12 text-muted-foreground">No reports submitted yet.</p> :
           reports.map(report => (
            <Card key={report.id} className="bg-card border-border">
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-foreground">{format(new Date(report.report_date), 'MMMM d, yyyy')}</CardTitle>
                  <p className="text-sm text-muted-foreground">Submitted by: {report.submitted_by.split('@')[0]}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Completed Work</h4>
                  <p className="text-muted-foreground text-sm pl-6">{report.completed_jobs_summary}</p>
                </div>
                {report.problem_encountered && (
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-400" />Problem Encountered</h4>
                    <p className="text-muted-foreground text-sm pl-6">{report.problem_encountered}</p>
                    {report.solution_applied && <p className="text-muted-foreground text-sm pl-6 mt-1"><strong>Solution:</strong> {report.solution_applied}</p>}
                  </div>
                )}
                {report.related_job_ids && report.related_job_ids.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" />Related Jobs</h4>
                        <div className="pl-6 pt-2 flex flex-wrap gap-2">
                        {report.related_job_ids.map(jobId => {
                            const job = getJobDetails(jobId);
                            return job ? <Badge key={jobId} variant="secondary">{job.title || job.client_name}</Badge> : null;
                        })}
                        </div>
                    </div>
                )}
                {report.suggestions && (
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-400" />Suggestions</h4>
                    <p className="text-muted-foreground text-sm pl-6">{report.suggestions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
           ))
          }
        </div>
      </div>
    </div>
  );
}
