import React from 'react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
            alt="MCTS Logo"
            className="h-16 w-auto opacity-75"
          />
        </div>

        {/* 404 Message */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Search className="w-16 h-16 text-gray-400" />
            <h1 className="text-9xl font-bold text-blue-600">404</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="px-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <a href={createPageUrl('Home')}>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </a>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-sm text-gray-500">
          <p>If you believe this is an error, please contact your administrator.</p>
        </div>
      </div>
    </div>
  );
}