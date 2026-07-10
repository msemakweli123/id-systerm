<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    use HasFactory;

    // Table name (optional but good practice)
    protected $table = 'faculties';

    // Mass assignable fields
    protected $fillable = [
        'name',
        'code',
    ];

    // Optional: hide nothing for now
    protected $hidden = [];

    // Optional: ensure dates are treated properly
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}