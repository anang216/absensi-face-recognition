import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useEffect } from 'react';

export default function Welcome() {
  const { auth, setting } = usePage<SharedData>().props;

  const primaryColor = setting?.warna || '#0ea5e9';
  const primaryForeground = '#ffffff';

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--primary-foreground', primaryForeground);
    document.documentElement.style.setProperty('--color-primary-foreground', primaryForeground);
  }, [primaryColor, primaryForeground]);

  return (
    <>
      <Head title="Welcome" />
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-background to-gray-50 dark:to-gray-900">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-[var(--primary)]/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl text-center space-y-8 z-10">
          {/* Header section */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80">
              Laravel 12 + React Starter Kit
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Accelerate your development with a production-ready foundation featuring authentication, role management, customizable settings, and a modern UI.
            </p>
          </div>

          {/* CTA section */}
          {auth.user ? (
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              >
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3 rounded-lg border border-border bg-white dark:bg-gray-800 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-8 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[var(--primary)] mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure Authentication</h3>
              <p className="text-muted-foreground text-sm">Built-in user authentication with email verification and password reset.</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[var(--primary)] mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Role Management</h3>
              <p className="text-muted-foreground text-sm">Flexible role-based permissions system for controlling access.</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[var(--primary)] mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Modern Dashboard</h3>
              <p className="text-muted-foreground text-sm">Clean, responsive interface with dark mode support.</p>
            </div>
          </div>

          {/* Footer links */}
          <div className="pt-8 space-y-2 text-sm text-muted-foreground">
            <p>
              Read the <a href="https://laravel.com/docs" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline font-medium">Laravel documentation</a> or explore <a href="https://laracasts.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline font-medium">Laracasts tutorials</a>.
            </p>
            <p>
              Need quick deployment? Try <a href="https://cloud.laravel.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline font-medium">Laravel Cloud</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}