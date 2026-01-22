import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Printer, Copy } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function SalesReport() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoiceData, clientData] = await Promise.all([
        base44.entities.Invoice.list(),
        base44.entities.Client.list()
      ]);

      const clientMap = {};
      clientData.forEach(client => {
        clientMap[client.id] = client;
      });
      setClients(clientMap);

      const filtered = invoiceData.filter(inv => {
        if (inv.status === 'void' || inv.status === 'archived') return false;
        const invDate = new Date(inv.issue_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return invDate >= start && invDate <= end;
      });

      filtered.sort((a, b) => new Date(a.issue_date) - new Date(b.issue_date));
      setInvoices(filtered);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const copyTableData = () => {
    let tableText = "DATE\tSI NO\tTIN\tSOLD TO\tADDRESS\tSALES\n";
    
    invoices.forEach(invoice => {
      const client = clients[invoice.client_id];
      const row = [
        format(new Date(invoice.issue_date), "MM/dd/yyyy"),
        invoice.invoice_number,
        client?.tin || "-",
        invoice.client_name,
        client?.address || "-",
        invoice.amount.toFixed(2)
      ].join("\t");
      tableText += row + "\n";
    });
    
    tableText += `\t\t\t\tTOTAL SALES:\t${totalSales.toFixed(2)}`;
    
    navigator.clipboard.writeText(tableText).then(() => {
      toast({
        title: "Table copied!",
        description: "You can now paste it into Excel or Google Sheets"
      });
    });
  };

  const totalSales = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">Sales Report</h1>
          <p className="text-sm text-muted-foreground">View and export sales data</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyTableData} variant="outline" className="gap-2">
            <Copy className="w-4 h-4" />
            Copy Table
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            SALES REPORT
            <br />
            <span className="text-sm font-normal text-muted-foreground">
              {format(new Date(startDate), "MMMM dd, yyyy")} - {format(new Date(endDate), "MMMM dd, yyyy")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-yellow-400 border border-black">
                      <th className="border border-black px-2 py-2 text-center font-bold">DATE</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">SI NO</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">TIN</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">SOLD TO</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">ADDRESS</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">SALES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, index) => {
                      const client = clients[invoice.client_id];
                      return (
                        <tr key={invoice.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-black px-2 py-1.5 text-sm">
                            {format(new Date(invoice.issue_date), "MM/dd/yyyy")}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-sm">
                            {invoice.invoice_number}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-sm">
                            {client?.tin || "-"}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-sm">
                            {invoice.client_name}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-sm">
                            {client?.address || "-"}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-sm text-right">
                            ₱{invoice.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-yellow-400 font-bold">
                      <td colSpan="5" className="border border-black px-2 py-2 text-right">
                        TOTAL SALES:
                      </td>
                      <td className="border border-black px-2 py-2 text-right">
                        ₱{totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {invoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data for the selected period
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}