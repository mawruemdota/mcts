import React, { useState, useEffect } from "react";
import { Transaction } from "@/entities/all";
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
  Plus
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BudgetTrackerPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    const data = await Transaction.list("-transaction_date");
    setTransactions(data);
    setIsLoading(false);
  };

  const calculateSummary = () => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const { income, expense, balance } = calculateSummary();
  
  const TransactionForm = ({ onSubmitted }) => {
    const [formData, setFormData] = useState({
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense',
      category: 'other',
      amount: '',
      description: ''
    });
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      await Transaction.create(formData);
      onSubmitted();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-card-foreground">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="job_payment">Job Payment</SelectItem>
                <SelectItem value="supplies">Supplies</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="salaries">Salaries</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || ''})} />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Description</Label>
          <Input placeholder="e.g., Purchase of new ink cartridges" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit">Add Transaction</Button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budget Tracker</h1>
            <p className="text-muted-foreground mt-1">Monitor your business's income and expenses.</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Transaction</Button>
            </DialogTrigger>
            <DialogContent className="dialog-content">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">New Transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm onSubmitted={() => { loadTransactions(); setShowForm(false); }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Income</CardTitle>
              <ArrowUpCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">₱{income.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Expenses</CardTitle>
              <ArrowDownCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">₱{expense.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Net Balance</CardTitle>
              <Wallet className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                ₱{balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Transaction List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Date</TableHead>
                  <TableHead className="text-foreground">Description</TableHead>
                  <TableHead className="text-foreground">Category</TableHead>
                  <TableHead className="text-right text-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan="4" className="text-center p-4 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : transactions.length > 0 ? (
                  transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-muted-foreground">{format(new Date(t.transaction_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-foreground">{t.description}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{t.category.replace('_', ' ')}</TableCell>
                      <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'} ₱{t.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan="4" className="text-center h-24 text-muted-foreground">No transactions yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}