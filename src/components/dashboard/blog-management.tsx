
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
import { BookText, Trash2, Edit, PlusCircle, AlertCircle, Loader2, FileUp, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { BlogPostSchema, type BlogPostFormValues, type BlogPost } from '@/types';
import { addBlogPost, updateBlogPost, deleteBlogPost } from '@/lib/mock-data';
import { format } from 'date-fns';
import NextImage from 'next/image';

function BlogForm({ post, onFormSubmit }: { post?: BlogPost; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const isEditing = !!post;
  const [preview, setPreview] = useState<string | null>(post?.imageSrc || null);

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(BlogPostSchema),
    defaultValues: {
      slug: post?.slug || '',
      title: post?.title || '',
      category: post?.category || '',
      excerpt: post?.excerpt || '',
      content: post?.content || '',
      author: post?.author || '',
      date: post?.date || format(new Date(), 'LLL d, yyyy'),
      imageSrc: post?.imageSrc || '',
      imageHint: post?.imageHint || '',
      tags: post?.tags || '',
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

  const handleSubmit = async (data: BlogPostFormValues) => {
    try {
      if (isEditing) {
        await updateBlogPost(post.slug, data);
        toast({ title: "Post Updated", description: "The blog post has been successfully updated." });
      } else {
        await addBlogPost(data);
        toast({ title: "Post Added", description: "The new blog post has been successfully added." });
      }
      onFormSubmit();
      setOpen(false);
      if (!isEditing) {
        form.reset();
        setPreview(null);
      }
    } catch (error) {
      toast({ title: "Error", description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Blog Post</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Blog Post</DialogTitle>
          <DialogDescription>Fill in the details for the blog post below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="slug" render={({ field }) => ( <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} disabled={isEditing} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Author</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="excerpt" render={({ field }) => ( <FormItem><FormLabel>Excerpt</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="content" render={({ field }) => ( <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea rows={8} {...field} /></FormControl><FormMessage /></FormItem> )} />
            
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
                 <FormField control={form.control} name="imageSrc" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4" />Or Enter Image URL</FormLabel><FormControl><Input placeholder="https://placehold.co/..." {...field} onChange={(e) => { field.onChange(e); setPreview(e.target.value); }} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              {preview && (
                  <div className="flex flex-col items-center justify-center">
                      <FormLabel>Image Preview</FormLabel>
                      <NextImage src={preview} alt="Blog post preview" width={200} height={120} className="mt-2 rounded-md object-cover aspect-video" />
                  </div>
              )}
            </div>
            
            <FormField control={form.control} name="imageHint" render={({ field }) => ( <FormItem><FormLabel>Image Hint</FormLabel><FormControl><Input placeholder="e.g., driving test" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="tags" render={({ field }) => ( <FormItem><FormLabel>Tags (comma separated)</FormLabel><FormControl><Input placeholder="e.g., rto, tips, driving" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <DialogFooter className="pt-4 sticky bottom-0 bg-background">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Post'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function BlogManagement({ title, posts, isLoading, onAction }: { title: ReactNode; posts: BlogPost[]; isLoading: boolean; onAction: () => void }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    const success = await deleteBlogPost(postToDelete.slug);
    if (success) {
      toast({ title: "Post Deleted", description: "The blog post has been successfully removed." });
      onAction();
    } else {
      toast({ title: "Error", description: "Failed to delete the post.", variant: "destructive" });
    }
    setIsAlertOpen(false);
    setPostToDelete(null);
  };

  const renderSkeletons = () => (
    Array(3).fill(0).map((_, i) => (
      <TableRow key={`blog-skeleton-${i}`}>
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
                    <BookText className="inline-block mr-3 h-6 w-6 align-middle" />
                    {title}
                </CardTitle>
                <CardDescription>Add, edit, or remove blog posts.</CardDescription>
            </div>
            <BlogForm onFormSubmit={onAction} />
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeletons() : posts.length > 0 ? (
                posts.map(post => (
                  <TableRow key={post.slug}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell>{post.date}</TableCell>
                    <TableCell className="flex gap-2">
                        <BlogForm post={post} onFormSubmit={onAction} />
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteClick(post)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg">No posts found.</p>
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
              This action cannot be undone. This will permanently delete the blog post titled "{postToDelete?.title}".
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
