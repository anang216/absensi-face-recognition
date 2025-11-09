<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Menu;

class CheckMenuPermission
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Abaikan jika belum login
        if (!$user) {
            return redirect()->route('login');
        }

        // Ambil route yang sedang diakses, contoh: "/permissions"
        $currentRoute = $request->route()->uri();

        // Ambil menu berdasarkan route
        $menu = Menu::where('route', '/' . ltrim($currentRoute, '/'))->first();

        // Jika menu ditemukan dan punya permission
        if ($menu && $menu->permission_name) {
            if (!$user->can($menu->permission_name)) {
                abort(403, 'Anda tidak memiliki izin untuk mengakses halaman ini.');
            }
        }

        return $next($request);
    }
}
