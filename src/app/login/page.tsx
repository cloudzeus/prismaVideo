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
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="https://videoConf.b-cdn.net/videoNamager.svg" 
              alt="Communication Manager Logo" 
              className="w-auto"
              style={{ height: '80px' }}
            />
          </div>
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
      </div>
    </div>
  );
} 