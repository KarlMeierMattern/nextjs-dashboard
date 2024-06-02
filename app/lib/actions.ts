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
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    // storing monetary values in cents eliminates floating-point errors and ensures greater accuracy
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    
    await sql `
    INSERT INTO invoices (customer_Id, amount, status, date)
    VALUES (${customerId}, ${amount}, ${status}, ${date})
    `;

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
   
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    // Clear the client cache and make a new server request.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    // Since this action is being called in the /dashboard/invoices path, you don't need to call redirect.
    // Calling revalidatePath will trigger a new server request and re-render the table.
    revalidatePath('/dashboard/invoices');
  }