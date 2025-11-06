import React, { useState, useEffect } from 'react';
import { InventoryRequest, InventoryItem, User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, ShoppingCart, Check, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const RequestForm = ({ onSubmitted, user, inventoryItems }) => {
    const [isNewItem, setIsNewItem] = useState(false);
    const [formData, setFormData] = useState({
        item_name: '',
        existing_item_id: '',
        quantity: 1,
        unit: 'pieces',
        details: '',
        link: ''
    });
    const { toast } = useToast();
    
    const handleSelectChange = (itemId) => {
        const selected = inventoryItems.find(i => i.id === itemId);
        setFormData({
            ...formData,
            existing_item_id: itemId,
            item_name: selected.item_name,
            unit: selected.unit
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await InventoryRequest.create({
                ...formData,
                quantity: Number(formData.quantity),
                requested_by: user.email,
            });
            toast({ title: 'Request Submitted' });
            onSubmitted();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to submit request' });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
            <div className="flex items-center space-x-2">
                <input type="checkbox" id="new-item-check" checked={isNewItem} onChange={e => setIsNewItem(e.target.checked)}/>
                <Label htmlFor="new-item-check">Requesting a new, unlisted item?</Label>
            </div>

            {isNewItem ? (
                 <div>
                    <Label>Item Name</Label>
                    <Input value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} required/>
                 </div>
            ) : (
                <div>
                    <Label>Select Existing Item</Label>
                    <select onChange={e => handleSelectChange(e.target.value)} className="w-full p-2 border rounded-md bg-background text-foreground">
                        <option value="">-- Select from inventory --</option>
                        {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                    </select>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})}/></div>
                {isNewItem && <div><Label>Unit (e.g. pcs, rolls)</Label><Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}/></div>}
            </div>
            <div><Label>Details / Specifications</Label><Input value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}/></div>
            <div><Label>Shopping Link (Optional)</Label><Input type="url" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})}/></div>
            <Button type="submit">Submit Request</Button>
        </form>
    )
}

export default function RequestsPage() {
    const [requests, setRequests] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [reqs, items, u] = await Promise.all([
                InventoryRequest.list('-created_date'),
                InventoryItem.list(),
                User.me()
            ]);
            setRequests(reqs);
            setInventoryItems(items);
            setUser(u);
            setIsLoading(false);
        }
        loadData();
    }, []);
    
    const handleUpdateRequest = async (id, status) => {
        await InventoryRequest.update(id, { status });
        const data = await InventoryRequest.list('-created_date');
        setRequests(data);
    }
    
    const onFormSubmitted = async () => {
        setShowForm(false);
        const data = await InventoryRequest.list('-created_date');
        setRequests(data);
    }

    return (
        <div className="p-4 md:p-8 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Inventory Requests</h1>
                        <p className="text-muted-foreground">Track requests for new materials and supplies.</p>
                    </div>
                     <Dialog open={showForm} onOpenChange={setShowForm}>
                        <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Request</Button></DialogTrigger>
                        <DialogContent className="dialog-content">
                            <DialogHeader><DialogTitle className="text-card-foreground">Request New Item</DialogTitle></DialogHeader>
                            <RequestForm onSubmitted={onFormSubmitted} user={user} inventoryItems={inventoryItems}/>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="space-y-4">
                    {isLoading ? <p>Loading...</p> : requests.map(req => (
                        <Card key={req.id} className="bg-card border-border">
                            <CardContent className="p-4 flex justify-between items-center">
                               <div>
                                   <p className="font-bold text-foreground">{req.quantity} {req.unit} of {req.item_name}</p>
                                   <p className="text-sm text-muted-foreground">Requested by {req.requested_by.split('@')[0]} on {format(new Date(req.created_date), 'MMM d')}</p>
                                   {req.details && <p className="text-xs text-muted-foreground">Details: {req.details}</p>}
                               </div>
                               <div className="flex items-center gap-2">
                                   <Badge>{req.status}</Badge>
                                   {user?.role === 'admin' && req.status === 'pending' && (
                                       <>
                                        <Button size="icon" variant="ghost" className="text-green-500" onClick={() => handleUpdateRequest(req.id, 'approved')}><Check className="w-4 h-4"/></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleUpdateRequest(req.id, 'rejected')}><X className="w-4 h-4"/></Button>
                                       </>
                                   )}
                               </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}