
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, ExternalLink, BadgePercent, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PriceData } from '@/types';

interface PriceCheckerProps {
  amazonId: string;
  flipkartId: string;
  basePrice: number;
}

// SIMULATED API CALL
async function fetchPrices(amazonId: string, flipkartId: string, basePrice: number): Promise<PriceData> {
  // In a real application, this would be a server action calling a price comparison API.
  // We simulate a delay and prices that are realistically related to the base price.
  return new Promise(resolve => {
    setTimeout(() => {
      // Logic: Market prices are usually 0-20% lower than MSRP/Base Price
      const amazonFluctuation = 0.85 + (Math.random() * 0.10); // 85% to 95%
      const flipkartFluctuation = 0.80 + (Math.random() * 0.15); // 80% to 95%
      
      resolve({
        amazonPrice: Math.floor(basePrice * amazonFluctuation),
        flipkartPrice: Math.floor(basePrice * flipkartFluctuation),
      });
    }, 1000 + Math.random() * 1000);
  });
}

const PriceSkeleton = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center p-3 border rounded-lg">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
        </div>
         <div className="flex justify-between items-center p-3 border rounded-lg">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
        </div>
    </div>
);

export default function PriceChecker({ amazonId, flipkartId, basePrice }: PriceCheckerProps) {
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const amazonAffiliateTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'drivergy-21';
  const flipkartAffiliateId = process.env.NEXT_PUBLIC_FLIPKART_AFFILIATE_ID || 'shivendras';

  useEffect(() => {
    let isMounted = true;
    async function getPrices() {
      try {
        setLoading(true);
        const data = await fetchPrices(amazonId, flipkartId, basePrice);
        if (isMounted) {
          setPrices(data);
        }
      } catch (e) {
        if (isMounted) {
          setError('Could not fetch prices.');
        }
        console.error(e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    getPrices();
    return () => { isMounted = false; };
  }, [amazonId, flipkartId, basePrice]);

  const amazonUrl = `https://www.amazon.in/dp/${amazonId}/?tag=${amazonAffiliateTag}`;
  const flipkartUrl = `https://www.flipkart.com/product/p/itme?pid=${flipkartId}&affid=${flipkartAffiliateId}`;
  
  const amazonPrice = prices?.amazonPrice;
  const flipkartPrice = prices?.flipkartPrice;

  let bestPrice: 'amazon' | 'flipkart' | 'tie' | 'none' = 'none';

  if (amazonPrice && flipkartPrice) {
    if (amazonPrice < flipkartPrice) bestPrice = 'amazon';
    else if (flipkartPrice < amazonPrice) bestPrice = 'flipkart';
    else bestPrice = 'tie';
  } else if (amazonPrice) {
    bestPrice = 'amazon';
  } else if (flipkartPrice) {
    bestPrice = 'flipkart';
  }


  if (loading) {
    return <PriceSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-destructive bg-destructive/10 rounded-md">
        <AlertCircle className="mr-2 h-4 w-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex justify-between items-center p-3 border rounded-lg transition-all", bestPrice === 'amazon' && 'border-green-500 bg-green-500/10 shadow-lg')}>
        <span className="font-semibold text-foreground">Amazon</span>
        <div className="flex items-center gap-2">
            {bestPrice === 'amazon' && <span className="text-xs font-bold text-green-600 animate-pulse">Best Price!</span>}
            <span className="text-lg font-bold text-primary">
                {amazonPrice ? `₹${amazonPrice.toLocaleString('en-IN')}` : 'N/A'}
            </span>
            <Button asChild size="sm" variant="outline">
                <a href={amazonUrl} target="_blank" rel="noopener noreferrer">Buy <ExternalLink className="ml-2 h-3 w-3" /></a>
            </Button>
        </div>
      </div>
      <div className={cn("flex justify-between items-center p-3 border rounded-lg transition-all", bestPrice === 'flipkart' && 'border-green-500 bg-green-500/10 shadow-lg')}>
        <span className="font-semibold text-foreground">Flipkart</span>
        <div className="flex items-center gap-2">
            {bestPrice === 'flipkart' && <span className="text-xs font-bold text-green-600 animate-pulse">Best Price!</span>}
             <span className="text-lg font-bold text-primary">
                {flipkartPrice ? `₹${flipkartPrice.toLocaleString('en-IN')}` : 'N/A'}
            </span>
             <Button asChild size="sm" variant="outline">
                <a href={flipkartUrl} target="_blank" rel="noopener noreferrer">Buy <ExternalLink className="ml-2 h-3 w-3" /></a>
            </Button>
        </div>
      </div>
    </div>
  );
}
