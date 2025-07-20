import { Suspense } from 'react';
import { Metadata } from 'next';

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description'
};

export default async function PageName({ params, searchParams }: PageProps) {
  // Server-side data fetching
  const data = await fetchData(params.id);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Page Title</h1>
      
      <Suspense fallback={<div>Loading...</div>}>
        {/* Page content */}
        <div className="space-y-6">
          {/* Your page content here */}
        </div>
      </Suspense>
    </div>
  );
}

// Helper function (if needed)
async function fetchData(id: string) {
  // Implement your data fetching logic
  return {};
} 