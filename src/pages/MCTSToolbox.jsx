import React from 'react';
import CostingCalculator from '@/components/products/CostingCalculator';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';

export default function MCTSToolbox() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <OptimizedImage
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
                  alt="MCTS Logo"
                  className="w-10 h-10"
                  objectFit="contain"
                  priority={true}
                />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MCTS Toolbox</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Professional Business Tools</p>
                </div>
              </div>
              <a
                href="https://mcts.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Visit MCTS.com
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-6 p-6 bg-white dark:bg-slate-900">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Costing Calculator</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Calculate accurate pricing for your products with our professional costing tool
              </p>
            </div>
          </Card>

          <CostingCalculator />
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
              <p>© 2025 MCTS. All rights reserved.</p>
              <p className="mt-1">Multi-Creative Tech Services - Your Partner in Creative Solutions</p>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </>
  );
}