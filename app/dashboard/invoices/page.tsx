import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/invoices/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchInvoicesPages } from '@/app/lib/data';

// Your search functionality will span the client and the server.
// When a user searches for an invoice on the client, the URL params will be updated, data will be fetched on the server,
// and the table will re-render on the server with the new data.

// Page components accept a prop called searchParams, so you can pass the current URL params to the <Table> component.
// In Next.js, query parameters can be accessed directly from the context object provided to a page component.
// This context object includes various properties, including query, which represents the query parameters parsed from the URL.
export default async function Page({
  searchParams,
}: {
  searchParams?: { query?: string; page?: string };
}) {
  // The use of (?) in TypeScript denotes optional properties.
  // searchParams?: means the function can be called with or without providing this property.
  // The query and page properties inside searchParams are also optional. If searchParams is provided, it may contain query and/or page, but it's not required to have them.

  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchInvoicesPages(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
