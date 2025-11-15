<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'nim',
        'name',
        'program',
        'semester',
        'photo',
        'face_descriptor'
    ];

    protected $casts = [
        'face_descriptor' => 'array'
    ];

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}