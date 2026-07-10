<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Log extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'description',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the log
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include login logs
     */
    public function scopeLogin($query)
    {
        return $query->where('action', 'login');
    }

    /**
     * Scope a query to only include logout logs
     */
    public function scopeLogout($query)
    {
        return $query->where('action', 'logout');
    }

    /**
     * Scope a query to only include failed login logs
     */
    public function scopeFailedLogin($query)
    {
        return $query->where('action', 'login_failed');
    }

    /**
     * Get action color for UI
     */
    public function getActionColor()
    {
        $colors = [
            'login' => '#06b6d4',
            'logout' => '#6b7280',
            'login_failed' => '#ef4444',
            'login_error' => '#ef4444',
            'logout_error' => '#ef4444',
            'student_created' => '#10b981',
            'student_updated' => '#3b82f6',
            'student_deleted' => '#ef4444',
            'student_status' => '#f59e0b',
            'id_card' => '#8b5cf6',
            'photo' => '#ec4899',
            'admin' => '#7c3aed',
            'super' => '#7c3aed',
        ];

        return $colors[$this->action] ?? '#6b7280';
    }

    /**
     * Get action icon for UI
     */
    public function getActionIcon()
    {
        $icons = [
            'login' => 'fa-sign-in-alt',
            'logout' => 'fa-sign-out-alt',
            'login_failed' => 'fa-times-circle',
            'login_error' => 'fa-exclamation-triangle',
            'logout_error' => 'fa-exclamation-triangle',
            'student_created' => 'fa-user-plus',
            'student_updated' => 'fa-user-edit',
            'student_deleted' => 'fa-user-times',
            'student_status' => 'fa-toggle-on',
            'id_card' => 'fa-id-card',
            'photo' => 'fa-image',
            'admin' => 'fa-user-shield',
            'super' => 'fa-user-shield',
        ];

        return $icons[$this->action] ?? 'fa-circle';
    }
}