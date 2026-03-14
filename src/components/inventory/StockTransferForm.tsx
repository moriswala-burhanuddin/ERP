import { useState } from 'react';
import { useERPStore, Product, Store } from '@/lib/store-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

interface StockTransferFormProps {
    onSuccess?: () => void;
    initialProductId?: string;
}

export function StockTransferForm({ onSuccess, initialProductId }: StockTransferFormProps) {
    const { products, stores, processStockTransfer, activeStoreId } = useERPStore();
    const [productId, setProductId] = useState(initialProductId || '');
    const [fromStoreId, setFromStoreId] = useState(activeStoreId || '');
    const [toStoreId, setToStoreId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || !fromStoreId || !toStoreId || !quantity) {
            toast.error('Please fill all fields');
            return;
        }

        if (fromStoreId === toStoreId) {
            toast.error('Source and destination stores must be different');
            return;
        }

        setIsSubmitting(true);
        try {
            await processStockTransfer({
                productId,
                fromStoreId,
                toStoreId,
                quantity: parseFloat(quantity),
            });
            toast.success('Stock transfer initiated successfully');
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Failed to process transfer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>From Store</Label>
                    <Select value={fromStoreId} onValueChange={setFromStoreId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            {stores.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name} - {s.branch}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>To Store</Label>
                    <Select value={toStoreId} onValueChange={setToStoreId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Destination" />
                        </SelectTrigger>
                        <SelectContent>
                            {stores.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name} - {s.branch}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity to transfer"
                />
            </div>

            <Button type="submit" className="w-full font-bold uppercase tracking-widest" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Execute Transfer'}
            </Button>
        </form>
    );
}
