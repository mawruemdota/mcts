import React, { useState } from 'react';
import CostingCalculator from '@/components/products/CostingCalculator';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/toaster';
import { Calculator, ArrowLeft, Wrench } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function MCTSToolbox() {
  const [selectedTool, setSelectedTool] = useState(null);

  const tools = [
    {
      id: 'costing-calculator',
      name: 'Costing Calculator',
      description: 'Calculate accurate pricing for your products with material costs, overhead, and markup strategies',
      icon: Calculator,
      color: 'bg-blue-500',
      component: CostingCalculator
    }
  ];

  const selectedToolData = tools.find(t => t.id === selectedTool);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-[#2053E6] border-b border-[#1a45c4] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <OptimizedImage
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad86205308585a8db5f4bc/7aad79b47_logo3.png"
                  alt="MCTS Logo"
                  className="h-14 w-auto"
                  objectFit="contain"
                  priority={true}
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">MCTS Toolbox</h1>
                  <p className="text-sm text-white/80 hidden sm:block">Professional Business Tools</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedTool && (
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    onClick={() => setSelectedTool(null)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Back to Tools</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                )}
                <a href={createPageUrl('Home')}>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Visit MCTS.com
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!selectedTool ? (
            <>
              {/* Tools Grid */}
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200">
                  <Wrench className="w-3 h-3 mr-1" />
                  Business Tools
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Professional Toolbox
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Free tools to help you run your business more efficiently
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <Card
                    key={tool.id}
                    className="bg-white hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-400"
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <CardContent className="p-6">
                      <div className={`${tool.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                        <tool.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.name}</h3>
                      <p className="text-gray-600 mb-4">{tool.description}</p>
                      <Button className="w-full bg-[#2053E6] hover:bg-[#1a45c4]">
                        Open Tool
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {/* Coming Soon Card */}
                <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300">
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                    <Wrench className="w-12 h-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">More Tools Coming Soon</h3>
                    <p className="text-sm text-gray-500">
                      We're constantly adding new tools to help your business grow
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* Selected Tool View */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${selectedToolData.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                    <selectedToolData.icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedToolData.name}</h2>
                </div>
                <p className="text-gray-600 ml-13">{selectedToolData.description}</p>
              </div>

              <selectedToolData.component />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-600">
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