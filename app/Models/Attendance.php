<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'attendance_time',
        'status',
        'confidence',
        'method'
    ];

    protected $casts = [
        'attendance_time' => 'datetime',
        'confidence' => 'float'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}