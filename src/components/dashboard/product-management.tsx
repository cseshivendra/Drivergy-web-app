
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Trash2, Edit, PlusCircle, AlertCircle, Loader2, FileUp, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { ProductFormSchema, type ProductFormValues, type Product } from '@/types';
import { addProduct, updateProduct, deleteProduct } from '@/lib/server-actions';
import NextImage from 'next/image';

function ProductForm({ product, onFormSubmit }: { product?: Product; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const isEditing = !!product;
  const [preview, setPreview] = useState<string | null>(product?.imageSrc || null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      title: product?.title || '',
      description: product?.description || '',
      imageSrc: product?.imageSrc || '',
      imageHint: product?.imageHint || '',
      amazonId: product?.amazonId || '',
      flipkartId: product?.flipkartId || '',
      imageFile: undefined,
    },
  });

  const { isSubmitting } = form.formState;

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

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      if (isEditing) {
        await updateProduct(product.id, data);
        toast({ title: "Product Updated", description: "The product has been successfully updated." });
      } else {
        await addProduct(data);
        toast({ title: "Product Added", description: "The new product has been successfully added." });
      }
      onFormSubmit();
      setOpen(false);
      if (!isEditing) {
        form.reset();
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Product</DialogTitle>
          <DialogDescription>Fill in the details for the store product below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
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
                              accept="image/png, image/jpeg, image/gif, image/webp"
                              onChange={handleFileChange}
                          />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="imageSrc" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4" />Or Enter Image URL</FormLabel><FormControl><Input placeholder="https://..." {...field} onChange={(e) => { field.onChange(e); setPreview(e.target.value); }} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              {preview && (
                  <div className="flex flex-col items-center justify-center">
                      <FormLabel>Image Preview</FormLabel>
                      <NextImage src={preview} alt="Product preview" width={150} height={150} className="mt-2 rounded-md object-cover aspect-square" />
                  </div>
              )}
            </div>
            
            <FormField control={form.control} name="imageHint" render={({ field }) => ( <FormItem><FormLabel>Image Hint</FormLabel><FormControl><Input placeholder="e.g., car phone mount" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amazonId" render={({ field }) => ( <FormItem><FormLabel>Amazon ID (ASIN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="flipkartId" render={({ field }) => ( <FormItem><FormLabel>Flipkart ID (FSN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-background">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductManagement({ title, products, isLoading, onAction }: { title: ReactNode; products: Product[]; isLoading: boolean; onAction: () => void }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const success = await deleteProduct(productToDelete.id);
    if (success) {
      toast({ title: "Product Deleted", description: "The product has been successfully removed from the store." });
      onAction();
    } else {
      toast({ title: "Error", description: "Failed to delete the product.", variant: "destructive" });
    }
    setIsAlertOpen(false);
    setProductToDelete(null);
  };

  const renderSkeletons = () => (
    Array(3).fill(0).map((_, i) => (
      <TableRow key={`product-skeleton-${i}`}>
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
                    {title}
                </CardTitle>
                <CardDescription>Add, edit, or remove products from the affiliate store.</CardDescription>
            </div>
            <ProductForm onFormSubmit={onAction} />
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Amazon ID</TableHead>
                <TableHead>Flipkart ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeletons() : products.length > 0 ? (
                products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{product.amazonId}</TableCell>
                    <TableCell>{product.flipkartId}</TableCell>
                    <TableCell className="flex gap-2">
                        <ProductForm product={product} onFormSubmit={onAction} />
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteClick(product)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg">No products found.</p>
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
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "{productToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
