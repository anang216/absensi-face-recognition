import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
  const setting = usePage().props.setting as {
    nama_app?: string;
    logo?: string;
  } | null;

  const defaultAppName = 'Laravel Starter Kit';
  const defaultLogo = '';

  const appName = setting?.nama_app || defaultAppName;
  const logo = setting?.logo || defaultLogo;

  return (
    <div className="flex items-center gap-2">
      {logo ? (
        <img
          src={`/storage/${logo}`}
          alt="Logo"
          className="h-8 w-8 rounded-md object-contain"
        />
      ) : (
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
          <AppLogoIcon className="size-[1.375rem] fill-current text-white dark:text-black" />
        </div>
      )}
      <div className="grid flex-1 text-left text-sm">
        <span className="mb-0.5 truncate leading-none font-semibold">
          {appName}
        </span>
      </div>
    </div>
  );
}
