import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function DeliveryFormPrint() {
  const [delivery, setDelivery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDelivery = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (id) {
        try {
          const deliveries = await base44.entities.DeliveryForm.filter({ id });
          if (deliveries.length > 0) {
            setDelivery(deliveries[0]);
          }
        } catch (error) {
          console.error('Error loading delivery:', error);
        }
      }
      setIsLoading(false);
    };

    loadDelivery();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const style = document.createElement('style');
    style.textContent = '.print-controls { display: none !important; }';
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Delivery form not found</p>
      </div>
    );
  }

  const hasPrice = delivery.items?.some(item => item.price);
  const total = delivery.items?.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0) || 0;

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600;700&display=swap');
        
        .delivery-container {
          font-family: 'Bai Jamjuree', sans-serif;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
          background: white;
          color: #000;
        }
        
        .letterhead {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-bottom: 15px;
          border-bottom: 3px solid #2053E6;
          margin-bottom: 20px;
        }
        
        .letterhead-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        
        .letterhead-info h1 {
          font-size: 28px;
          font-weight: 700;
          color: #2053E6;
          margin: 0;
        }
        
        .letterhead-info p {
          font-size: 11px;
          color: #666;
          margin: 2px 0;
        }
        
        .document-title {
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin: 20px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }
        
        .info-box {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .info-box label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-box p {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 4px 0 0 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        
        .items-table th {
          background: #2053E6;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .items-table th:first-child {
          border-radius: 6px 0 0 0;
        }
        
        .items-table th:last-child {
          border-radius: 0 6px 0 0;
        }
        
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        
        .items-table tr:last-child td {
          border-bottom: none;
        }
        
        .items-table .qty-col {
          text-align: center;
          width: 80px;
        }
        
        .items-table .price-col {
          text-align: right;
          width: 120px;
        }
        
        .total-row {
          background: #f8f9fa;
          font-weight: 700;
        }
        
        .notes-section {
          margin: 25px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .notes-section h4 {
          font-size: 12px;
          color: #666;
          margin: 0 0 8px 0;
          text-transform: uppercase;
        }
        
        .notes-section p {
          font-size: 13px;
          color: #333;
          margin: 0;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          margin-top: 60px;
          padding-top: 20px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          margin-bottom: 8px;
          margin-top: 50px;
        }
        
        .signature-box label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }
        
        .signature-box .prepared-name {
          margin-top: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        .date-line {
          margin-top: 20px;
        }
        
        .date-line label {
          font-size: 11px;
          color: #666;
        }
        
        .date-line .underline {
          display: inline-block;
          width: 150px;
          border-bottom: 1px solid #333;
          margin-left: 10px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print-controls {
            display: none !important;
          }
          
          .delivery-container {
            padding: 0;
            max-width: 100%;
          }
        }
      `}</style>

      <div className="print-controls fixed top-4 right-4 flex gap-2 z-50">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Save as PDF
        </Button>
      </div>

      <div className="delivery-container">
        {/* Letterhead */}
        <div className="letterhead">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png" 
            alt="MCTS Logo"
            className="letterhead-logo"
          />
          <div className="letterhead-info">
            <h1>MARASIGAN CREATIVE & TECHNICAL SERVICES</h1>
            <p>Dasmariñas, Cavite | 0977 827 0150 | marasigancts@gmail.com</p>
          </div>
        </div>

        {/* Document Title */}
        <h2 className="document-title">Delivery Receipt</h2>

        {/* Info Grid */}
        <div className="info-grid">
          <div className="info-box">
            <label>Delivery Number</label>
            <p>{delivery.delivery_number}</p>
          </div>
          <div className="info-box">
            <label>Date</label>
            <p>{delivery.delivery_date ? format(new Date(delivery.delivery_date), 'MMMM d, yyyy') : '-'}</p>
          </div>
          <div className="info-box" style={{ gridColumn: 'span 2' }}>
            <label>Delivered To</label>
            <p>{delivery.client_name}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th className="qty-col">Qty</th>
              {hasPrice && <th className="price-col">Price</th>}
              {hasPrice && <th className="price-col">Amount</th>}
            </tr>
          </thead>
          <tbody>
            {delivery.items?.map((item, index) => (
              <tr key={index}>
                <td>{item.item_name}</td>
                <td className="qty-col">{item.quantity}</td>
                {hasPrice && (
                  <td className="price-col">
                    {item.price ? `₱${parseFloat(item.price).toLocaleString()}` : '-'}
                  </td>
                )}
                {hasPrice && (
                  <td className="price-col">
                    {item.price ? `₱${(parseFloat(item.price) * item.quantity).toLocaleString()}` : '-'}
                  </td>
                )}
              </tr>
            ))}
            {hasPrice && total > 0 && (
              <tr className="total-row">
                <td colSpan="3" style={{ textAlign: 'right' }}>Total:</td>
                <td className="price-col">₱{total.toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Notes */}
        {delivery.notes && (
          <div className="notes-section">
            <h4>Notes</h4>
            <p>{delivery.notes}</p>
          </div>
        )}

        {/* Signature Section */}
        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line"></div>
            <label>Prepared By</label>
            <p className="prepared-name">{delivery.prepared_by}</p>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <label>Received By</label>
            <div className="date-line">
              <label>Date:</label>
              <span className="underline"></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>This document serves as proof of delivery. Please sign upon receipt of items.</p>
        </div>
      </div>
    </>
  );
}