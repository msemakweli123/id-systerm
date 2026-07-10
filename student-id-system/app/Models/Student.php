<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\User;
use App\Models\Program;
use App\Models\Department;
use App\Models\Photo;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',         
        'email',        
        'gender',     
        'dob',           
        'reg_number',
        'program_id',
        'department_id',
        'phone',
        'address',
        'signed',
        'start_year',   // ✅ NEW: Year of joining/start of study
        'end_year',     // ✅ NEW: Expected year of graduation/completion
    ];

    /* ================= ACCESSORS ================= */
    
    /**
     * Get the student's full name (alias for name)
     */
    public function getFullNameAttribute()
    {
        return $this->name;
    }

    /**
     * Get the study period as a formatted string
     */
    public function getStudyPeriodAttribute()
    {
        if ($this->start_year && $this->end_year) {
            return $this->start_year . ' - ' . $this->end_year;
        } elseif ($this->start_year) {
            return $this->start_year . ' - Present';
        }
        return 'N/A';
    }

    /**
     * Get the current year of study
     */
    public function getCurrentYearAttribute()
    {
        if (!$this->start_year) return null;
        
        $currentYear = date('Y');
        $yearOfStudy = $currentYear - $this->start_year + 1;
        
        // Ensure we don't go beyond final year
        if ($this->end_year && $yearOfStudy > ($this->end_year - $this->start_year + 1)) {
            return $this->end_year - $this->start_year + 1;
        }
        
        return max(1, $yearOfStudy);
    }

    /**
     * Get the year of study in words (1st, 2nd, 3rd, 4th)
     */
    public function getYearOfStudyAttribute()
    {
        $year = $this->current_year;
        if (!$year) return 'N/A';
        
        $suffixes = ['th', 'st', 'nd', 'rd'];
        $suffix = $year % 100;
        $suffix = ($suffix >= 11 && $suffix <= 13) ? 'th' : ($suffixes[$year % 10] ?? 'th');
        
        return $year . $suffix . ' Year';
    }

    /* ================= RELATIONSHIPS ================= */

    /* ================= USER RELATION ================= */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /* ================= PROGRAM RELATION ================= */
    public function program()
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    /* ================= DEPARTMENT RELATION ================= */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /* ================= SINGLE LATEST PHOTO ================= */
    public function photo()
    {
        return $this->hasOne(Photo::class, 'student_id')->latestOfMany();
    }

    /* ================= ALL PHOTOS ================= */
    public function photos()
    {
        return $this->hasMany(Photo::class, 'student_id');
    }

    /* ================= ID CARD RELATION ================= */
    public function idCard()
    {
        return $this->hasOne(IdCard::class, 'student_id');
    }

    /* ================= SCOPES ================= */
    
    /**
     * Scope a query to only include active students
     */
    public function scopeActive($query)
    {
        return $query->where('signed', true);
    }

    /**
     * Scope a query to only include students by program
     */
    public function scopeByProgram($query, $programId)
    {
        return $query->where('program_id', $programId);
    }

    /**
     * Scope a query to only include students by department
     */
    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    /**
     * Scope a query to only include students graduating in a specific year
     */
    public function scopeGraduatingIn($query, $year)
    {
        return $query->where('end_year', $year);
    }

    /**
     * Scope a query to only include students who started in a specific year
     */
    public function scopeStartedIn($query, $year)
    {
        return $query->where('start_year', $year);
    }

    /* ================= HELPER METHODS ================= */

    /**
     * Check if student is currently active
     */
    public function isActive()
    {
        return $this->signed == true;
    }

    /**
     * Check if student has graduated
     */
    public function hasGraduated()
    {
        if (!$this->end_year) return false;
        return date('Y') > $this->end_year;
    }

    /**
     * Check if student is currently enrolled
     */
    public function isEnrolled()
    {
        if (!$this->start_year) return false;
        if ($this->end_year) {
            return date('Y') >= $this->start_year && date('Y') <= $this->end_year;
        }
        return date('Y') >= $this->start_year;
    }

    /**
     * Get the number of years remaining
     */
    public function getYearsRemainingAttribute()
    {
        if (!$this->end_year) return null;
        return max(0, $this->end_year - date('Y'));
    }
}