import React, { useEffect, useState } from 'react';
import { ReimbursementRequest } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

export default function ReimbursementPrintView() {
    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            ReimbursementRequest.get(id)
                .then(setRequest)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!request) {
        return <div className="p-8">Reimbursement request not found.</div>;
    }

    return (
        <div className="bg-white text-black min-h-screen p-8 printable-area">
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Reimbursement Request</h1>
                        <p className="text-gray-600">Client: {request.client_name}</p>
                    </div>
                    <div className="text-right">
                        <p><strong>Date:</strong> {format(new Date(request.request_date), 'MMMM d, yyyy')}</p>
                        <p><strong>Status:</strong> <span className="font-semibold">{request.status}</span></p>
                    </div>
                </div>

                <div className="border-y border-gray-300 py-4 my-8">
                     <p><strong>Requested By:</strong> {request.requestor_name}</p>
                     <p><strong>Designation:</strong> {request.requestor_designation}</p>
                </div>
                

                <h2 className="text-xl font-semibold mb-4">Items</h2>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="p-2">Purchased From</th>
                            <th className="p-2">Description</th>
                            <th className="p-2 text-center">Quantity</th>
                            <th className="p-2 text-right">Unit Price</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {request.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2">{item.purchased_from}</td>
                                <td className="p-2">{item.item_description}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">₱{item.price.toFixed(2)}</td>
                                <td className="p-2 text-right">₱{(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="text-right mt-4 mr-2">
                    <p className="text-2xl font-bold">Total Reimbursement: ₱{request.total_amount.toFixed(2)}</p>
                </div>

                {request.reference_photos && request.reference_photos.length > 0 && (
                    <div className="mt-12 page-break-before">
                        <h2 className="text-xl font-semibold mb-4">Reference Photos</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {request.reference_photos.map(url => (
                                <img key={url} src={url} alt="Reference" className="w-full border p-1"/>
                            ))}
                        </div>
                    </div>
                )}
                 <div className="no-print fixed top-4 right-4">
                    <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print</Button>
                </div>
            </div>
        </div>
    );
}