<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('id_templates', function (Blueprint $table) {
            $table->id();

            // Template name (e.g. "Engineering Template")
            $table->string('name');

            // File path stored in storage/app/public/id-templates
            $table->string('path');

            // Optional: link template to program/course
            $table->string('program')->nullable();

            // Optional: status (active/inactive)
            $table->string('status')->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('id_templates');
    }
};