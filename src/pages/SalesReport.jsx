import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Printer, Copy, FileText } from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function SalesReport() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sales");
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [summaryPeriod, setSummaryPeriod] = useState("monthly");

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

  const setQuickDateRange = (range) => {
    const today = new Date();
    switch (range) {
      case "monthly":
        setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
      case "quarterly":
        setStartDate(format(startOfQuarter(today), "yyyy-MM-dd"));
        setEndDate(format(endOfQuarter(today), "yyyy-MM-dd"));
        break;
      case "yearly":
        setStartDate(format(startOfYear(today), "yyyy-MM-dd"));
        setEndDate(format(endOfYear(today), "yyyy-MM-dd"));
        break;
    }
  };

  // Customer Aging Report Data
  const getAgingReport = () => {
    const today = new Date();
    const unpaidInvoices = invoices.filter(inv => 
      inv.status === 'unpaid' || inv.status === 'billed' || inv.status === 'overdue'
    );

    const agingData = {};
    unpaidInvoices.forEach(invoice => {
      const clientName = invoice.client_name;
      if (!agingData[clientName]) {
        agingData[clientName] = {
          client: clientName,
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          over90: 0,
          total: 0
        };
      }

      const daysOverdue = differenceInDays(today, new Date(invoice.due_date || invoice.issue_date));
      const amount = invoice.amount || 0;

      if (daysOverdue <= 0) {
        agingData[clientName].current += amount;
      } else if (daysOverdue <= 30) {
        agingData[clientName].days30 += amount;
      } else if (daysOverdue <= 60) {
        agingData[clientName].days60 += amount;
      } else if (daysOverdue <= 90) {
        agingData[clientName].days90 += amount;
      } else {
        agingData[clientName].over90 += amount;
      }
      agingData[clientName].total += amount;
    });

    return Object.values(agingData).sort((a, b) => b.total - a.total);
  };

  // Product Sales Performance
  const getProductPerformance = () => {
    const productData = {};
    
    invoices.forEach(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
          const itemName = item.description || item.item_name || "Unknown";
          if (!productData[itemName]) {
            productData[itemName] = {
              product: itemName,
              quantity: 0,
              revenue: 0,
              orders: 0
            };
          }
          productData[itemName].quantity += item.quantity || 0;
          productData[itemName].revenue += (item.quantity || 0) * (item.price || 0);
          productData[itemName].orders += 1;
        });
      }
    });

    return Object.values(productData).sort((a, b) => b.revenue - a.revenue);
  };

  // Sales Summary by Period
  const getSalesSummary = () => {
    const summaryData = {};
    
    invoices.forEach(invoice => {
      let periodKey;
      const date = new Date(invoice.issue_date);
      
      if (summaryPeriod === "monthly") {
        periodKey = format(date, "MMM yyyy");
      } else if (summaryPeriod === "quarterly") {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `Q${quarter} ${date.getFullYear()}`;
      } else {
        periodKey = date.getFullYear().toString();
      }

      if (!summaryData[periodKey]) {
        summaryData[periodKey] = {
          period: periodKey,
          sales: 0,
          invoiceCount: 0,
          avgSale: 0
        };
      }

      summaryData[periodKey].sales += invoice.amount || 0;
      summaryData[periodKey].invoiceCount += 1;
    });

    Object.values(summaryData).forEach(item => {
      item.avgSale = item.sales / item.invoiceCount;
    });

    return Object.values(summaryData);
  };

  // Export Functions
  const exportToCSV = (data, filename, headers) => {
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(h => {
        const value = row[h.toLowerCase().replace(/\s+/g, '_')];
        return typeof value === 'number' ? value.toFixed(2) : (value || '');
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    
    toast({
      title: "CSV exported!",
      description: `${filename} has been downloaded`
    });
  };

  const exportToPDF = (reportType) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(16);
    doc.text("MCTS - " + reportType.toUpperCase(), pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`${format(new Date(startDate), "MMM dd, yyyy")} - ${format(new Date(endDate), "MMM dd, yyyy")}`, pageWidth / 2, 22, { align: "center" });

    let tableData = [];
    let headers = [];

    if (reportType === "Sales Report") {
      headers = ["Date", "SI No", "TIN", "Sold To", "Address", "Sales"];
      tableData = invoices.map(inv => {
        const client = clients[inv.client_id];
        return [
          format(new Date(inv.issue_date), "MM/dd/yyyy"),
          inv.invoice_number,
          client?.tin || "-",
          inv.client_name,
          client?.address || "-",
          `₱${inv.amount.toFixed(2)}`
        ];
      });
      const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      tableData.push(["", "", "", "", "TOTAL:", `₱${total.toFixed(2)}`]);
    } else if (reportType === "Customer Aging") {
      headers = ["Customer", "Current", "1-30 Days", "31-60 Days", "61-90 Days", "Over 90", "Total"];
      const agingData = getAgingReport();
      tableData = agingData.map(row => [
        row.client,
        `₱${row.current.toFixed(2)}`,
        `₱${row.days30.toFixed(2)}`,
        `₱${row.days60.toFixed(2)}`,
        `₱${row.days90.toFixed(2)}`,
        `₱${row.over90.toFixed(2)}`,
        `₱${row.total.toFixed(2)}`
      ]);
    } else if (reportType === "Product Performance") {
      headers = ["Product", "Quantity", "Revenue", "Orders"];
      const productData = getProductPerformance();
      tableData = productData.map(row => [
        row.product,
        row.quantity,
        `₱${row.revenue.toFixed(2)}`,
        row.orders
      ]);
    } else if (reportType === "Sales Summary") {
      headers = ["Period", "Sales", "Invoice Count", "Avg Sale"];
      const summaryData = getSalesSummary();
      tableData = summaryData.map(row => [
        row.period,
        `₱${row.sales.toFixed(2)}`,
        row.invoiceCount,
        `₱${row.avgSale.toFixed(2)}`
      ]);
    }

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [251, 191, 36] }
    });

    doc.save(`${reportType.replace(/\s+/g, '_')}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    
    toast({
      title: "PDF exported!",
      description: `${reportType} has been downloaded`
    });
  };

  const copyTableData = (reportType) => {
    let tableText = "";
    
    if (reportType === "sales") {
      tableText = "DATE\tSI NO\tTIN\tSOLD TO\tADDRESS\tSALES\n";
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
      const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      tableText += `\t\t\t\tTOTAL SALES:\t${total.toFixed(2)}`;
    } else if (reportType === "aging") {
      tableText = "CUSTOMER\tCURRENT\t1-30 DAYS\t31-60 DAYS\t61-90 DAYS\tOVER 90\tTOTAL\n";
      getAgingReport().forEach(row => {
        tableText += `${row.client}\t${row.current.toFixed(2)}\t${row.days30.toFixed(2)}\t${row.days60.toFixed(2)}\t${row.days90.toFixed(2)}\t${row.over90.toFixed(2)}\t${row.total.toFixed(2)}\n`;
      });
    } else if (reportType === "product") {
      tableText = "PRODUCT\tQUANTITY\tREVENUE\tORDERS\n";
      getProductPerformance().forEach(row => {
        tableText += `${row.product}\t${row.quantity}\t${row.revenue.toFixed(2)}\t${row.orders}\n`;
      });
    } else if (reportType === "summary") {
      tableText = "PERIOD\tSALES\tINVOICE COUNT\tAVG SALE\n";
      getSalesSummary().forEach(row => {
        tableText += `${row.period}\t${row.sales.toFixed(2)}\t${row.invoiceCount}\t${row.avgSale.toFixed(2)}\n`;
      });
    }
    
    navigator.clipboard.writeText(tableText).then(() => {
      toast({
        title: "Table copied!",
        description: "You can now paste it into Excel or Google Sheets"
      });
    });
  };

  const totalSales = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const agingReport = getAgingReport();
  const productPerformance = getProductPerformance();
  const salesSummary = getSalesSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export comprehensive business reports</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <Select onValueChange={setQuickDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="quarterly">This Quarter</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="aging">Customer Aging</TabsTrigger>
          <TabsTrigger value="product">Product Performance</TabsTrigger>
          <TabsTrigger value="summary">Sales Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Sales Report</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => copyTableData("sales")} variant="outline" size="sm" className="gap-2">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button onClick={() => exportToCSV(invoices.map(inv => ({
                    date: format(new Date(inv.issue_date), "MM/dd/yyyy"),
                    si_no: inv.invoice_number,
                    tin: clients[inv.client_id]?.tin || "-",
                    sold_to: inv.client_name,
                    address: clients[inv.client_id]?.address || "-",
                    sales: inv.amount
                  })), "Sales_Report", ["Date", "SI No", "TIN", "Sold To", "Address", "Sales"])} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button onClick={() => exportToPDF("Sales Report")} variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                  <Button onClick={() => window.print()} size="sm" className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
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
                  {invoices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No sales data for the selected period
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Customer Aging Report (AR Aging)</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => copyTableData("aging")} variant="outline" size="sm" className="gap-2">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button onClick={() => exportToCSV(agingReport, "Customer_Aging", ["Client", "Current", "Days30", "Days60", "Days90", "Over90", "Total"])} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button onClick={() => exportToPDF("Customer Aging")} variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-yellow-400 border border-black">
                      <th className="border border-black px-2 py-2 text-center font-bold">CUSTOMER</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">CURRENT</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">1-30 DAYS</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">31-60 DAYS</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">61-90 DAYS</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">OVER 90</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingReport.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-black px-2 py-1.5 text-sm">{row.client}</td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right">
                          ₱{row.current.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right">
                          ₱{row.days30.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right">
                          ₱{row.days60.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right">
                          ₱{row.days90.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right">
                          ₱{row.over90.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right font-semibold">
                          ₱{row.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {agingReport.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No outstanding payments
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Product Sales Performance</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => copyTableData("product")} variant="outline" size="sm" className="gap-2">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button onClick={() => exportToCSV(productPerformance, "Product_Performance", ["Product", "Quantity", "Revenue", "Orders"])} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button onClick={() => exportToPDF("Product Performance")} variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-yellow-400 border border-black">
                      <th className="border border-black px-2 py-2 text-center font-bold">PRODUCT</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">QUANTITY</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">REVENUE</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">ORDERS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-black px-2 py-1.5 text-sm">{row.product}</td>
                        <td className="border border-black px-2 py-1.5 text-sm text-center">{row.quantity}</td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right">
                          ₱{row.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-sm text-center">{row.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {productPerformance.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No product data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Sales Summary</CardTitle>
                <div className="flex gap-2 flex-wrap items-center">
                  <Select value={summaryPeriod} onValueChange={setSummaryPeriod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => copyTableData("summary")} variant="outline" size="sm" className="gap-2">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button onClick={() => exportToCSV(salesSummary, "Sales_Summary", ["Period", "Sales", "Invoice_Count", "Avg_Sale"])} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button onClick={() => exportToPDF("Sales Summary")} variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-yellow-400 border border-black">
                      <th className="border border-black px-2 py-2 text-center font-bold">PERIOD</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">SALES</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">INVOICE COUNT</th>
                      <th className="border border-black px-2 py-2 text-center font-bold">AVG SALE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesSummary.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-black px-2 py-1.5 text-sm font-medium">{row.period}</td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right">
                          ₱{row.sales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-sm text-center">{row.invoiceCount}</td>
                        <td className="border border-black px-2 py-1.5 text-sm text-right">
                          ₱{row.avgSale.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {salesSummary.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No summary data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <style>{`
        @media print {
          button, .no-print {
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