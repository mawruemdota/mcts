
import React, { useState, useEffect, useCallback } from "react";
import { ShopCashRecord, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Plus,
  CalendarIcon,
  Edit,
  Download,
  ArrowUp,
  ArrowDown,
  Trash
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import {
    AlertDialog, // Keep AlertDialog for general use, but delete confirmation will use Dialog now
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define categories for consistent use in form and filters
const categories = [
  { value: 'sales_payment', label: 'Sales Payment' },
  { value: 'supplies_purchase', label: 'Supplies Purchase' },
  { value: 'office_expenses', label: 'Office Expenses' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'petty_cash', label: 'Petty Cash' },
  { value: 'other', label: 'Other' },
];

const ShopCashForm = ({ onSubmitted, record }) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState(record ? {
    ...record,
    transaction_date: parseISO(record.transaction_date), // Parse date string to Date object
    amount: record.amount // Ensure amount is passed as a number
  } : {
    transaction_date: new Date(),
    type: 'cash_out',
    category: 'other',
    amount: '',
    description: '',
    received_by: '',
    receipt_number: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        transaction_date: format(formData.transaction_date, 'yyyy-MM-dd')
      };

      if(record?.id) {
         await ShopCashRecord.update(record.id, dataToSubmit);
         toast({ title: "Success", description: "Cash record updated." });
      } else {
         await ShopCashRecord.create(dataToSubmit);
         toast({ title: "Success", description: "Cash record added." });
      }
      onSubmitted();
    } catch (error) {
      console.error("Failed to save record:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save record." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Transaction Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.transaction_date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.transaction_date}
                      onSelect={(date) => setFormData({...formData, transaction_date: date})}
                    />
                  </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash_in">Cash In</SelectItem>
                    <SelectItem value="cash_out">Cash Out</SelectItem>
                  </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || ''})} required />
            </div>
        </div>

        <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="e.g., Purchase of ink cartridges" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Received By / Paid To</Label>
                <Input value={formData.received_by} onChange={e => setFormData({...formData, received_by: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label>Receipt Number</Label>
                <Input placeholder="Optional" value={formData.receipt_number} onChange={e => setFormData({...formData, receipt_number: e.target.value})} />
            </div>
        </div>

        <div className="flex justify-end">
            <Button type="submit">{record ? 'Update' : 'Add'} Record</Button>
        </div>
    </form>
  );
};


export default function ShopCashPage() {
  const [records, setRecords] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const { toast } = useToast();

  // New state for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'cash_in', 'cash_out'
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' or specific category value

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [recordsData, userData] = await Promise.all([
      ShopCashRecord.list("-transaction_date"),
      User.me()
    ]);
    setRecords(recordsData);
    setUser(userData);
    setIsLoading(false);
  };

  const handleFormSubmitted = () => {
    loadData();
    setShowForm(false);
    setRecordToEdit(null); // Clear editing record
  };

  const handleEditRecord = (record) => {
    setRecordToEdit(record);
    setShowForm(true);
  };

  const calculateSummary = () => {
    // Summary calculation remains on all records, not filtered ones
    const cashIn = records.filter(r => r.type === 'cash_in').reduce((sum, r) => sum + r.amount, 0);
    const cashOut = records.filter(r => r.type === 'cash_out').reduce((sum, r) => sum + r.amount, 0);
    return { cashIn, cashOut, balance: cashIn - cashOut };
  };

  const { cashIn, cashOut, balance } = calculateSummary();

  // Filtered records logic
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.received_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.receipt_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || record.type === filterType;

    const matchesCategory = filterCategory === 'all' || record.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const handleDeleteRecord = async (recordId) => {
    try {
      await ShopCashRecord.delete(recordId);
      toast({ title: "Success", description: "Cash record deleted." });
      loadData();
    } catch (error) {
      console.error("Failed to delete record:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete record." });
    }
  };

  return (
    <div className="p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Shop Cash Ledger</h1>
            <p className="text-muted-foreground mt-1">Track cash flow in and out of the office.</p>
          </div>
          <Dialog open={showForm} onOpenChange={(isOpen) => {
              if(!isOpen) setRecordToEdit(null); // Clear recordToEdit when dialog closes
              setShowForm(isOpen);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setRecordToEdit(null)}><Plus className="w-4 h-4 mr-2" />Add Cash Record</Button>
            </DialogTrigger>
            <DialogContent className="dialog-content">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">{recordToEdit ? 'Edit' : 'New'} Cash Record</DialogTitle>
              </DialogHeader>
              <ShopCashForm onSubmitted={handleFormSubmitted} record={recordToEdit} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Balance Card */}
          <Card className="md:col-span-2 bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-foreground">Current Cash Balance</CardTitle>
              <Wallet className="w-6 h-6 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-5xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                ₱{balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">This is the current available cash on hand.</p>
            </CardContent>
          </Card>

          {/* Cash In and Cash Out Cards */}
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Cash In</CardTitle>
                <ArrowUpCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">₱{cashIn.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Cash Out</CardTitle>
                <ArrowDownCircle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">₱{cashOut.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Records List / Transactions Card */}
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Transactions</CardTitle>
            <div className="flex flex-col md:flex-row items-center gap-2 mt-2">
              <Input
                placeholder="Search description, category, etc."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto flex-grow"
              />
              <div className="flex w-full md:w-auto gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-auto">
                    <SelectValue placeholder="Filter Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cash_in">Cash In</SelectItem>
                    <SelectItem value="cash_out">Cash Out</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-auto">
                    <SelectValue placeholder="Filter Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-foreground whitespace-nowrap">Type</TableHead>
                    <TableHead className="text-foreground whitespace-nowrap">Category</TableHead>
                    <TableHead className="text-foreground">Description</TableHead>
                    <TableHead className="text-foreground whitespace-nowrap">Handled By</TableHead>
                    <TableHead className="text-right text-foreground whitespace-nowrap">Amount</TableHead>
                    <TableHead className="text-right text-foreground whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan="7" className="text-center p-4 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredRecords.length > 0 ? (
                    filteredRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">{format(parseISO(record.transaction_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {record.type === 'cash_in' ? (
                            <span className="flex items-center text-green-500"><ArrowUp className="w-3 h-3 mr-1" />Cash In</span>
                          ) : (
                            <span className="flex items-center text-red-500"><ArrowDown className="w-3 h-3 mr-1" />Cash Out</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap capitalize">{record.category.replace('_', ' ')}</TableCell>
                        <TableCell className="text-foreground">{record.description}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.received_by}</TableCell>
                        <TableCell className={`text-right font-medium whitespace-nowrap ${record.type === 'cash_in' ? 'text-green-500' : 'text-red-500'}`}>
                          {record.type === 'cash_in' ? '+' : '-'} ₱{record.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                           <div className="flex justify-end items-center gap-1">
                             <Button variant="ghost" size="icon" onClick={() => handleEditRecord(record)}>
                               <Edit className="w-4 h-4" />
                             </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500"><Trash className="w-4 h-4" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Are you sure?</DialogTitle>
                                  <DialogDescription>
                                    This action cannot be undone. This will permanently delete the transaction record.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                  <Button variant="destructive" onClick={() => {
                                    handleDeleteRecord(record.id);
                                    // Manually click the close button for the dialog, common workaround
                                    const closeButton = document.querySelector('[aria-label="Close"]');
                                    if(closeButton) closeButton.click();
                                  }}>Delete</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan="7" className="text-center h-24 text-muted-foreground">No cash records found for the current filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
