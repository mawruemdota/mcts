import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { User, Calendar, Info, StickyNote, Package } from 'lucide-react';

const DetailSection = ({ title, children, icon }) => {
    const Icon = icon;
    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                {title}
            </h4>
            <div className="pl-6 text-sm text-muted-foreground">{children}</div>
        </div>
    );
};

export default function ArchivedJobPreview({ job, onClose }) {
    if (!job) return null;

    return (
        <Dialog open={!!job} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Archived Task: {job.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">ID: #{job.id.slice(-6)}</p>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <DetailSection title="Client" icon={User}>
                            <p>{job.client_name}</p>
                            <p>{job.client_email}</p>
                            <p>{job.client_phone}</p>
                        </DetailSection>
                        <DetailSection title="Timeline" icon={Calendar}>
                             <p><span className="font-medium text-foreground">Deadline:</span> {job.deadline ? format(new Date(job.deadline), 'MMM d, yyyy') : 'N/A'}</p>
                             <p><span className="font-medium text-foreground">Completed:</span> {job.completion_date ? format(new Date(job.completion_date), 'MMM d, yyyy') : 'N/A'}</p>
                        </DetailSection>
                    </div>

                    <div className="space-y-1 text-sm">
                        <p className="font-semibold text-foreground">Status:</p>
                        <Badge variant="outline">{job.status}</Badge>
                    </div>

                    <DetailSection title="Items" icon={Package}>
                        <ul>
                            {job.items?.map((item, index) => (
                                <li key={index}>- {item.item_name} (Qty: {item.quantity}, Price: ₱{item.price})</li>
                            ))}
                        </ul>
                    </DetailSection>

                    <DetailSection title="Special Instructions" icon={Info}>
                        <p className="whitespace-pre-wrap">{job.special_instructions || 'None'}</p>
                    </DetailSection>

                    <DetailSection title="Production Notes" icon={StickyNote}>
                        <p className="whitespace-pre-wrap">{job.production_notes || 'None'}</p>
                    </DetailSection>

                    <div className="text-right">
                        <p className="text-lg font-bold text-foreground">Total Price: ₱{job.actual_price?.toFixed(2) || job.estimated_price?.toFixed(2) || '0.00'}</p>
                    </div>

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