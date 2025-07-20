import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to employee directory as the main entry point
  redirect('/employee-directory');
} 