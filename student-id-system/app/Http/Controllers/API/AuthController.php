<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Log as LogModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * 🔐 LOGIN (ADMIN + STUDENT + SUPER ADMIN)
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            $user = User::where('email', $request->email)->first();

            // ✅ CHECK IF USER EXISTS
            if (!$user) {
                // Log failed login attempt - user not found
                $this->addLog(
                    null,
                    'login_failed',
                    "Failed login attempt for email: {$request->email} - User not found",
                    $request
                );

                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // 🔐 SAFE PASSWORD CHECK
            if (!$user->password || !Hash::check($request->password, $user->password)) {
                // Log failed login attempt - invalid password
                $this->addLog(
                    $user->id,
                    'login_failed',
                    "Failed login attempt for user: {$user->name} ({$user->email}) - Invalid password",
                    $request
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // ✅ CHECK IF USER IS ACTIVE (NOT INACTIVE OR SUSPENDED)
            if ($user->status !== 'active') {
                $statusMessage = '';
                
                if ($user->status === 'suspended') {
                    $statusMessage = 'Your account has been suspended. Please contact administration.';
                } elseif ($user->status === 'inactive') {
                    $statusMessage = 'Your account has been deactivated. Please contact administration.';
                } else {
                    $statusMessage = 'Your account is not active. Please contact administration.';
                }
                
                Log::warning('Login attempt by inactive user', [
                    'email' => $request->email,
                    'user_id' => $user->id,
                    'status' => $user->status,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $statusMessage,
                    'status' => $user->status
                ], 403);
            }

            // 🔥 delete old tokens
            $user->tokens()->delete();

            // 🔑 create new token
            $token = $user->createToken('auth_token')->plainTextToken;

            // 👤 load student data ONLY if student
            $student = null;

            if ($user->role === 'student') {
                $student = $user->student()
                    ->with(['program', 'department'])
                    ->first();
            }

            // ✅ LOG SUCCESSFUL LOGIN TO LOGS TABLE
            $this->addLog(
                $user->id,
                'login',
                "User {$user->name} ({$user->email}) logged in successfully from IP: {$request->ip()}",
                $request
            );

            // ✅ LOG TO LARAVEL LOG
            Log::info('User logged in successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
                'role' => $user->role,
                'student' => $student,
                'token' => $token
            ]);

        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            
            // Log the error
            $this->addLog(
                null,
                'login_error',
                "Login error: " . $e->getMessage(),
                $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🚪 LOGOUT
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            if ($user) {
                // ✅ LOG SUCCESSFUL LOGOUT TO LOGS TABLE
                $this->addLog(
                    $user->id,
                    'logout',
                    "User {$user->name} ({$user->email}) logged out from IP: {$request->ip()}",
                    $request
                );

                // Delete all tokens
                $user->tokens()->delete();
                
                // ✅ LOG TO LARAVEL LOG
                Log::info('User logged out', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip' => $request->ip()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());

            // Log the error
            $this->addLog(
                null,
                'logout_error',
                "Logout error: " . $e->getMessage(),
                $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 👤 GET CURRENT USER
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get user: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📝 ADD LOG ENTRY HELPER
     */
    private function addLog($userId, $action, $description, $request)
    {
        try {
            LogModel::create([
                'user_id' => $userId,
                'action' => $action,
                'description' => $description,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to add log: ' . $e->getMessage());
        }
    }
}