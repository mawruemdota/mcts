import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Briefcase,
  Palette,
  Bell,
  Users,
  Package,
  DollarSign,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function GlobalSearch({ isOpen, onClose, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({
    jobs: [],
    creativeTasks: [],
    reminders: [],
    clients: [],
    suppliers: [],
    inventory: [],
    products: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setResults({
        jobs: [],
        creativeTasks: [],
        reminders: [],
        clients: [],
        suppliers: [],
        inventory: [],
        products: []
      });
      return;
    }

    setIsSearching(true);
    try {
      const lowerQuery = query.toLowerCase();
      
      const [jobs, creativeTasks, reminders, clients, suppliers, inventory, products] = await Promise.all([
        base44.entities.Job.list('-created_date', 50),
        base44.entities.CreativeTask.list('-created_date', 50),
        base44.entities.Reminder.filter({ user_email: user.email }, '-created_date', 50),
        base44.entities.Client.list('client_name', 50),
        base44.entities.Supplier.list('supplier_name', 50),
        base44.entities.InventoryItem.list('item_name', 50),
        base44.entities.PriceListItem.list('item_name', 50)
      ]);

      setResults({
        jobs: jobs.filter(j => 
          j.title?.toLowerCase().includes(lowerQuery) ||
          j.client_name?.toLowerCase().includes(lowerQuery) ||
          j.job_id?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5),
        creativeTasks: creativeTasks.filter(t =>
          t.title?.toLowerCase().includes(lowerQuery) ||
          t.client_name?.toLowerCase().includes(lowerQuery) ||
          t.request_description?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5),
        reminders: reminders.filter(r =>
          r.title?.toLowerCase().includes(lowerQuery) ||
          r.description?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5),
        clients: clients.filter(c =>
          c.client_name?.toLowerCase().includes(lowerQuery) ||
          c.phone_number?.includes(query) ||
          c.email?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5),
        suppliers: suppliers.filter(s =>
          s.supplier_name?.toLowerCase().includes(lowerQuery) ||
          s.phone_number?.includes(query) ||
          s.category?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5),
        inventory: inventory.filter(i =>
          i.item_name?.toLowerCase().includes(lowerQuery) ||
          i.category?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5),
        products: products.filter(p =>
          p.item_name?.toLowerCase().includes(lowerQuery) ||
          p.description?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5)
      });
    } catch (error) {
      console.error('Search error:', error);
    }
    setIsSearching(false);
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleResultClick = (type, id) => {
    onClose();
    setSearchQuery('');
    
    const routes = {
      job: `${createPageUrl('Dashboard')}`,
      creativeTask: `${createPageUrl('Creatives')}`,
      reminder: `${createPageUrl('Reminders')}`,
      client: `${createPageUrl('Contacts')}`,
      supplier: `${createPageUrl('Contacts')}`,
      inventory: `${createPageUrl('Inventory')}`,
      product: `${createPageUrl('ItemsAndServices')}`
    };
    
    navigate(routes[type]);
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
  };

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search across jobs, tasks, contacts, inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-140px)]">
          <div className="p-6 space-y-6">
            {searchQuery.length < 2 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Type at least 2 characters to search</p>
              </div>
            ) : totalResults === 0 && !isSearching ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <>
                {/* Jobs */}
                {results.jobs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      <h3 className="font-semibold text-sm">Jobs</h3>
                      <Badge variant="secondary" className="text-xs">{results.jobs.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {results.jobs.map(job => (
                        <div
                          key={job.id}
                          onClick={() => handleResultClick('job', job.id)}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{job.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.client_name}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Badge variant="outline" className="text-xs">{job.status?.replace('_', ' ')}</Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creative Tasks */}
                {results.creativeTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-4 h-4 text-purple-500" />
                      <h3 className="font-semibold text-sm">Creative Tasks</h3>
                      <Badge variant="secondary" className="text-xs">{results.creativeTasks.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {results.creativeTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleResultClick('creativeTask', task.id)}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{task.client_name}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Badge variant="outline" className="text-xs">{task.status?.replace('_', ' ')}</Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reminders */}
                {results.reminders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="w-4 h-4 text-yellow-500" />
                      <h3 className="font-semibold text-sm">Reminders</h3>
                      <Badge variant="secondary" className="text-xs">{results.reminders.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {results.reminders.map(reminder => (
                        <div
                          key={reminder.id}
                          onClick={() => handleResultClick('reminder', reminder.id)}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{reminder.title}</p>
                            {reminder.deadline && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(reminder.deadline), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground ml-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clients */}
                {results.clients.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-semibold text-sm">Clients</h3>
                      <Badge variant="secondary" className="text-xs">{results.clients.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {results.clients.map(client => (
                        <div
                          key={client.id}
                          onClick={() => handleResultClick('client', client.id)}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{client.client_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{client.phone_number || client.email}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground ml-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suppliers */}
                {results.suppliers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-green-500" />
                      <h3 className="font-semibold text-sm">Suppliers</h3>
                      <Badge variant="secondary" className="text-xs">{results.suppliers.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {results.suppliers.map(supplier => (
                        <div
                          key={supplier.id}
                          onClick={() => handleResultClick('supplier', supplier.id)}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{supplier.supplier_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{supplier.category}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground ml-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inventory */}
                {results.inventory.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-orange-500" />
                      <h3 className="font-semibold text-sm">Inventory</h3>
                      <Badge variant="secondary" className="text-xs">{results.inventory.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {results.inventory.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleResultClick('inventory', item.id)}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground ml-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                {results.products.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-semibold text-sm">Products & Services</h3>
                      <Badge variant="secondary" className="text-xs">{results.products.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {results.products.map(product => (
                        <div
                          key={product.id}
                          onClick={() => handleResultClick('product', product.id)}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.item_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              ₱{product.price_conservative?.toFixed(2)} / {product.unit}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground ml-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {totalResults > 0 && (
          <div className="px-6 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Showing top {totalResults} results · Press ESC to close
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}