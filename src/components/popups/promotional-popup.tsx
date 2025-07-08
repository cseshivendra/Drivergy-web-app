
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { listenToPromotionalPosters } from '@/lib/mock-data';
import type { PromotionalPoster } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface PromotionalPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function PromotionalPopup({ isOpen, onOpenChange }: PromotionalPopupProps) {
  const [posters, setPosters] = useState<PromotionalPoster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const unsubscribe = listenToPromotionalPosters((data) => {
        setPosters(data);
        setLoading(false);
      });
      
      // Cleanup the listener when the popup is closed or component unmounts
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen]);

  const renderSkeletons = () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-lg overflow-hidden">
              <Skeleton className="h-96 w-full" />
            </Card>
        ))}
      </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[calc(100%-2rem)] sm:w-full p-0 flex flex-col max-h-[85vh] rounded-lg">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="font-headline text-3xl font-bold text-primary text-center">
            Today's Special Offers!
          </DialogTitle>
          <DialogDescription className="text-center">
            Check out our latest offers and events. Click on a poster to learn more!
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 overflow-y-auto flex-grow">
          {loading ? (
            renderSkeletons()
          ) : posters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {posters.map((poster) => (
                <Card key={poster.id} className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden group">
                  <Link href={poster.href} onClick={() => onOpenChange(false)}>
                    <div className="relative h-96 w-full">
                      <Image
                        src={poster.imageSrc}
                        alt={poster.title}
                        layout="fill"
                        objectFit="cover"
                        className="group-hover:scale-105 transition-transform duration-500"
                        data-ai-hint={poster.imageHint}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6">
                        <h3 className="text-2xl font-bold text-white font-headline drop-shadow-md">{poster.title}</h3>
                        <p className="text-white/90 mt-1 drop-shadow-sm">{poster.description}</p>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground p-8">
                <AlertCircle className="h-12 w-12 mb-4 text-primary/50" />
                <h3 className="text-xl font-semibold text-foreground">No Offers Today</h3>
                <p>There are no special offers available at the moment. Please check back later!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
