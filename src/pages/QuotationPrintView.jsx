import React, { useState, useEffect } from "react";
import { Quotation } from "@/entities/all";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

export default function QuotationPrintView() {
  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuotationData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const quotationId = urlParams.get('id');
      
      if (quotationId) {
        try {
          const quotationData = await Quotation.filter({ id: quotationId });
          if (quotationData.length > 0) {
            setQuotation(quotationData[0]);
          }
        } catch (error) {
          console.error("Error loading quotation:", error);
        }
      }
      setIsLoading(false);
    };

    loadQuotationData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
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
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!quotation) {
    return <div className="flex justify-center items-center h-screen">Quotation not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden during print */}
      <div className="no-print bg-gray-100 p-4 flex justify-center gap-4">
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print Quotation
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Save as PDF
        </Button>
      </div>

      {/* Print Content */}
      <div className="print-content">
        <div className="quotation-page page-content">
          {/* Letterhead */}
          <div className="letterhead">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7574d74e3_letterhead.png" 
              alt="MCTS Letterhead" 
              className="letterhead-img"
            />
          </div>

          {/* Quotation Header */}
          <div className="invoice-header">
            <div className="invoice-title-section">
              <h1 className="invoice-title">Quotation</h1>
              <p className="invoice-number">#{quotation.quotation_id}</p>
            </div>
            <div className="invoice-dates">
              <p>Issue Date: {format(new Date(quotation.created_date), 'MMM d, yyyy')}</p>
              <p>Valid Until: {format(new Date(new Date(quotation.created_date).setDate(new Date(quotation.created_date).getDate() + 30)), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Client Information */}
          <div className="client-section">
            <h2 className="section-title">Prepared For:</h2>
            <div className="client-info">
              <p className="client-name">{quotation.client_info?.name}</p>
              {quotation.client_info?.phone && <p className="client-email">{quotation.client_info.phone}</p>}
              {quotation.client_info?.email && <p className="client-email">{quotation.client_info.email}</p>}
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
                {quotation.items && quotation.items.length > 0 ? (
                  quotation.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.item_name}</td>
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
                <span>₱{(quotation.subtotal || 0).toFixed(2)}</span>
              </div>
              {quotation.discount_amount > 0 && (
                <div className="total-line discount">
                  <span>Discount{quotation.promo_code ? ` (${quotation.promo_code})` : ''}:</span>
                  <span>-₱{quotation.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-line final-total">
                <span>Total:</span>
                <span>₱{(quotation.total_price || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="notes-section">
              <h3 className="notes-title">Notes:</h3>
              <p className="notes-content">{quotation.notes}</p>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="notes-section">
            <h3 className="notes-title">Terms & Conditions:</h3>
            <p className="notes-content">
              This quotation is valid for 30 days from the issue date. Prices are subject to change based on material availability and design specifications. A 50% deposit is required to commence production.
            </p>
          </div>

          {/* Footer */}
          <div className="footer-section">
            <p>Thank you for considering our services!</p>
          </div>
        </div>
      </div>

      {/* CSS Styling */}
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
          }

          header, nav, .sidebar, .topbar, [data-sidebar] {
            display: none !important;
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