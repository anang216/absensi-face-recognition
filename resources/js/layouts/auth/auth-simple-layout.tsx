import AppLogoIcon from '@/components/app-logo-icon';
import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    const { props } = usePage();

    const setting = props?.setting as {
        nama_app: string;
        logo?: string;
        warna?: string;
        seo?: {
            title?: string;
            description?: string;
            keywords?: string;
        };
    };

    const primaryColor = setting?.warna || '#0ea5e9';
    const primaryForeground = '#ffffff';

    useEffect(() => {
        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty('--color-primary', primaryColor);
        document.documentElement.style.setProperty('--primary-foreground', primaryForeground);
        document.documentElement.style.setProperty('--color-primary-foreground', primaryForeground);
    }, [primaryColor, primaryForeground]);

    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md rounded-xl bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none">
                <div className="p-8 sm:p-10">
                    <div className="flex flex-col gap-8">
                        {/* Logo and Header Section */}
                        <div className="flex flex-col items-center gap-6">
                            <Link 
                                href={route('home')} 
                                className="flex flex-col items-center gap-3 font-medium transition-opacity hover:opacity-90"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary)] p-2 shadow-sm">
                                    <AppLogoIcon className="size-8 fill-current text-[var(--primary-foreground)]" />
                                </div>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {setting?.nama_app}
                                </span>
                            </Link>

                            <div className="space-y-1.5 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-muted-foreground text-center text-sm leading-5">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="space-y-6">
                            {children}
                        </div>
                    </div>
                </div>

                {/* Optional Footer */}
                <div className="border-t border-gray-100 px-8 py-6 text-center dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} {setting?.nama_app}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}