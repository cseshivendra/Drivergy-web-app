'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

interface PromotionalPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const posters = [
  {
    href: "/site/register",
    imageSrc: "https://placehold.co/600x800.png",
    imageHint: "driving school promotion",
    title: "Student Discount",
    description: "Get 15% off on your first Premium plan.",
  },
  {
    href: "/site/rto-services",
    imageSrc: "https://placehold.co/600x800.png",
    imageHint: "rto license poster",
    title: "Hassle-Free RTO",
    description: "We help you with all your license needs.",
  },
  {
    href: "/site/register",
    imageSrc: "https://placehold.co/600x800.png",
    imageHint: "refer friend bonus",
    title: "Refer & Earn",
    description: "Invite friends and get rewards.",
  }
];

export default function PromotionalPopup({ isOpen, onOpenChange }: PromotionalPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline text-3xl font-bold text-primary text-center">
            Today's Special Offers!
          </DialogTitle>
          <DialogDescription className="text-center">
            Check out our latest offers and events. Click on a poster to learn more!
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posters.map((poster) => (
              <Card key={poster.title} className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden group">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
