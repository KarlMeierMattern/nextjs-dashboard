'use server';
 
// Type validation library
import { z } from 'zod';
import { sql } from '@vercel/postgres';

// Client-side Router Cache that stores the route segments in the user's browser for a time
// Ensures that users can quickly navigate between routes while reducing the number of requests made to the server.
import { revalidatePath } from 'next/cache';

import { redirect } from 'next/navigation';

// Define a schema that matches the shape of your form object.
// This schema will validate the formData before saving it to a database.
// Since you are coercing the amount type from string to number, it'll default to zero if the string is empty. Let's tell Zod we always want the amount greater than 0 with the .gt() function.
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// This is temporary until @types/react-dom is updated
// prevState - contains the state passed from the useFormState hook. You won't be using it in the action in this example, but it's a required prop.
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 
export async function createInvoice(prevState: State, formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    // storing monetary values in cents eliminates floating-point errors and ensures greater accuracy
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    
    try {
      await sql `
      INSERT INTO invoices (customer_Id, amount, status, date)
      VALUES (${customerId}, ${amount}, ${status}, ${date})
      `;
    } catch (error) {
        return {
          message: 'Database Error: Failed to Create Invoice.'
        };
    }

    // Since you're updating the data displayed in the invoices route, you want to clear this cache and trigger a new request to the server.
    // Once the database has been updated, the /dashboard/invoices path will be revalidated, and fresh data will be fetched from the server.
    revalidatePath('/dashboard/invoices');

    // Redirect the user back to the invoices route on form submission.
    redirect('/dashboard/invoices');

}
export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;
   
    try {
      await sql`
          UPDATE invoices
          SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
          WHERE id = ${id}
        `;
    } catch (error) {
      return { message: 'Database Error: Failed to Update Invoice.' };
    }

    // Clear the client cache and make a new server request.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }


export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}