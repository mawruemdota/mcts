import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Calculator, TrendingDown, TrendingUp, Minus, Save, Users, Zap, Wrench, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { PriceListItem } from '@/entities/all';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const SaveToPricelistForm = ({ productInfo, onSaveSuccess }) => {
    const [formData, setFormData] = useState({
        item_name: productInfo.name || '',
        category: 'item',
        unit: '',
        description: productInfo.description || '',
        price_aggressive: productInfo.prices.aggressive,
        price_conservative: productInfo.prices.conservative,
        price_extreme: productInfo.prices.extreme,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await PriceListItem.create(formData);
            toast({ title: "Success", description: "Product saved to pricelist." });
            onSaveSuccess();
            document.getElementById('close-save-dialog')?.click();
        } catch (error) {
            console.error("Failed to save product:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to save product." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
            <Label>Product Name</Label>
            <Input value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} required/>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category:v})}>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="item">Item</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="e.g., piece, sq ft" required/>
            </div>
        </div>
        <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
        </div>
        <div className="p-4 bg-secondary rounded-lg">
            <h4 className="font-semibold mb-2">Calculated Prices (per unit)</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">Aggressive</p>
                    <p className="font-medium">₱{formData.price_aggressive.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Conservative</p>
                    <p className="font-medium">₱{formData.price_conservative.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Extreme</p>
                    <p className="font-medium">₱{formData.price_extreme.toFixed(2)}</p>
                </div>
            </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" id="close-save-dialog">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !formData.item_name || !formData.unit}>
                {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
        </DialogFooter>
      </form>
    );
}

export default function CostingCalculator({ onSaveSuccess }) {
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [usualQuantity, setUsualQuantity] = useState(1);
    const [materials, setMaterials] = useState([
        { id: 1, name: '', pricePerPack: 0, itemsPerPack: 1, quantityNeeded: 1 }
    ]);
    const [overheadPercentages, setOverheadPercentages] = useState({
        employee: 25, // 25%
        electricity: 5, // 5%
        equipmentDepreciation: 10, // 10%
        other: 15 // 15% (rent, marketing, etc.)
    });
    const [pricingMultipliers, setPricingMultipliers] = useState({
        aggressive: 1.2, // 20% markup
        conservative: 1.5, // 50% markup
        extreme: 2.0 // 100% markup
    });
    const { toast } = useToast();
    const [baseCostPerUnit, setBaseCostPerUnit] = useState(0);

    const addMaterial = () => {
        const newId = Math.max(...materials.map(m => m.id), 0) + 1;
        setMaterials([...materials, {
            id: newId,
            name: '',
            pricePerPack: 0,
            itemsPerPack: 1,
            quantityNeeded: 1
        }]);
    };

    const removeMaterial = (id) => {
        if (materials.length > 1) {
            setMaterials(materials.filter(m => m.id !== id));
        }
    };

    const updateMaterial = (id, field, value) => {
        setMaterials(materials.map(m =>
            m.id === id ? { ...m, [field]: field === 'name' ? value : parseFloat(value) || 0 } : m
        ));
    };

    const updateOverhead = (field, value) => {
        setOverheadPercentages(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const updatePricingMultiplier = (field, value) => {
        setPricingMultipliers(prev => ({ ...prev, [field]: parseFloat(value) || 1 }));
    };

    // Calculations
    const materialCosts = materials.map(material => {
        const costPerItem = (material.pricePerPack / (material.itemsPerPack || 1)) * material.quantityNeeded;
        return {
            ...material,
            costPerItem: costPerItem
        };
    });

    const totalMaterialCost = materialCosts.reduce((sum, material) => sum + material.costPerItem, 0);

    const totalOverheadPercentage = Object.values(overheadPercentages).reduce((sum, percentage) => sum + percentage, 0);
    const overheadCost = totalMaterialCost * (totalOverheadPercentage / 100);

    useEffect(() => {
        const cost = totalMaterialCost + overheadCost;
        setBaseCostPerUnit(cost);
    }, [totalMaterialCost, overheadCost]);

    const baseCostPerQuantity = baseCostPerUnit * usualQuantity;

    const pricingStrategies = {
        aggressive: baseCostPerQuantity * pricingMultipliers.aggressive,
        conservative: baseCostPerQuantity * pricingMultipliers.conservative,
        extreme: baseCostPerQuantity * pricingMultipliers.extreme
    };

    const unitPrices = {
        aggressive: baseCostPerUnit * pricingMultipliers.aggressive,
        conservative: baseCostPerUnit * pricingMultipliers.conservative,
        extreme: baseCostPerUnit * pricingMultipliers.extreme,
    };

    const resetCalculator = () => {
        setProductName('');
        setProductDescription('');
        setUsualQuantity(1);
        setMaterials([{ id: 1, name: '', pricePerPack: 0, itemsPerPack: 1, quantityNeeded: 1 }]);
        setOverheadPercentages({ employee: 25, electricity: 5, equipmentDepreciation: 10, other: 15 });
        setPricingMultipliers({ aggressive: 1.2, conservative: 1.5, extreme: 2.0 });
        toast({ title: "Calculator Reset", description: "All values have been reset to defaults." });
    };

    const overheadConfig = [
        { key: 'employee', label: 'Employee', icon: Users },
        { key: 'electricity', label: 'Electricity', icon: Zap },
        { key: 'equipmentDepreciation', label: 'Equipment', icon: Wrench },
        { key: 'other', label: 'Other', icon: Package }
    ];

    const pricingConfig = [
        { key: 'aggressive', label: 'Aggressive', icon: TrendingDown, color: 'text-blue-500' },
        { key: 'conservative', label: 'Conservative', icon: Minus, color: 'text-green-500' },
        { key: 'extreme', label: 'Extreme', icon: TrendingUp, color: 'text-red-500' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Costing Calculator</h2>
                    <p className="text-sm text-muted-foreground">Calculate accurate pricing for your products</p>
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default" disabled={!productName || baseCostPerUnit === 0}>
                                <Save className="w-4 h-4 mr-2" />
                                Save to Products
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Save New Product</DialogTitle>
                            </DialogHeader>
                            <SaveToPricelistForm
                                productInfo={{
                                    name: productName,
                                    description: productDescription,
                                    prices: unitPrices
                                }}
                                onSaveSuccess={onSaveSuccess}
                            />
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={resetCalculator}>
                        Reset Calculator
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Input Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Product Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="e.g., Business Card, Tarpaulin 3x2ft"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Usual Quantity Per Selling</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        value={usualQuantity}
                                        onChange={(e) => setUsualQuantity(parseInt(e.target.value) || 1)}
                                        placeholder="1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={productDescription}
                                    onChange={(e) => setProductDescription(e.target.value)}
                                    placeholder="Brief description of the product specifications"
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Materials Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Materials & Components</CardTitle>
                                <Button onClick={addMaterial} size="sm">
                                    <Plus className="w-4 h-4 mr-1" /> Add Material
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {materials.map((material) => (
                                <div key={material.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <div className="flex-1 grid grid-cols-5 gap-3">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Material Name</Label>
                                            <Input
                                                value={material.name}
                                                onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                                                placeholder="e.g., Photo Paper"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Price per Pack (₱)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={material.pricePerPack}
                                                onChange={(e) => updateMaterial(material.id, 'pricePerPack', e.target.value)}
                                                placeholder="0.00"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Items per Pack</Label>
                                            <Input
                                                type="number"
                                                step="1"
                                                value={material.itemsPerPack}
                                                onChange={(e) => updateMaterial(material.id, 'itemsPerPack', e.target.value)}
                                                placeholder="1"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Qty Needed</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={material.quantityNeeded}
                                                onChange={(e) => updateMaterial(material.id, 'quantityNeeded', e.target.value)}
                                                placeholder="1"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Cost</Label>
                                            <div className="px-3 py-2 bg-secondary rounded text-sm font-medium mt-1">
                                                ₱{materialCosts.find(m => m.id === material.id)?.costPerItem.toFixed(2) || '0.00'}
                                            </div>
                                        </div>
                                    </div>
                                    {materials.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeMaterial(material.id)}
                                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Overhead Costs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Overhead Costs</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {overheadConfig.map(({ key, label, icon: Icon }) => (
                                <div key={key} className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm">
                                        <Icon className="w-4 h-4 text-muted-foreground" />
                                        {label}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={overheadPercentages[key]}
                                            onChange={(e) => updateOverhead(key, e.target.value)}
                                            className="w-24"
                                        />
                                        <span className="text-muted-foreground">%</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Pricing Strategy Multipliers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Pricing Strategy Multipliers</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {pricingConfig.map(({ key, label, icon: Icon, color }) => (
                                <div key={key} className="space-y-2">
                                    <Label className={`flex items-center gap-2 ${color}`}>
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">x</span>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={pricingMultipliers[key]}
                                            onChange={(e) => updatePricingMultiplier(key, e.target.value)}
                                            className="w-24"
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Results */}
                <div className="space-y-6">
                    {/* Cost Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Cost Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">Material Costs:</span>
                                    <span className="font-medium">₱{totalMaterialCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Overhead ({totalOverheadPercentage.toFixed(1)}%):</span>
                                    <span className="font-medium">₱{overheadCost.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-sm">
                                    <span>Base Cost (per unit):</span>
                                    <span className="font-medium">₱{baseCostPerUnit.toFixed(2)}</span>
                                </div>
                                {usualQuantity > 1 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Quantity ({usualQuantity} units):</span>
                                        <span className="font-medium">×{usualQuantity}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total Base Cost:</span>
                                    <span>₱{baseCostPerQuantity.toFixed(2)}</span>
                                </div>
                            </div>

                            {productName && (
                                <div className="mt-4 p-3 bg-secondary rounded">
                                    <p className="font-medium">{productName}</p>
                                    {productDescription && (
                                        <p className="text-xs text-muted-foreground mt-1">{productDescription}</p>
                                    )}
                                    {usualQuantity > 1 && (
                                        <p className="text-xs text-muted-foreground">Usual quantity: {usualQuantity} units</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pricing Strategies */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Pricing Strategies</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium text-blue-700">Aggressive</span>
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                            {((pricingMultipliers.aggressive - 1) * 100).toFixed(0)}% markup
                                        </Badge>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">₱{pricingStrategies.aggressive.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">For {usualQuantity} unit(s)</p>
                                </div>

                                <div className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <Minus className="w-4 h-4 text-green-500" />
                                            <span className="font-medium text-green-700">Conservative</span>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                            {((pricingMultipliers.conservative - 1) * 100).toFixed(0)}% markup
                                        </Badge>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">₱{pricingStrategies.conservative.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">For {usualQuantity} unit(s)</p>
                                </div>

                                <div className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-red-500" />
                                            <span className="font-medium text-red-700">Extreme</span>
                                        </div>
                                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                                            {((pricingMultipliers.extreme - 1) * 100).toFixed(0)}% markup
                                        </Badge>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">₱{pricingStrategies.extreme.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">For {usualQuantity} unit(s)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}