<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdTemplate extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'name',
        'path',
        'status',
        'is_default',
        'width',
        'height',
        'settings'
    ];
    
    protected $casts = [
        'is_default' => 'boolean',
        'settings' => 'array',
        'width' => 'integer',
        'height' => 'integer'
    ];
    
    // Scope for active templates
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
    
    // Scope for default template
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }
    
    // Get full URL for template
    public function getUrlAttribute()
    {
        return asset('storage/' . $this->path);
    }
}