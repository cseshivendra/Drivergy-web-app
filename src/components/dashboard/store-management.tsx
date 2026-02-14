
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Trash2, Edit, PlusCircle, AlertCircle, Loader2, Link as LinkIcon, ExternalLink, Image as ImageIcon, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { StoreProductSchema, type StoreProductFormValues, type Product } from '@/types';
import { addStoreProduct, updateStoreProduct, deleteStoreProduct, fetchAmazonProductDetails } from '@/lib/server-actions';
import NextImage from 'next/image';

function ProductForm({ product, onFormSubmit }: { product?: Product; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState('');
  const isEditing = !!product;

  const form = useForm<StoreProductFormValues>({
    resolver: zodResolver(StoreProductSchema),
    defaultValues: {
      title: product?.title || '',
      description: product?.description || '',
      amazonId: product?.amazonId || '',
      flipkartId: product?.flipkartId || '',
      imageSrc: product?.imageSrc || '',
      imageHint: product?.imageHint || 'car accessory',
    },
  });

  const { isSubmitting, watch } = form;
  const currentImage = watch('imageSrc');

  const handleFetchFromAmazon = async () => {
    if (!amazonUrl) return;
    setIsFetching(true);
    try {
        const details = await fetchAmazonProductDetails(amazonUrl);
        if (details) {
            form.setValue('title', details.title);
            form.setValue('description', details.description);
            form.setValue('amazonId', details.amazonId);
            form.setValue('imageSrc', details.imageSrc);
            toast({ title: "Details Fetched!", description: "Amazon product information has been pre-filled." });
        } else {
            toast({ title: "Fetch Failed", description: "Could not find ASIN in the provided URL.", variant: "destructive" });
        }
    } catch (e) {
        toast({ title: "Error", description: "An error occurred while fetching details.", variant: "destructive" });
    } finally {
        setIsFetching(false);
    }
  };

  const handleSubmit = async (data: StoreProductFormValues) => {
    try {
      if (isEditing) {
        await updateStoreProduct(product.id, data);
        toast({ title: "Product Updated", description: "The store item has been successfully updated." });
      } else {
        await addStoreProduct(data);
        toast({ title: "Product Added", description: "The new store item has been successfully added." });
      }
      onFormSubmit();
      setOpen(false);
      if (!isEditing) {
        form.reset();
        setAmazonUrl('');
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Recommended Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Store Product</DialogTitle>
          <DialogDescription>Paste an Amazon link to automatically fetch details or fill manually.</DialogDescription>
        </DialogHeader>
        
        {!isEditing && (
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border border-dashed mb-4">
                <div className="flex-1">
                    <Input 
                        placeholder="Paste Amazon Product URL here..." 
                        value={amazonUrl}
                        onChange={(e) => setAmazonUrl(e.target.value)}
                    />
                </div>
                <Button variant="secondary" onClick={handleFetchFromAmazon} disabled={isFetching || !amazonUrl}>
                    {isFetching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                    Auto-Fill
                </Button>
            </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Product Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="amazonId" render={({ field }) => ( <FormItem><FormLabel>Amazon ASIN</FormLabel><FormControl><Input placeholder="e.g., B07Y62883J" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="flipkartId" render={({ field }) => ( <FormItem><FormLabel>Flipkart ID (Optional)</FormLabel><FormControl><Input placeholder="e.g., MOBG937GZJ4H3G3Y" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
                    {currentImage ? (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden shadow-sm">
                            <NextImage src={currentImage} alt="Preview" fill className="object-contain" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                            <ImageIcon className="h-12 w-12 opacity-20 mb-2" />
                            <p className="text-xs">No image preview</p>
                        </div>
                    )}
                    <FormField control={form.control} name="imageSrc" render={({ field }) => ( <FormItem className="w-full mt-4"><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </div>

            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Marketing Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <DialogFooter className="pt-4 border-t sticky bottom-0 bg-background">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Publish to Store'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function StoreManagement({ title, products, isLoading, onAction }: { title: ReactNode; products: Product[]; isLoading: boolean; onAction: () => void }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const success = await deleteStoreProduct(productToDelete.id);
    if (success) {
      toast({ title: "Product Removed", description: "Item successfully deleted from the store." });
      onAction();
    } else {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    }
    setIsAlertOpen(false);
    setProductToDelete(null);
  };

  const renderSkeletons = () => (
    Array(3).fill(0).map((_, i) => (
      <TableRow key={`prod-skeleton-${i}`}>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <Card className="shadow-lg border-primary">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-2xl font-semibold flex items-center">
                    <ShoppingBag className="inline-block mr-3 h-6 w-6 align-middle" />
                    {title}
                </CardTitle>
                <CardDescription>Manage hand-picked accessories for the store.</CardDescription>
            </div>
            <ProductForm onFormSubmit={onAction} />
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Amazon ID</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeletons() : products.length > 0 ? (
                products.map(prod => (
                  <TableRow key={prod.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 border rounded bg-muted">
                                <NextImage src={prod.imageSrc} alt={prod.title} fill className="object-contain" />
                            </div>
                            <span className="font-medium">{prod.title}</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{prod.amazonId}</TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                <a href={`https://amazon.in/dp/${prod.amazonId}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-blue-500" /></a>
                            </Button>
                            {prod.flipkartId && (
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                    <a href={`https://flipkart.com/product/p/itme?pid=${prod.flipkartId}`} target="_blank" rel="noopener noreferrer"><ShoppingBag className="h-4 w-4 text-orange-500" /></a>
                                </Button>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <ProductForm product={prod} onFormSubmit={onAction} />
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteClick(prod)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg">Store is empty.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{productToDelete?.title}" from the public store page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
