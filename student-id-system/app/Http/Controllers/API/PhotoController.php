<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Photo;
use App\Models\Student;
use App\Models\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PhotoController extends Controller
{
    // ================= UPLOAD =================
    public function upload(Request $request)
    {
        try {
            $request->validate([
                'photo' => 'required|image|mimes:jpg,jpeg,png|max:2048'
            ]);

            $student = Student::where('user_id', auth()->id())->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            // Prevent multiple pending uploads
            $existing = Photo::where('student_id', $student->id)
                ->where('status', 'pending')
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending photo. Please wait for admin approval.'
                ], 403);
            }

            // Delete old photo safely
            $old = Photo::where('student_id', $student->id)->first();
            if ($old) {
                // Delete file from public/photos
                $oldPath = public_path('photos/' . basename($old->path));
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
                $old->delete();
            }

            // Save file to public/photos
            $file = $request->file('photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('photos'), $filename);

            // Save path without 'photos/' prefix for consistency
            $path = 'photos/' . $filename;

            $photo = Photo::create([
                'student_id' => $student->id,
                'path' => $filename, // Store just the filename
                'status' => 'pending'
            ]);

            // Return the correct URL
            return response()->json([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'photo' => [
                    'id' => $photo->id,
                    'path' => $filename,
                    'status' => $photo->status,
                    'created_at' => $photo->created_at
                ],
                'url' => asset('photos/' . $filename) // ✅ Correct URL
            ], 201);

        } catch (\Exception $e) {
            Log::error('Photo upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // ================= MY PHOTO =================
    public function myPhoto()
    {
        try {
            $student = Student::where('user_id', auth()->id())->first();

            if (!$student) {
                return response()->json([
                    'photo' => null,
                    'url' => null
                ]);
            }

            $photo = Photo::where('student_id', $student->id)
                ->latest()
                ->first();

            if (!$photo) {
                return response()->json([
                    'photo' => null,
                    'url' => null
                ]);
            }

            return response()->json([
                'photo' => [
                    'path' => $photo->path,
                    'status' => $photo->status
                ],
                'url' => asset('photos/' . $photo->path) // ✅ Correct URL
            ]);

        } catch (\Exception $e) {
            Log::error('Fetch photo error: ' . $e->getMessage());
            return response()->json([
                'photo' => null,
                'url' => null
            ]);
        }
    }

    // ================= PENDING =================
    public function pending()
    {
        try {
            $photos = Photo::with('student.user')
                ->where('status', 'pending')
                ->latest()
                ->get()
                ->map(function ($photo) {
                    return [
                        'id' => $photo->id,
                        'path' => $photo->path,
                        'status' => $photo->status,
                        'student' => $photo->student,
                        'url' => asset('photos/' . $photo->path), // ✅ Correct URL
                        'created_at' => $photo->created_at
                    ];
                });

            return response()->json($photos);

        } catch (\Exception $e) {
            Log::error('Pending photos error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending photos'
            ], 500);
        }
    }

    // ================= APPROVE =================
    public function approve($id)
    {
        try {
            $photo = Photo::with('student')->findOrFail($id);

            $photo->status = 'approved';
            $photo->save();

            if ($photo->student) {
                Notification::create([
                    'user_id' => $photo->student->user_id,
                    'title' => 'Photo Approved',
                    'message' => 'Your photo has been approved successfully!',
                    'type' => 'success',
                    'is_read' => 0
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Photo approved successfully',
                'photo' => [
                    'id' => $photo->id,
                    'path' => $photo->path,
                    'status' => $photo->status,
                    'url' => asset('photos/' . $photo->path) // ✅ Correct URL
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Approve photo error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve photo'
            ], 500);
        }
    }

    // ================= REJECT =================
    public function reject($id)
    {
        try {
            $photo = Photo::with('student')->findOrFail($id);

            // Delete file from public/photos
            $filePath = public_path('photos/' . $photo->path);
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            $studentUserId = $photo->student->user_id ?? null;
            $photo->delete();

            if ($studentUserId) {
                Notification::create([
                    'user_id' => $studentUserId,
                    'title' => 'Photo Rejected',
                    'message' => 'Your photo has been rejected. Please upload a new one.',
                    'type' => 'error',
                    'is_read' => 0
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Photo rejected successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Reject photo error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject photo'
            ], 500);
        }
    }
}