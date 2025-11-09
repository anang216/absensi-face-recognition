<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SettingApp extends Model
{
    protected $table = 'settingapp';

    protected $fillable = [
        'nama_app',
        'deskripsi',
        'logo',
        'favicon',
        'warna',
        'seo',
    ];

    protected $casts = [
        'seo' => 'array',
    ];
}
