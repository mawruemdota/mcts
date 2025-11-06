import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PrinterScheduleForm({ printer, users, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    assigned_to: ''
  });

  useEffect(() => {
    if (printer) {
      setFormData({
        name: printer.name || '',
        assigned_to: printer.assigned_to || ''
      });
    } else {
      setFormData({ name: '', assigned_to: '' });
    }
  }, [printer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.assigned_to) {
        // A more user-friendly notification could be used here, like a toast
        alert('Please fill out all fields.');
        return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="printerName">Printer Name</Label>
        <Input
          id="printerName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Epson L3210"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="assignee">Assign To</Label>
        <Select
          value={formData.assigned_to}
          onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
        >
          <SelectTrigger id="assignee">
            <SelectValue placeholder="Select a team member" />
          </SelectTrigger>
          <SelectContent>
            {(users || []).map((user) => (
              <SelectItem key={user.id} value={user.email}>
                {user.nickname || user.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {printer ? 'Update Schedule' : 'Create Schedule'}
        </Button>
      </div>
    </form>
  );
}