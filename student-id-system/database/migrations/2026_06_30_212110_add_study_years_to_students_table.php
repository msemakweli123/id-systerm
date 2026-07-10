<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Add start year of study
            $table->year('start_year')->nullable()->after('email');
            $table->year('end_year')->nullable()->after('start_year');
            // OR use integer if you prefer
            // $table->integer('start_year')->nullable()->after('email');
            // $table->integer('end_year')->nullable()->after('start_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['start_year', 'end_year']);
        });
    }
};