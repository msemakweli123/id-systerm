<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'path',
        'status'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}