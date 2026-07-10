<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('id_cards')) {
            return;
        }

        Schema::table('id_cards', function (Blueprint $table) {

            if (!Schema::hasColumn('id_cards', 'id_number')) {
                $table->string('id_number')->nullable();
            }

            if (!Schema::hasColumn('id_cards', 'signature')) {
                $table->string('signature')->nullable();
            }

            if (!Schema::hasColumn('id_cards', 'signed_at')) {
                $table->timestamp('signed_at')->nullable();
            }

            if (!Schema::hasColumn('id_cards', 'generated_by')) {
                $table->foreignId('generated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('id_cards', function (Blueprint $table) {

            if (Schema::hasColumn('id_cards', 'generated_by')) {
                $table->dropForeign(['generated_by']);
                $table->dropColumn('generated_by');
            }

            $table->dropColumn([
                'id_number',
                'signature',
                'signed_at'
            ]);
        });
    }
};