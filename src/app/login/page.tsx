import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getAuthSession } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getAuthSession();

  if (session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Demo credentials:
          </p>
          <p className="mt-1">
            Admin: admin@acme.com / admin123
          </p>
          <p>
            Manager: manager@acme.com / manager123
          </p>
          <p>
            User: user@acme.com / user123
          </p>
        </div>
      </div>
    </div>
  );
} 