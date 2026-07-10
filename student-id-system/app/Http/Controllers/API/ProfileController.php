<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

use App\Models\Student;
use App\Models\Notification;

class ProfileController extends Controller
{
    /**
     * =========================
     * UPDATE PROFILE
     * =========================
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
        ]);

        // ✅ update user safely
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        // ✅ update student safely
        $student = Student::where('user_id', $user->id)->first();

        if ($student) {
            $student->update([
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);
        }

        // ✅ notification (safe insert)
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Profile Updated',
            'message' => 'Your profile has been updated successfully',
            'type' => 'success',
            'is_read' => 0
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
            'student' => $student
        ]);
    }

    /**
     * =========================
     * CHANGE PASSWORD
     * =========================
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $request->validate([
            'password' => 'required|min:6|confirmed'
        ]);

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // ✅ notification
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Password Changed',
            'message' => 'Your password was changed successfully',
            'type' => 'success',
            'is_read' => 0
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }
}