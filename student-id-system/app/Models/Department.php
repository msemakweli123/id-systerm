<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Faculty;
use App\Models\Course;
use App\Models\Student;

class Department extends Model
{
    protected $fillable = [
        'name',
        'code',
        'faculty_id'
    ];

    // relationship with faculty
    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }
}


