import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root to dashboard; login middleware handles auth
  redirect('/dashboard');
}
