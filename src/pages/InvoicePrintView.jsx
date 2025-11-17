import React, { useState, useEffect } from "react";
import { Invoice, Job, IDPrintRecord } from "@/entities/all";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

export default function InvoicePrintView() {
  const [invoice, setInvoice] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [relatedIdRecords, setRelatedIdRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoiceData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const invoiceId = urlParams.get('id');
      
      if (invoiceId) {
        try {
          const invoiceData = await Invoice.filter({ id: invoiceId });
          if (invoiceData.length > 0) {
            const inv = invoiceData[0];
            setInvoice(inv);
            
            if (inv.job_ids && inv.job_ids.length > 0) {
              const jobs = await Promise.all(
                inv.job_ids.map(async jobId => {
                  const jobResults = await Job.filter({ id: jobId });
                  return jobResults.length > 0 ? jobResults[0] : null;
                })
              );
              setRelatedJobs(jobs.filter(Boolean));
            }
            
            const idCardItems = inv.items?.filter(item => 
              item.description.toLowerCase().includes('id card')
            ) || [];
            
            if (idCardItems.length > 0) {
              const allClientIdRecords = await IDPrintRecord.filter({ 
                client_id: inv.client_id, 
                status: 'invoiced' 
              });
              
              const invoiceCreatedDate = new Date(inv.created_date);
              
              const matchingRecords = allClientIdRecords.filter(record => {
                const recordUpdatedDate = new Date(record.updated_date);
                const timeDiff = Math.abs((invoiceCreatedDate - recordUpdatedDate) / (1000 * 60 * 60));
                return timeDiff <= 1;
              });
              
              if (matchingRecords.length === 0) {
                const fallbackRecords = allClientIdRecords.filter(record => {
                  const recordDate = new Date(record.print_date);
                  const daysDiff = Math.abs((invoiceCreatedDate - recordDate) / (1000 * 60 * 60 * 24));
                  return daysDiff <= 7;
                });
                
                const totalIdCards = idCardItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                setRelatedIdRecords(fallbackRecords.slice(0, totalIdCards));
              } else {
                setRelatedIdRecords(matchingRecords);
              }
            }
          }
        } catch (error) {
          console.error("Error loading invoice:", error);
        }
      }
      setIsLoading(false);
    };

    loadInvoiceData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (window.print) {
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          .no-print { display: none !important; }
        }
      `;
      document.head.appendChild(style);
      
      window.print();
      
      setTimeout(() => {
        document.head.removeChild(style);
      }, 1000);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!invoice) {
    return <div className="flex justify-center items-center h-screen">Invoice not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden during print */}
      <div className="no-print bg-gray-100 p-4 flex justify-center gap-4">
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print Invoice
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Save as PDF
        </Button>
      </div>

      {/* Print Content */}
      <div className="print-content">
        {/* Page 1 - Main Invoice */}
        <div className="invoice-page page-content">
          {/* Letterhead */}
          <div className="letterhead">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7574d74e3_letterhead.png" 
              alt="MCTS Letterhead" 
              className="letterhead-img"
            />
          </div>

          {/* Invoice Header */}
          <div className="invoice-header">
            <div className="invoice-title-section">
              <h1 className="invoice-title">{invoice.receipt_type || 'Invoice'}</h1>
              <p className="invoice-number">#{invoice.invoice_number}</p>
            </div>
            <div className="invoice-dates">
              <p>Issue Date: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
              <p>Due Date: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Client Information */}
          <div className="client-section">
            <h2 className="section-title">Bill To:</h2>
            <div className="client-info">
              <p className="client-name">{invoice.client_name}</p>
              {invoice.client_email && <p className="client-email">{invoice.client_email}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">₱{(item.price || 0).toFixed(2)}</td>
                      <td className="text-right">₱{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">No items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div className="totals-content">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>₱{(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="total-line discount">
                  <span>Discount:</span>
                  <span>-₱{invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-line final-total">
                <span>Total:</span>
                <span>₱{(invoice.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="payment-section">
            <h3 className="payment-title">Payment Options:</h3>
            <div className="payment-content">
              <div className="payment-details">
                <div className="qr-section">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f53bad017_download.jpg" 
                    alt="Payment QR Code" 
                    className="qr-code"
                  />
                </div>
                <div className="bank-details">
                  <div className="bank-info">
                    <p className="bank-name">BDO</p>
                    <p>Mario Jonathan Marasigan</p>
                    <p>007758011619</p>
                  </div>
                  <div className="bank-info">
                    <p className="bank-name">G-Cash</p>
                    <p>Mario Jonathan Marasigan</p>
                    <p>09778270150</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="notes-section">
              <h3 className="notes-title">Notes:</h3>
              <p className="notes-content">{invoice.notes}</p>
            </div>
          )}

          {/* Prepared By */}
          {invoice.prepared_by && (
            <div className="prepared-by-section">
              <p className="prepared-by-text">Prepared by: {invoice.prepared_by}</p>
            </div>
          )}

          {/* Footer */}
          <div className="footer-section">
            <p>Thank you for your business!</p>
          </div>
        </div>

        {/* Page 2 - ID Card Details (only if ID cards exist in this specific invoice) */}
        {relatedIdRecords.length > 0 && (
          <div className="id-details-page page-content">
            {/* Letterhead for Page 2 */}
            <div className="letterhead">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7574d74e3_letterhead.png" 
                alt="MCTS Letterhead" 
                className="letterhead-img"
              />
            </div>

            {/* Page 2 Header */}
            <div className="invoice-header">
              <div className="invoice-title-section">
                <h1 className="invoice-title">ID Card Details</h1>
                <p className="invoice-number">#{invoice.invoice_number}</p>
              </div>
              <div className="invoice-dates">
                <p>Client: {invoice.client_name}</p>
                <p>Issue Date: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
              </div>
            </div>

            {/* ID Records Table */}
            <div className="items-section">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>ID Number</th>
                    <th>Position</th>
                    <th>Print Date</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedIdRecords.map((record, index) => (
                    <tr key={index}>
                      <td>{record.employee_name}</td>
                      <td>{record.id_number || '-'}</td>
                      <td>{record.position || '-'}</td>
                      <td>{format(new Date(record.print_date), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="summary-section">
              <p>Total ID Cards: {relatedIdRecords.length}</p>
              <p className="summary-thanks">Thank you for your business!</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced CSS for proper print layout */}
      <style jsx>{`
        .print-content {
          color: #000;
          background: #fff;
        }

        .page-content {
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 20mm;
          box-sizing: border-box;
          background: white;
        }

        .letterhead {
          margin-bottom: 20px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
        }

        .letterhead-img {
          width: 100%;
          height: auto;
          object-fit: contain;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
        }

        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 5px 0;
        }

        .invoice-number {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .invoice-dates {
          text-align: right;
          font-size: 14px;
          color: #6b7280;
        }

        .invoice-dates p {
          margin: 2px 0;
        }

        .client-section {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .client-info {
          background-color: #f9fafb;
          padding: 12px;
          border-radius: 6px;
        }

        .client-name {
          font-weight: 600;
          font-size: 14px;
          margin: 0 0 4px 0;
        }

        .client-email {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }

        .items-section {
          margin-bottom: 25px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #d1d5db;
        }

        .items-table th,
        .items-table td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 12px;
        }

        .items-table th {
          background-color: #f9fafb;
          font-weight: 600;
          text-align: left;
        }

        .items-table td.text-center {
          text-align: center;
        }

        .items-table td.text-right {
          text-align: right;
        }

        .totals-section {
          margin-bottom: 20px;
          display: flex;
          justify-content: flex-end;
        }

        .totals-content {
          width: 250px;
        }

        .total-line {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 14px;
        }

        .total-line.discount {
          color: #dc2626;
        }

        .total-line.final-total {
          border-top: 1px solid #d1d5db;
          padding-top: 8px;
          font-weight: bold;
          font-size: 16px;
        }

        .payment-section {
          margin-bottom: 20px;
        }

        .payment-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 15px 0;
        }

        .payment-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .payment-details {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }

        .qr-section {
          width: 130px;
          flex-shrink: 0;
        }

        .qr-code {
          width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .bank-details {
          font-size: 12px;
          color: #6b7280;
        }

        .bank-info {
          margin-bottom: 15px;
        }

        .bank-name {
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 2px 0;
        }

        .bank-info p {
          margin: 1px 0;
        }

        .notes-section {
          margin-bottom: 15px;
        }

        .notes-title {
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
          font-size: 14px;
        }

        .notes-content {
          color: #6b7280;
          font-size: 12px;
          margin: 0;
        }

        .prepared-by-section {
          margin-bottom: 15px;
          text-align: right;
        }

        .prepared-by-text {
          color: #6b7280;
          font-size: 12px;
          font-style: italic;
          margin: 0;
        }

        .footer-section {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }

        .footer-section p {
          margin: 0;
        }

        .summary-section {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 40px;
        }

        .summary-section p {
          margin: 8px 0;
        }

        .summary-thanks {
          margin-top: 15px !important;
        }

        @media print {
          .no-print {
            display: none !important;
          }

          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          .page-content {
            margin: 0;
            padding: 15mm;
            max-width: none;
            width: 100%;
            min-height: 100vh;
            page-break-after: always;
          }

          .page-content:last-child {
            page-break-after: auto;
          }

          .id-details-page {
            page-break-before: always;
          }
        }

        @page {
          margin: 0.5in;
          size: A4;
        }
      `}</style>
    </div>
  );
}