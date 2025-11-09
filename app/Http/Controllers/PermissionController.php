<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        $query = Permission::query();

        if ($request->filled('group')) {
            $query->where('group', $request->group);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $permissions = $query
            ->orderBy('group')
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        $groups = Permission::select('group')->distinct()->pluck('group')->filter()->values();

        return Inertia::render('permissions/Index', [
            'permissions' => $permissions,
            'groups' => $groups,
            'filters' => $request->only('group', 'search'),
        ]);
    }

    public function create()
    {
        $groups = Permission::select('group')->distinct()->pluck('group')->filter()->values();

        return Inertia::render('permissions/Form', [
            'groups' => $groups,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'group' => 'nullable|string|max:255',
        ]);

        Permission::create($data);

        return redirect()->route('permissions.index')->with('success', 'Permission berhasil dibuat.');
    }

    public function edit(Permission $permission)
    {
        $groups = Permission::select('group')->distinct()->pluck('group')->filter()->values();

        return Inertia::render('permissions/Form', [
            'permission' => $permission,
            'groups' => $groups,
        ]);
    }

    public function update(Request $request, Permission $permission)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $permission->id,
            'group' => 'nullable|string|max:255',
        ]);

        $permission->update($data);

        return redirect()->route('permissions.index')->with('success', 'Permission berhasil diperbarui.');
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();

        return redirect()->route('permissions.index')->with('success', 'Permission berhasil dihapus.');
    }
}
