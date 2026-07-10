<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * Mass assignable attributes
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
    ];

    /**
     * Hidden attributes
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Attribute casting
     */
    protected $casts = [
        'email_verified_at' => 'datetime',

        // ✅ IMPORTANT FIX:
        // prevent login issues with manual inserts
        'password' => 'hashed',
    ];

    // =========================
    // ROLE HELPERS
    // =========================

    public function isStudent()
    {
        return $this->role === 'student';
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }

    // =========================
    // USER → STUDENT (1:1)
    // =========================

    public function student()
    {
        return $this->hasOne(Student::class);
    }

    // =========================
    // USER → NOTIFICATIONS
    // =========================

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // =========================
    // USER → LOGS
    // =========================

    public function logs()
    {
        return $this->hasMany(Log::class);
    }
}