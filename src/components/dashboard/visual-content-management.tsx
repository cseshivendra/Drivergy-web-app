
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Edit, Loader2, Link as LinkIcon, ExternalLink, ImagePlay } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { VisualContentSchema, type VisualContentFormValues, type SiteBanner, type PromotionalPoster } from '@/types';
import { updateSiteBanner, updatePromotionalPoster } from '@/lib/mock-data';
import Link from 'next/link';

type ContentItem = (SiteBanner | PromotionalPoster) & { type: 'banner' | 'poster' };

function VisualContentForm({ item, onFormSubmit }: { item: ContentItem; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<VisualContentFormValues>({
    resolver: zodResolver(VisualContentSchema),
    defaultValues: {
      title: item.title,
      description: item.description,
      imageSrc: item.imageSrc,
      imageHint: item.imageHint,
      href: 'href' in item ? item.href : undefined,
    },
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (data: VisualContentFormValues) => {
    try {
      if (item.type === 'banner') {
        await updateSiteBanner(item.id, data);
      } else {
        await updatePromotionalPoster(item.id, data);
      }
      toast({ title: "Content Updated", description: "The visual content has been successfully updated." });
      onFormSubmit();
      setOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Visual Content</DialogTitle>
          <DialogDescription>Update the details for this visual element.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="imageSrc" render={({ field }) => ( <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="imageHint" render={({ field }) => ( <FormItem><FormLabel>Image Hint</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            {item.type === 'poster' && (
              <FormField control={form.control} name="href" render={({ field }) => ( <FormItem><FormLabel>Link URL (e.g., /site/register)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function VisualContentManagement({ title, banners, posters, isLoading, onAction }: { title: ReactNode; banners: SiteBanner[]; posters: PromotionalPoster[], isLoading: boolean; onAction: () => void }) {
  const allContent: ContentItem[] = [
    ...banners.map(b => ({ ...b, type: 'banner' as const })),
    ...posters.map(p => ({ ...p, type: 'poster' as const })),
  ];

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(3).fill(0).map((_, i) => (
         <Card key={`visual-skeleton-${i}`} className="flex flex-col"><CardContent className="p-4"><Skeleton className="w-full h-64" /></CardContent></Card>
      ))}
    </div>
  );

  return (
    <Card className="shadow-lg border-primary">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-semibold flex items-center">
          <ImagePlay className="inline-block mr-3 h-6 w-6 align-middle" />
          {title}
        </CardTitle>
        <CardDescription>Update images and text for key visual elements across the site.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          renderSkeletons()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allContent.map(item => (
              <Card key={item.id} className="overflow-hidden flex flex-col">
                <CardHeader className="p-4 bg-muted/50">
                    <CardTitle className="text-base flex items-center gap-2">
                        {item.type === 'banner' ? <ImageIcon className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                        {item.type === 'banner' ? `Hero Banner #${banners.indexOf(item as SiteBanner) + 1}` : `Promo Poster #${posters.indexOf(item as PromotionalPoster) + 1}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col">
                  <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden mb-4">
                    <Image src={item.imageSrc} alt={item.title} layout="fill" objectFit="cover" />
                  </div>
                  <div className="space-y-2 flex-grow">
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 bg-muted/50 border-t flex justify-end">
                  <VisualContentForm item={item} onFormSubmit={onAction} />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
