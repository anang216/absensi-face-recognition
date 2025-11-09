<?php

namespace App\Providers;

use App\Models\MediaFolder;
use App\Policies\MediaFolderPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        MediaFolder::class => MediaFolderPolicy::class,
    ];

    public function boot(): void
    {
        //
    }
}
