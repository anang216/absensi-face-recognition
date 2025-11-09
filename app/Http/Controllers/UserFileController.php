<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class UserFileController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $folderId = $request->input('folder_id');

        $folders = $user->mediaFolders()->orderBy('name')->get();

        // ✅ Cek folder aktif
        $currentFolder = $folderId ? $user->mediaFolders()->find($folderId) : null;

        if ($folderId && !$currentFolder) {
            // 🛑 Jika folder tidak ada, redirect ke root
            return redirect('/files');
        }

        $files = $user
            ->media()
            ->where('collection_name', 'files')
            ->when($folderId, function ($query) use ($folderId) {
                $query->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(custom_properties, '$.folder_id')) = ?", [(string)$folderId]);
            }, function ($query) {
                $query->where(function ($q) {
                    $q->whereNull('custom_properties->folder_id')
                        ->orWhereRaw("JSON_EXTRACT(custom_properties, '$.folder_id') IS NULL");
                });
            })
            ->get();

        return Inertia::render('files/Index', [
            'folders' => $folders,
            'currentFolderId' => $folderId,
            'currentFolder' => $currentFolder,
            'files' => $files->map(fn($media) => [
                'id' => $media->id,
                'name' => $media->name,
                'size' => $media->humanReadableSize,
                'mime_type' => $media->mime_type,
                'url' => $media->getFullUrl(),
                'created_at' => $media->created_at->diffForHumans(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|max:10240',
        ]);

        foreach ($request->file('files') as $file) {
            $request->user()
                ->addMedia($file)
                ->withCustomProperties([
                    'folder_id' => $request->input('folder_id'),
                ])
                ->toMediaCollection('files');
        }

        return back()->with('success', 'Files uploaded successfully');
    }

    public function destroy(Request $request, $id)
    {
        $media = $request->user()->media()->where('id', $id)->firstOrFail();
        $media->delete();

        return back()->with('success', 'File berhasil dihapus.');
    }
}
