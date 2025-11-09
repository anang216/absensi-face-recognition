<?php

namespace App\Policies;

use App\Models\MediaFolder;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class MediaFolderPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, MediaFolder $mediaFolder): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, MediaFolder $mediaFolder): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, MediaFolder $folder): bool
    {
        return $user->id === $folder->user_id;
    }


    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, MediaFolder $mediaFolder): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, MediaFolder $mediaFolder): bool
    {
        return false;
    }
}
