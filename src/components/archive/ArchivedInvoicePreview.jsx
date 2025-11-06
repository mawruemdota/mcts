import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ArchivedInvoicePreview({ invoice, onClose }) {
    if (!invoice) return null;

    return (
        <Dialog open={!!invoice} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Archived Invoice: #{invoice.invoice_number}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-semibold text-foreground">Client:</p>
                            <p className="text-muted-foreground">{invoice.client_name}</p>
                            <p className="text-muted-foreground">{invoice.client_email}</p>
                        </div>
                        <div className="text-right">
                             <p><span className="font-semibold text-foreground">Issue Date:</span> {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
                             <p><span className="font-semibold text-foreground">Due Date:</span> {format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
                             <Badge variant="outline" className="mt-2">Status: {invoice.status}</Badge>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">Items</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.items?.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">₱{item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">₱{(item.quantity * item.price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end">
                        <div className="w-64 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-medium text-foreground">₱{invoice.subtotal.toFixed(2)}</span>
                            </div>
                             {invoice.discount > 0 && (
                               <div className="flex justify-between">
                                   <span className="text-muted-foreground">Discount:</span>
                                   <span className="font-medium text-foreground">- ₱{invoice.discount.toFixed(2)}</span>
                               </div>
                            )}
                            <div className="flex justify-between border-t border-border pt-1 mt-1 font-bold">
                                <span>Total:</span>
                                <span>₱{invoice.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {invoice.notes && (
                      <div>
                          <h4 className="font-semibold text-foreground">Notes</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                      </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}