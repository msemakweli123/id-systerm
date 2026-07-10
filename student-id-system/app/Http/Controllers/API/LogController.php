<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Log;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log as FacadesLog;

class LogController extends Controller
{
    /**
     * Get all logs (Admin and Super Admin only)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if (!in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Admin access required'
                ], 403);
            }
            
            $logs = Log::with('user')
                ->orderBy('created_at', 'desc')
                ->get();
            
            $formattedLogs = $logs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_id' => $log->user_id,
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                        'role' => $log->user->role,
                    ] : null,
                    'action' => $log->action,
                    'description' => $log->description,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'created_at' => $log->created_at ? $log->created_at->toISOString() : null,
                    'updated_at' => $log->updated_at ? $log->updated_at->toISOString() : null,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $formattedLogs,
                'logs' => $formattedLogs,
                'total' => $formattedLogs->count()
            ]);
            
        } catch (\Exception $e) {
            FacadesLog::error('Failed to fetch logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a login log entry
     */
    public function addLoginLog(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            $log = Log::create([
                'user_id' => $user->id,
                'action' => 'login',
                'description' => "User {$user->name} logged in",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Login log added successfully',
                'data' => $log
            ]);

        } catch (\Exception $e) {
            FacadesLog::error('Failed to add login log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add login log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a logout log entry
     */
    public function addLogoutLog(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            $log = Log::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'description' => "User {$user->name} logged out",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Logout log added successfully',
                'data' => $log
            ]);

        } catch (\Exception $e) {
            FacadesLog::error('Failed to add logout log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add logout log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a custom log entry
     */
    public function addCustomLog(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            $request->validate([
                'action' => 'required|string|max:255',
                'description' => 'required|string',
            ]);

            $log = Log::create([
                'user_id' => $user->id,
                'action' => $request->action,
                'description' => $request->description,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Custom log added successfully',
                'data' => $log
            ]);

        } catch (\Exception $e) {
            FacadesLog::error('Failed to add custom log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add custom log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get super admin logs
     */
    public function superAdminLogs(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if ($user->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Super Admin only'
                ], 403);
            }
            
            $logs = Log::with('user')
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $logs,
                'logs' => $logs,
                'total' => $logs->count()
            ]);
            
        } catch (\Exception $e) {
            FacadesLog::error('Failed to fetch super admin logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific log by ID
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if (!in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Admin access required'
                ], 403);
            }
            
            $log = Log::with('user')->find($id);
            
            if (!$log) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $log
            ]);
            
        } catch (\Exception $e) {
            FacadesLog::error('Failed to fetch log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a log by ID (Super Admin only)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if ($user->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Super Admin only'
                ], 403);
            }
            
            $log = Log::find($id);
            
            if (!$log) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log not found'
                ], 404);
            }
            
            $log->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Log deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            FacadesLog::error('Failed to delete log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear all logs (Super Admin only)
     */
    public function clearAll(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if ($user->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Super Admin only'
                ], 403);
            }
            
            $count = Log::count();
            Log::truncate();
            
            return response()->json([
                'success' => true,
                'message' => "All {$count} logs cleared successfully"
            ]);
            
        } catch (\Exception $e) {
            FacadesLog::error('Failed to clear logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get logs by user ID
     */
    public function getUserLogs(Request $request, $userId)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if (!in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Admin access required'
                ], 403);
            }
            
            $targetUser = User::find($userId);
            if (!$targetUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }
            
            $logs = Log::with('user')
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $logs,
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                ],
                'total' => $logs->count()
            ]);
            
        } catch (\Exception $e) {
            FacadesLog::error('Failed to fetch user logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get logs by action type
     */
    public function getByAction(Request $request, $action)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if (!in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Admin access required'
                ], 403);
            }
            
            $logs = Log::with('user')
                ->where('action', 'LIKE', "%{$action}%")
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $logs,
                'action' => $action,
                'total' => $logs->count()
            ]);
            
        } catch (\Exception $e) {
            FacadesLog::error('Failed to fetch logs by action: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get logs by date range
     */
    public function getByDateRange(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            if (!in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Admin access required'
                ], 403);
            }
            
            $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);
            
            $logs = Log::with('user')
                ->whereBetween('created_at', [
                    $request->start_date . ' 00:00:00',
                    $request->end_date . ' 23:59:59'
                ])
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $logs,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'total' => $logs->count()
            ]);
            
        } catch (\Exception $e) {
            FacadesLog::error('Failed to fetch logs by date range: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch logs: ' . $e->getMessage()
            ], 500);
        }
    }
}