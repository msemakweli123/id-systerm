<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();

            // ===== SYSTEM INFO =====
            $table->string('system_name')->default('Job Portal System');
            $table->string('system_email')->nullable();
            $table->string('system_phone')->nullable();

            // ===== AUTH / SECURITY =====
            $table->string('default_password')->default('mk123');
            $table->boolean('force_password_change')->default(true);
            $table->boolean('two_factor_auth')->default(false);
            $table->boolean('maintenance_mode')->default(false);

            // ===== NOTIFICATIONS =====
            $table->boolean('email_notifications')->default(true);
            $table->boolean('sms_notifications')->default(false);

            // ===== USER CONTROL =====
            $table->boolean('auto_activate_users')->default(true);
            $table->boolean('allow_registration')->default(true);

            // ===== ID SYSTEM =====
            $table->string('id_prefix')->default('142330');
            $table->string('id_suffix')->default('/T.26');
            $table->boolean('auto_generate_id')->default(true);

            // ===== FILE SETTINGS =====
            $table->integer('max_upload_size')->default(2048); // KB
            $table->string('allowed_file_types')->default('jpg,png,pdf');

            // ===== AUDIT =====
            $table->boolean('enable_logs')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};