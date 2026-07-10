<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateIdTemplatesTable extends Migration
{
    public function up()
    {
        Schema::table('id_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('id_templates', 'is_default')) {
                $table->boolean('is_default')->default(false);
            }
            if (!Schema::hasColumn('id_templates', 'width')) {
                $table->integer('width')->default(500);
            }
            if (!Schema::hasColumn('id_templates', 'height')) {
                $table->integer('height')->default(300);
            }
            if (!Schema::hasColumn('id_templates', 'settings')) {
                $table->json('settings')->nullable();
            }
        });
    }
    
    public function down()
    {
        Schema::table('id_templates', function (Blueprint $table) {
            $table->dropColumn(['is_default', 'width', 'height', 'settings']);
        });
    }
}