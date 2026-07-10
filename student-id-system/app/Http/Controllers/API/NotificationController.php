<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class NotificationController extends Controller
{
    // Get notifications for the authenticated user (works for both student and admin)
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $notifications = Notification::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'notifications' => $notifications
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications: ' . $e->getMessage(),
                'notifications' => []
            ], 500);
        }
    }
    
    // Mark notification as read
    public function markAsRead(Request $request, $id)
    {
        try {
            $user = $request->user();
            $notification = Notification::findOrFail($id);
            
            // Security check: notification must belong to this user
            if ($notification->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $notification->update(['is_read' => 1]);
            
            return response()->json([
                'success' => true,
                'message' => 'Marked as read'
            ]);
            
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark as read: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Mark all notifications as read for the authenticated user
    public function markAllAsRead(Request $request)
    {
        try {
            $user = $request->user();
            
            Notification::where('user_id', $user->id)
                ->where('is_read', 0)
                ->update(['is_read' => 1]);
            
            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all as read: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Get unread count for the authenticated user
    public function unreadCount(Request $request)
    {
        try {
            $user = $request->user();
            
            $count = Notification::where('user_id', $user->id)
                ->where('is_read', 0)
                ->count();
            
            return response()->json([
                'success' => true,
                'unread_count' => $count
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'unread_count' => 0,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    // Delete notification
    public function destroy($id)
    {
        try {
            $notification = Notification::findOrFail($id);
            $notification->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully'
            ]);
            
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Create a notification (helper method)
    public function create(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'required|in:success,error,info'
            ]);
            
            $notification = Notification::create([
                'user_id' => $request->user_id,
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->type,
                'is_read' => 0
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Notification created successfully',
                'notification' => $notification
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create notification: ' . $e->getMessage()
            ], 500);
        }
    }
}