<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdCard extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_id',
        'card_number',    
        'issue_date',  
        'expiry_date',      
        'status',
        'generated_by',
        'signature', // ✅ ADDED: To allow saving signature data
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'issue_date' => 'date',
        'expiry_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the student that owns the ID card.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the user who generated the ID card.
     */
    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Get the card status badge color.
     */
    public function getStatusColorAttribute()
    {
        return match ($this->status) {
            'generated' => 'success',
            'pending' => 'warning',
            'failed' => 'danger',
            default => 'secondary'
        };
    }

    /**
     * Get the card status label.
     */
    public function getStatusLabelAttribute()
    {
        return match ($this->status) {
            'generated' => 'Generated',
            'pending' => 'Pending',
            'failed' => 'Failed',
            default => ucfirst($this->status)
        };
    }

    /**
     * Check if the card has a signature.
     */
    public function getHasSignatureAttribute()
    {
        return !is_null($this->signature);
    }

    /**
     * Check if the card is valid.
     */
    public function isValid()
    {
        return $this->status === 'generated' && ($this->expiry_date === null || $this->expiry_date > now());
    }

    /**
     * Scope a query to only include active cards.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'generated')
                     ->where(function ($q) {
                         $q->whereNull('expiry_date')
                           ->orWhere('expiry_date', '>', now());
                     });
    }

    /**
     * Scope a query to only include expired cards.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'generated')
                     ->where('expiry_date', '<=', now());
    }

    /**
     * Scope a query to only include signed cards.
     */
    public function scopeSigned($query)
    {
        return $query->whereNotNull('signature');
    }

    /**
     * Scope a query to only include unsigned cards.
     */
    public function scopeUnsigned($query)
    {
        return $query->whereNull('signature');
    }
}