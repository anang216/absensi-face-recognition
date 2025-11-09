<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // MENU: Dashboard
        Menu::create([
            'title' => 'Dashboard',
            'icon' => 'Home',
            'route' => '/dashboard',
            'order' => 1,
            'permission_name' => 'dashboard-view',
        ]);

        // GROUP: Access
        $access = Menu::create([
            'title' => 'Access',
            'icon' => 'Contact',
            'route' => '#',
            'order' => 2,
            'permission_name' => 'access-view',
        ]);

        Menu::create([
            'title' => 'Permissions',
            'icon' => 'AlertOctagon',
            'route' => '/permissions',
            'order' => 2,
            'permission_name' => 'permission-view',
            'parent_id' => $access->id,
        ]);

        Menu::create([
            'title' => 'Users',
            'icon' => 'Users',
            'route' => '/users',
            'order' => 3,
            'permission_name' => 'users-view',
            'parent_id' => $access->id,
        ]);

        Menu::create([
            'title' => 'Roles',
            'icon' => 'AlertTriangle',
            'route' => '/roles',
            'order' => 4,
            'permission_name' => 'roles-view',
            'parent_id' => $access->id,
        ]);

        // GROUP: Settings
        $settings = Menu::create([
            'title' => 'Settings',
            'icon' => 'Settings',
            'route' => '#',
            'order' => 3,
            'permission_name' => 'settings-view',
        ]);

        Menu::create([
            'title' => 'Menu Manager',
            'icon' => 'Menu',
            'route' => '/menus',
            'order' => 1,
            'permission_name' => 'menu-view',
            'parent_id' => $settings->id,
        ]);

        Menu::create([
            'title' => 'App Settings',
            'icon' => 'AtSign',
            'route' => '/settingsapp',
            'order' => 2,
            'permission_name' => 'app-settings-view',
            'parent_id' => $settings->id,
        ]);

        Menu::create([
            'title' => 'Backup',
            'icon' => 'Inbox',
            'route' => '/backup',
            'order' => 3,
            'permission_name' => 'backup-view',
            'parent_id' => $settings->id,
        ]);

        // GROUP: Utilities
        $utilities = Menu::create([
            'title' => 'Utilities',
            'icon' => 'CreditCard',
            'route' => '#',
            'order' => 4,
            'permission_name' => 'utilities-view',
        ]);

        Menu::create([
            'title' => 'Audit Logs',
            'icon' => 'Activity',
            'route' => '/audit-logs',
            'order' => 2,
            'permission_name' => 'log-view',
            'parent_id' => $utilities->id,
        ]);

        Menu::create([
            'title' => 'File Manager',
            'icon' => 'Folder',
            'route' => '/files',
            'order' => 3,
            'permission_name' => 'filemanager-view',
            'parent_id' => $utilities->id,
        ]);

        $permissions = Menu::pluck('permission_name')->unique()->filter();

        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName]);
        }

        $role = Role::firstOrCreate(['name' => 'user']);
        $role->givePermissionTo('dashboard-view');
    }
}
