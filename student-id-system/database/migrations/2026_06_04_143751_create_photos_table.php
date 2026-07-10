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
        Schema::create('photos', function (Blueprint $table) {
            $table->id();

            // 🔥 LINK TO STUDENT
            $table->foreignId('student_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // Image path (stored file)
            $table->string('path');

            // Approval status
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('pending');

            // Upload time
            $table->timestamp('uploaded_at')->useCurrent();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};