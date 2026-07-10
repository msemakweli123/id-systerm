<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $table = 'system_settings';

    protected $fillable = [
        // System Info
        'system_name',
        'system_email',
        'system_phone',

        // Security
        'default_password',
        'force_password_change',
        'two_factor_auth',
        'maintenance_mode',

        // Notifications
        'email_notifications',
        'sms_notifications',

        // User Control
        'auto_activate_users',
        'allow_registration',

        // ID System
        'id_prefix',
        'id_suffix',
        'auto_generate_id',

        // File Settings
        'max_upload_size',
        'allowed_file_types',

        // Audit
        'enable_logs',
    ];

    protected $casts = [
        'force_password_change' => 'boolean',
        'two_factor_auth' => 'boolean',
        'maintenance_mode' => 'boolean',
        'email_notifications' => 'boolean',
        'sms_notifications' => 'boolean',
        'auto_activate_users' => 'boolean',
        'allow_registration' => 'boolean',
        'auto_generate_id' => 'boolean',
        'enable_logs' => 'boolean',
    ];
}