
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, Trash2, Edit, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { CourseModuleSchema, type CourseModuleFormValues, type Course, type CourseModule } from '@/types';
import { addCourseModule, updateCourseModule, deleteCourseModule } from '@/lib/mock-data';

// Dialog Form for adding/editing a module
function ModuleForm({ courseId, module, onFormSubmit }: { courseId: string; module?: CourseModule; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<CourseModuleFormValues>({
    resolver: zodResolver(CourseModuleSchema),
    defaultValues: {
      title: module?.title || '',
      description: module?.description || '',
      duration: module?.duration || '',
    },
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (data: CourseModuleFormValues) => {
    try {
      if (module) {
        // Update existing module
        await updateCourseModule(courseId, module.id, data);
        toast({ title: "Module Updated", description: "The module has been successfully updated." });
      } else {
        // Add new module
        await addCourseModule(courseId, data);
        toast({ title: "Module Added", description: "The new module has been successfully added." });
      }
      onFormSubmit();
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {module ? (
          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Module</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{module ? 'Edit' : 'Add'} Module</DialogTitle>
          <DialogDescription>Fill in the details for the course module below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Vehicle Controls" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the module content..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl><Input placeholder="e.g., 2 hours" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {module ? 'Save Changes' : 'Add Module'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Main Course Management Component
export default function CourseManagement({ title, courses, isLoading, onAction }: { title: ReactNode; courses: Course[]; isLoading: boolean; onAction: () => void }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<{ courseId: string; moduleId: string } | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (courseId: string, moduleId: string) => {
    setModuleToDelete({ courseId, moduleId });
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!moduleToDelete) return;
    const success = await deleteCourseModule(moduleToDelete.courseId, moduleToDelete.moduleId);
    if (success) {
      toast({ title: "Module Deleted", description: "The module has been successfully removed." });
      onAction();
    } else {
      toast({ title: "Error", description: "Failed to delete the module.", variant: "destructive" });
    }
    setIsAlertOpen(false);
    setModuleToDelete(null);
  };

  const renderSkeletons = () => (
    <div className="space-y-2">
      {Array(3).fill(0).map((_, i) => (
        <Skeleton key={`course-skeleton-${i}`} className="h-14 w-full" />
      ))}
    </div>
  );

  return (
    <>
      <Card className="shadow-lg border-primary transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-2xl font-semibold flex items-center">
            <BookOpen className="inline-block mr-3 h-6 w-6 align-middle" />
            {title}
          </CardTitle>
          <CardDescription>Add, edit, or remove modules from existing courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            renderSkeletons()
          ) : courses.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {courses.map(course => (
                <AccordionItem key={course.id} value={course.id}>
                  <AccordionTrigger className="text-lg font-semibold">{course.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="flex justify-end mb-4">
                        <ModuleForm courseId={course.id} onFormSubmit={onAction} />
                      </div>
                      {course.modules.length > 0 ? (
                        <ul className="space-y-3">
                          {course.modules.map(module => (
                            <li key={module.id} className="flex justify-between items-start p-3 border rounded-md bg-muted/50">
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">{module.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                                <div className="flex items-center text-xs text-muted-foreground mt-2">
                                  <Clock className="mr-1.5 h-3 w-3" />
                                  <span>{module.duration}</span>
                                </div>
                              </div>
                              <div className="flex items-center ml-4">
                                <ModuleForm courseId={course.id} module={module} onFormSubmit={onAction} />
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(course.id, module.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No modules found for this course.</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground h-40">
              <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-lg">No courses found.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the module from the course.
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
