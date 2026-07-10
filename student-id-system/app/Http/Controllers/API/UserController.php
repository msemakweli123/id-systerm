<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Get all users (Super Admin only)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Only super admin can access
            if ($user->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Super Admin only'
                ], 403);
            }
            
            $users = User::all(['id', 'name', 'email', 'role', 'status', 'created_at']);
            
            return response()->json([
                'success' => true,
                'users' => $users
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get a specific user (Super Admin only)
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if ($user->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Super Admin only'
                ], 403);
            }
            
            $user = User::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'user' => $user
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
    }
}