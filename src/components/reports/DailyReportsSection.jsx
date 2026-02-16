import React from "react";
import DailyReportsList from "@/components/reports/DailyReportsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DailyReportsSection() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Daily Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <DailyReportsList />
      </CardContent>
    </Card>
  );
}