import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { Merge } from 'lucide-react';

export default function CombineInvoicesModal({ invoices, onCombine, onClose }) {
    const [receiptType, setReceiptType] = useState('Invoice');
    const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));

    if (!invoices || invoices.length === 0) return null;

    // Calculate combined data
    const clientName = invoices[0].client_name;
    const clientId = invoices[0].client_id;
    const clientEmail = invoices[0].client_email;

    // Combine all items
    const allItems = [];
    invoices.forEach((inv, index) => {
        inv.items?.forEach(item => {
            allItems.push({
                ...item,
                description: `${item.description} (from ${inv.invoice_number})`
            });
        });
    });

    // Calculate totals
    const totalSubtotal = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
    const totalDiscount = invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Combine notes
    const combinedNotes = invoices
        .filter(inv => inv.notes && inv.notes.trim())
        .map(inv => `[${inv.invoice_number}]: ${inv.notes}`)
        .join('\n\n');

    // Combine job IDs
    const allJobIds = [...new Set(invoices.flatMap(inv => inv.job_ids || []))];

    const handleCombine = () => {
        onCombine({
            clientId,
            clientName,
            clientEmail,
            receiptType,
            dueDate,
            items: allItems,
            subtotal: totalSubtotal,
            discount: totalDiscount,
            amount: totalAmount,
            notes: combinedNotes,
            jobIds: allJobIds,
            originalInvoiceIds: invoices.map(inv => inv.id)
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="dialog-content max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-card-foreground flex items-center gap-2">
                        <Merge className="w-5 h-5" />
                        Combine {invoices.length} Invoices
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 text-card-foreground">
                    {/* Client Info */}
                    <Card className="bg-secondary/50">
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Client</Label>
                                    <p className="font-medium">{clientName}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Total Invoices</Label>
                                    <p className="font-medium">{invoices.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Original Invoices */}
                    <div>
                        <Label className="text-sm font-semibold mb-2 block">Original Invoices Being Combined:</Label>
                        <div className="flex flex-wrap gap-2">
                            {invoices.map(inv => (
                                <Badge key={inv.id} variant="outline" className="text-sm">
                                    {inv.invoice_number} - ₱{inv.amount.toFixed(2)}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* New Invoice Settings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Receipt Type</Label>
                            <Select value={receiptType} onValueChange={setReceiptType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Collection Receipt">Collection Receipt</SelectItem>
                                    <SelectItem value="Official Receipt">Official Receipt</SelectItem>
                                    <SelectItem value="Acknowledgement Receipt">Acknowledgement Receipt</SelectItem>
                                    <SelectItem value="Invoice">Invoice</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Combined Items Preview */}
                    <div>
                        <Label className="text-sm font-semibold mb-2 block">Combined Items ({allItems.length}):</Label>
                        <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                            {allItems.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span>{item.description}</span>
                                    <span className="font-medium">
                                        {item.quantity} × ₱{item.price.toFixed(2)} = ₱{(item.quantity * item.price).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <Card className="bg-primary/5">
                        <CardContent className="pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>₱{totalSubtotal.toFixed(2)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Total Discount:</span>
                                    <span>-₱{totalDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                                <span>Total Amount:</span>
                                <span>₱{totalAmount.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {combinedNotes && (
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Combined Notes:</Label>
                            <div className="bg-secondary/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {combinedNotes}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCombine}>
                        <Merge className="w-4 h-4 mr-2" />
                        Create Consolidated Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}