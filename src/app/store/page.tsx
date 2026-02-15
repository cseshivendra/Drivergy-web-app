
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { fetchStoreProducts } from '@/lib/server-data';
import type { Product } from '@/types';
import { ShoppingBag, IndianRupee } from 'lucide-react';
import type { Metadata } from 'next';
import PriceChecker from './price-checker';

export const metadata: Metadata = {
    title: 'Drivergy Store | Recommended Driving Accessories',
    description: "Shop recommended accessories for new drivers and car owners. Find the best prices on essentials like phone holders, blind spot mirrors, and more.",
};

export default async function StorePage() {
  const products: Product[] = await fetchStoreProducts();

  return (
    <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-4 rounded-full mb-4">
            <ShoppingBag className="h-12 w-12" />
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Drivergy Recommended Store</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Hand-picked accessories to make your driving experience safer and more convenient. We find the best prices for you.
        </p>
      </header>
      
      {products.length === 0 ? (
        <p className="text-center text-muted-foreground text-xl">No products available at the moment. Please check back later.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {products.map((product) => (
            <Card key={product.id} className="shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col overflow-hidden rounded-xl border border-border/70 h-full">
              {product.imageSrc && (
                <div className="relative h-56 w-full bg-muted">
                  <Image 
                    src={product.imageSrc} 
                    alt={product.title} 
                    fill
                    className="object-contain" 
                    data-ai-hint={product.imageHint}
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <CardTitle className="font-headline text-xl font-semibold text-primary">{product.title}</CardTitle>
                    {product.price > 0 && (
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold flex items-center shrink-0">
                            <IndianRupee className="h-3 w-3 mr-0.5" />
                            {product.price.toLocaleString('en-IN')}
                        </div>
                    )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 flex-grow">
                <CardDescription className="text-sm text-muted-foreground">{product.description}</CardDescription>
                
                <PriceChecker 
                    amazonId={product.amazonId} 
                    flipkartId={product.flipkartId} 
                    basePrice={product.price}
                />
                
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
