
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Edit, Loader2, Link as LinkIcon, ImagePlay, FileUp, Search, PlusCircle, Trash2 } from 'lucide-react';
import NextImage from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { VisualContentSchema, type VisualContentFormValues, type SiteBanner, type PromotionalPoster } from '@/types';
import { updateSiteBanner, updatePromotionalPoster, addSiteBanner, addPromotionalPoster, deleteSiteBanner, deletePromotionalPoster, fetchUrlMetadata } from '@/lib/server-actions';

type ContentItem = (SiteBanner | PromotionalPoster) & { type: 'banner' | 'poster' };

function VisualContentForm({ item, type, onFormSubmit }: { item?: Partial<ContentItem>; type: 'banner' | 'poster'; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [refUrl, setRefUrl] = useState('');
  const isEditing = !!item?.id;
  const [preview, setPreview] = useState<string | null>(item?.imageSrc || null);

  const form = useForm<VisualContentFormValues>({
    resolver: zodResolver(VisualContentSchema),
    defaultValues: {
      title: item?.title || '',
      description: item?.description || '',
      imageSrc: item?.imageSrc || '',
      imageHint: item?.imageHint || 'visual graphic',
      href: (item && 'href' in item) ? item.href : '',
      imageFile: undefined,
    },
  });

  const { isSubmitting } = form.formState;

  const handleFetchFromUrl = async () => {
    if (!refUrl) return;
    setIsFetching(true);
    try {
        const metadata = await fetchUrlMetadata(refUrl);
        if (metadata) {
            form.setValue('title', metadata.title);
            form.setValue('description', metadata.description);
            form.setValue('imageSrc', metadata.imageSrc);
            setPreview(metadata.imageSrc);
            toast({ title: "Details Fetched!", description: "Form has been auto-filled from the link." });
        } else {
            toast({ title: "Fetch Failed", description: "Could not retrieve metadata from URL.", variant: "destructive" });
        }
    } catch (e) {
        toast({ title: "Error", description: "Scraping error occurred.", variant: "destructive" });
    } finally {
        setIsFetching(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('imageFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (data: VisualContentFormValues) => {
    try {
      if (isEditing) {
        if (type === 'banner') await updateSiteBanner(item.id!, data);
        else await updatePromotionalPoster(item.id!, data);
        toast({ title: "Content Updated" });
      } else {
        if (type === 'banner') await addSiteBanner(data);
        else await addPromotionalPoster(data);
        toast({ title: "Content Added" });
      }
      onFormSubmit();
      setOpen(false);
      if (!isEditing) {
          form.reset();
          setRefUrl('');
          setPreview(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
            <Button size="sm" variant="secondary"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
        ) : (
            <Button size="sm" className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Add {type === 'banner' ? 'Hero Banner' : 'Promo Poster'}
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} {type === 'banner' ? 'Hero Banner' : 'Promo Poster'}</DialogTitle>
          <DialogDescription>Paste a URL to auto-fill or enter details manually.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border border-dashed mb-4">
            <div className="flex-1">
                <Input 
                    placeholder="Auto-fill from URL..." 
                    value={refUrl}
                    onChange={(e) => setRefUrl(e.target.value)}
                />
            </div>
            <Button variant="secondary" onClick={handleFetchFromUrl} disabled={isFetching || !refUrl}>
                {isFetching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                Auto-Fill
            </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="imageFile"
                        render={() => (
                            <FormItem>
                            <FormLabel className="flex items-center"><FileUp className="mr-2 h-4 w-4" /> Upload Image</FormLabel>
                            <FormControl>
                                <Input 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/gif"
                                    onChange={handleFileChange}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="imageSrc" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4" /> Or Enter Image URL</FormLabel><FormControl><Input {...field} onChange={(e) => { field.onChange(e); setPreview(e.target.value); }} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                {preview && (
                    <div className="flex flex-col items-center justify-center">
                        <FormLabel>Image Preview</FormLabel>
                        <div className="relative w-full aspect-video rounded-md overflow-hidden border mt-2">
                            <NextImage src={preview} alt="Content preview" fill className="object-cover" />
                        </div>
                    </div>
                )}
            </div>
            <FormField control={form.control} name="imageHint" render={({ field }) => ( <FormItem><FormLabel>Image Hint</FormLabel><FormControl><Input placeholder="e.g., driving test" {...field} /></FormControl><FormMessage /></FormItem> )} />
            {type === 'poster' && (
              <FormField control={form.control} name="href" render={({ field }) => ( <FormItem><FormLabel>Link URL (e.g., /#subscriptions)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            )}
            <DialogFooter className="pt-4 sticky bottom-0 bg-background border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Publish Content'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function VisualContentManagement({ title, banners, posters, isLoading, onAction }: { title: ReactNode; banners: SiteBanner[]; posters: PromotionalPoster[], isLoading: boolean; onAction: () => void }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'banner' | 'poster', title: string } | null>(null);
  const { toast } = useToast();

  const allContent: ContentItem[] = [
    ...banners.map(b => ({ ...b, type: 'banner' as const })),
    ...posters.map(p => ({ ...p, type: 'poster' as const })),
  ];

  const handleDeleteClick = (item: ContentItem) => {
      setItemToDelete({ id: item.id, type: item.type, title: item.title });
      setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!itemToDelete) return;
      const success = itemToDelete.type === 'banner' 
        ? await deleteSiteBanner(itemToDelete.id) 
        : await deletePromotionalPoster(itemToDelete.id);
      
      if (success) {
          toast({ title: "Content Removed" });
          onAction();
      } else {
          toast({ title: "Error", variant: "destructive" });
      }
      setIsAlertOpen(false);
      setItemToDelete(null);
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(3).fill(0).map((_, i) => (
         <Card key={`visual-skeleton-${i}`} className="flex flex-col"><CardContent className="p-4"><Skeleton className="w-full h-64" /></CardContent></Card>
      ))}
    </div>
  );

  return (
    <>
    <Card className="shadow-lg border-primary">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <CardTitle className="font-headline text-2xl font-semibold flex items-center">
            {title}
            </CardTitle>
            <CardDescription>Update images and text for key visual elements across the site.</CardDescription>
        </div>
        <div className="flex gap-2">
            <VisualContentForm type="banner" onFormSubmit={onAction} />
            <VisualContentForm type="poster" onFormSubmit={onAction} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          renderSkeletons()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allContent.map(item => (
              <Card key={item.id} className="overflow-hidden flex flex-col group border-l-4 border-primary">
                <CardHeader className="p-4 bg-muted/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                        {item.type === 'banner' ? <ImageIcon className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                        {item.type === 'banner' ? `Hero Banner` : `Promo Poster`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col">
                  <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden mb-4 shadow-sm border">
                    <NextImage src={item.imageSrc} alt={item.title} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="space-y-2 flex-grow">
                    <h4 className="font-bold text-lg leading-tight">{item.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 bg-muted/20 border-t flex justify-between items-center">
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(item)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                  <VisualContentForm item={item} type={item.type} onFormSubmit={onAction} />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
