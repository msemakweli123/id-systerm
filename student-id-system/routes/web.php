<?php

use Illuminate\Support\Facades\Route;

// Add this at the top of your web.php
Route::get('/login', function () {
    return response()->json([
        'success' => false,
        'message' => 'Unauthenticated. Please log in first.'
    ], 401);
})->name('login');

// Your other web routes...