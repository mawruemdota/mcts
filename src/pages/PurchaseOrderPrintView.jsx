import React, { useState, useEffect } from "react";
import { PurchaseOrder, User } from "@/entities/all";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

export default function PurchaseOrderPrintView() {
  const [po, setPo] = useState(null);
  const [approver, setApprover] = useState(null);
  const [requester, setRequester] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPOData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const poId = urlParams.get('id');
      
      if (poId) {
        try {
          const poData = await PurchaseOrder.filter({ id: poId });
          if (poData.length > 0) {
            const purchaseOrder = poData[0];
            setPo(purchaseOrder);
            
            // Load user details
            const [users] = await Promise.all([User.list()]);
            
            if (purchaseOrder.approved_by_email) {
              const approverUser = users.find(u => u.email === purchaseOrder.approved_by_email);
              setApprover(approverUser);
            }
            
            if (purchaseOrder.requested_by_email) {
              const requesterUser = users.find(u => u.email === purchaseOrder.requested_by_email);
              setRequester(requesterUser);
            }
          }
        } catch (error) {
          console.error("Error loading purchase order:", error);
        }
      }
      setIsLoading(false);
    };

    loadPOData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const style = document.createElement('style');
    style.textContent = `@media print { .no-print { display: none !important; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!po) {
    return <div className="flex justify-center items-center h-screen">Purchase Order not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls */}
      <div className="no-print bg-gray-100 p-4 flex justify-center gap-4">
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print Purchase Order
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Save as PDF
        </Button>
      </div>

      {/* Print Content */}
      <div className="print-content">
        <div className="po-page page-content">
          {/* Letterhead */}
          <div className="letterhead">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7574d74e3_letterhead.png" 
              alt="MCTS Letterhead" 
              className="letterhead-img"
            />
          </div>

          {/* PO Header */}
          <div className="invoice-header">
            <div className="invoice-title-section">
              <h1 className="invoice-title">Purchase Order</h1>
              <p className="invoice-number">#{po.po_number}</p>
            </div>
            <div className="invoice-dates">
              <p>Issue Date: {format(new Date(po.issue_date), 'MMM d, yyyy')}</p>
              <p>Due Date: {format(new Date(po.due_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="client-section">
            <h2 className="section-title">Supplier:</h2>
            <div className="client-info">
              <p className="client-name">{po.supplier_name}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Brand Name / Particular</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {po.items && po.items.length > 0 ? (
                  po.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.item_name}</td>
                      <td>{item.description || '-'}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">₱{(item.unit_price || 0).toFixed(2)}</td>
                      <td className="text-right">₱{((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">No items found</td>
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
                <span>₱{(po.subtotal || 0).toFixed(2)}</span>
              </div>
              {po.shipping_cost > 0 && (
                <div className="total-line">
                  <span>Shipping:</span>
                  <span>₱{po.shipping_cost.toFixed(2)}</span>
                </div>
              )}
              {po.tax_amount > 0 && (
                <div className="total-line">
                  <span>Tax:</span>
                  <span>₱{po.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-line final-total">
                <span>Total:</span>
                <span>₱{(po.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Approval Section */}
          <div className="approval-section">
            <div className="approval-row">
              <div className="approval-item">
                <p className="approval-label">Requested By:</p>
                <p className="approval-name">{requester ? (requester.nickname || requester.full_name) : (po.requested_by_email || 'N/A')}</p>
                <div className="approval-line"></div>
                <p className="approval-date">Date: {format(new Date(po.created_date), 'MMM d, yyyy')}</p>
              </div>
              <div className="approval-item">
                <p className="approval-label">To be Approved By:</p>
                <p className="approval-name">{approver ? (approver.nickname || approver.full_name) : (po.approved_by_email || 'N/A')}</p>
                <div className="approval-line"></div>
                <p className="approval-date">
                  {po.approved_date ? `Date: ${format(new Date(po.approved_date), 'MMM d, yyyy')}` : 'Date: __________'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {po.notes && (
            <div className="notes-section">
              <h3 className="notes-title">Notes:</h3>
              <p className="notes-content">{po.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="footer-section">
            <p>Internal Document - For Official Use Only</p>
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
          margin-bottom: 30px;
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

        .total-line.final-total {
          border-top: 1px solid #d1d5db;
          padding-top: 8px;
          font-weight: bold;
          font-size: 16px;
        }

        .approval-section {
          margin: 40px 0 20px 0;
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
        }

        .approval-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .approval-item {
          text-align: center;
        }

        .approval-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 30px;
        }

        .approval-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .approval-line {
          border-bottom: 1px solid #000;
          margin: 0 auto 5px auto;
          width: 80%;
        }

        .approval-date {
          font-size: 12px;
          color: #6b7280;
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
          margin-top: 30px;
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