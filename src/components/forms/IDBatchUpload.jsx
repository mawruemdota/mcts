
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, X, Calendar as CalendarIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { IDPrintRecord } from '@/entities/all';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function IDBatchUpload({ clients, onSubmitted }) {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedRecords, setExtractedRecords] = useState([]);
    const [bulkClient, setBulkClient] = useState('');
    const [bulkDate, setBulkDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [bulkPrice, setBulkPrice] = useState(50);
    const { toast } = useToast();

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsProcessing(true);
        const newExtractedRecords = [];

        for (const file of files) {
            try {
                // Upload file first
                const { file_url } = await base44.integrations.Core.UploadFile({ file });

                // Define the JSON schema for extraction
                const schema = {
                    type: "object",
                    properties: {
                        employee_name: { type: "string" },
                        position: { type: "string" },
                        id_number: { type: "string" }
                    }
                };

                // Extract data from the uploaded image
                const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
                    file_url: file_url,
                    json_schema: schema
                });

                if (result.status === 'success' && result.output) {
                    newExtractedRecords.push({
                        ...result.output,
                        print_date: bulkDate,
                        original_file_name: file.name
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Extraction Failed',
                        description: `Could not extract data from ${file.name}: ${result.details || 'Unknown error'}`
                    });
                }
            } catch (error) {
                console.error('Error processing file:', error);
                toast({
                    variant: 'destructive',
                    title: 'Upload Error',
                    description: `Failed to process ${file.name}`
                });
            }
        }

        setExtractedRecords([...extractedRecords, ...newExtractedRecords]);
        setUploadedFiles([...uploadedFiles, ...files]);
        setIsProcessing(false);

        if (newExtractedRecords.length > 0) {
            toast({
                title: 'Success',
                description: `Extracted data from ${newExtractedRecords.length} ID card(s)`
            });
        }
    };

    const updateRecord = (index, field, value) => {
        const updated = [...extractedRecords];
        updated[index][field] = value;
        setExtractedRecords(updated);
    };

    const removeRecord = (index) => {
        setExtractedRecords(extractedRecords.filter((_, i) => i !== index));
    };

    const applyBulkDate = () => {
        const updated = extractedRecords.map(record => ({
            ...record,
            print_date: bulkDate
        }));
        setExtractedRecords(updated);
        toast({ description: 'Date applied to all records' });
    };

    const handleSaveAll = async () => {
        if (!bulkClient) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a client for all records.' });
            return;
        }

        if (extractedRecords.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No records to save.' });
            return;
        }

        const client = clients.find(c => c.id === bulkClient);
        if (!client) {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid client selected.' });
            return;
        }

        try {
            for (const record of extractedRecords) {
                if (record.employee_name && record.employee_name.trim()) {
                    await IDPrintRecord.create({
                        employee_name: record.employee_name,
                        id_number: record.id_number || '',
                        position: record.position || '',
                        client_id: client.id,
                        client_name: client.client_name,
                        print_date: record.print_date,
                        unit_price: bulkPrice,
                        status: 'printed' // Changed from 'for_print' to 'printed'
                    });
                }
            }

            toast({ title: 'Success', description: `${extractedRecords.length} ID records created successfully.` });
            setExtractedRecords([]);
            setUploadedFiles([]);
            setBulkClient('');
            onSubmitted();
        } catch (error) {
            console.error('Error saving records:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save ID records.' });
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Upload ID Card Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="id-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload ID Images
                                    </>
                                )}
                            </div>
                            <Input
                                id="id-upload"
                                type="file"
                                accept="image/*,.pdf"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isProcessing}
                            />
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Upload multiple ID card images. AI will extract employee details automatically.
                        </p>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            {uploadedFiles.length} file(s) uploaded
                        </div>
                    )}
                </CardContent>
            </Card>

            {extractedRecords.length > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Review & Configure ({extractedRecords.length} Records)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Bulk Settings */}
                        <div className="p-4 bg-secondary/50 rounded-lg space-y-4">
                            <h4 className="font-semibold text-foreground">Bulk Settings (Apply to All)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Client/Company *</Label>
                                    <Select value={bulkClient} onValueChange={setBulkClient}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Print Date (Bulk)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={bulkDate}
                                            onChange={e => setBulkDate(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={applyBulkDate}
                                            size="sm"
                                        >
                                            Apply to All
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit Price (₱)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={bulkPrice}
                                        onChange={e => setBulkPrice(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Individual Records */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-foreground">Extracted Records (Review & Edit)</h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {extractedRecords.map((record, index) => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 bg-background border border-border rounded-lg items-end">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Employee Name</Label>
                                            <Input
                                                placeholder="Name"
                                                value={record.employee_name || ''}
                                                onChange={e => updateRecord(index, 'employee_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">ID Number</Label>
                                            <Input
                                                placeholder="ID #"
                                                value={record.id_number || ''}
                                                onChange={e => updateRecord(index, 'id_number', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Position</Label>
                                            <Input
                                                placeholder="Position"
                                                value={record.position || ''}
                                                onChange={e => updateRecord(index, 'position', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Print Date</Label>
                                            <Input
                                                type="date"
                                                value={record.print_date}
                                                onChange={e => updateRecord(index, 'print_date', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeRecord(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Records: {extractedRecords.length}</p>
                                <p className="text-lg font-semibold text-foreground">
                                    Total: ₱{(bulkPrice * extractedRecords.length).toFixed(2)}
                                </p>
                            </div>
                            <Button onClick={handleSaveAll} disabled={!bulkClient}>
                                Save All {extractedRecords.length} Records
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
