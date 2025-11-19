import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function DynamicFormPage() {
  const [formDefinition, setFormDefinition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [clientInfo, setClientInfo] = useState({
    client_name: '',
    client_phone: '',
    client_email: ''
  });
  
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const loadForm = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const formId = urlParams.get('id');
      
      if (!formId) {
        setError('No form ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const forms = await base44.entities.FormDefinition.filter({ id: formId, is_active: true });
        
        if (forms.length === 0) {
          setError('Form not found or inactive');
          setIsLoading(false);
          return;
        }

        const form = forms[0];
        setFormDefinition(form);
        
        // Initialize form data
        const initialData = {};
        form.fields?.forEach(field => {
          initialData[field.field_id] = field.type === 'checkbox' ? false : '';
        });
        setFormData(initialData);
      } catch (err) {
        console.error('Error loading form:', err);
        setError('Failed to load form');
      }
      
      setIsLoading(false);
    };

    loadForm();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clientInfo.client_name || !clientInfo.client_phone) {
      setError('Please provide your name and contact number');
      return;
    }

    // Validate required fields
    const missingFields = formDefinition.fields
      ?.filter(field => field.required && !formData[field.field_id])
      .map(field => field.label);
    
    if (missingFields && missingFields.length > 0) {
      setError(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await base44.entities.FormSubmission.create({
        form_definition_id: formDefinition.id,
        form_name: formDefinition.form_name,
        client_name: clientInfo.client_name,
        client_phone: clientInfo.client_phone,
        client_email: clientInfo.client_email || null,
        form_data: formData,
        status: 'new'
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit form. Please try again.');
    }

    setIsSubmitting(false);
  };

  const renderField = (field) => {
    const value = formData[field.field_id] || '';
    const onChange = (newValue) => {
      setFormData({ ...formData, [field.field_id]: newValue });
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'phone':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={onChange} required={field.required}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value}
              onCheckedChange={onChange}
              required={field.required}
            />
            <span className="text-sm">{field.placeholder || 'Check to agree'}</span>
          </div>
        );
      
      default: // text
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !formDefinition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Form Not Available</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <a href={createPageUrl('Home')}>
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-center text-2xl">Form Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Thank you for your submission. We have received your information and will get back to you soon.
            </p>
            <a href={createPageUrl('Home')}>
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{formDefinition.form_name}</CardTitle>
            {formDefinition.description && (
              <p className="text-gray-600 mt-2">{formDefinition.description}</p>
            )}
            {formDefinition.service_name && (
              <p className="text-sm text-blue-600 mt-1">Service: {formDefinition.service_name}</p>
            )}
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Required Client Information */}
              <div className="space-y-4 pb-6 border-b">
                <h3 className="font-semibold text-lg">Your Information</h3>
                
                <div>
                  <Label htmlFor="client_name">Full Name *</Label>
                  <Input
                    id="client_name"
                    value={clientInfo.client_name}
                    onChange={(e) => setClientInfo({ ...clientInfo, client_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="client_phone">Contact Number *</Label>
                  <Input
                    id="client_phone"
                    type="tel"
                    value={clientInfo.client_phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, client_phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="client_email">Email Address (Optional)</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={clientInfo.client_email}
                    onChange={(e) => setClientInfo({ ...clientInfo, client_email: e.target.value })}
                  />
                </div>
              </div>

              {/* Dynamic Form Fields */}
              {formDefinition.fields && formDefinition.fields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Additional Information</h3>
                  {formDefinition.fields.map((field) => (
                    <div key={field.field_id}>
                      <Label htmlFor={field.field_id}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}