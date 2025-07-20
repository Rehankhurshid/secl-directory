'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Define validation schema
const actionSchema = z.object({
  // Add your validation fields here
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
});

export async function serverActionName(formData: FormData) {
  // Validate form data
  const validatedFields = actionSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    // Add other form fields
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid input data',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Perform your action here
    const result = await performAction(validatedFields.data);
    
    // Revalidate relevant paths
    revalidatePath('/your-path');
    
    // Optionally redirect
    // redirect('/success-path');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Server action error:', error);
    return {
      error: 'Action failed. Please try again.',
    };
  }
}

// Helper function for the actual operation
async function performAction(data: z.infer<typeof actionSchema>) {
  // Implement your business logic here
  return data;
} 