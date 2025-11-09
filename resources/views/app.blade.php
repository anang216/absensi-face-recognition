<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    @php
        $setting = $page['props']['setting'] ?? null;
        $appName = $setting['nama_app'] ?? config('app.name', 'Laravel');
        $favicon = $setting['favicon'] ?? null;
    @endphp

    <title inertia>{{ $appName }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @php
        $favicon = $page['props']->setting->favicon ?? null;
    @endphp

    @if (!empty($favicon))
        <link rel="icon" href="{{ asset('storage/' . $favicon) }}" type="image/png">
    @else
        <link rel="icon" href="/favicon.ico" type="image/x-icon">
    @endif


    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
