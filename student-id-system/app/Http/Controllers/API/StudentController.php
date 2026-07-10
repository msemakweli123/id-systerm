<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\IdCard;
use App\Models\Program;
use App\Models\Department;
use App\Models\Photo;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log as FacadesLog;

class StudentController extends Controller
{
    /* ================= GET LOGGED IN STUDENT ================= */

    public function me(Request $request)
    {
        try {
            $student = Student::with(['user','program','department','photos'])
                ->where('user_id', $request->user()->id)
                ->first();

            return response()->json([
                'success' => true,
                'student' => $student
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= GET ALL STUDENTS ================= */

    public function index()
    {
        try {
            $students = Student::with(['user','program','department','photos'])
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'students' => $students
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= SHOW STUDENT ================= */

    public function show($id)
    {
        try {
            $student = Student::with(['user','program','department','photos'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'student' => $student
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }
    }

    /* ================= CREATE STUDENT ================= */

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'program_id' => 'required|exists:programs,id',
                'department_id' => 'required|exists:departments,id',
                'phone' => 'nullable|string',
                'gender' => 'nullable|string',
                'dob' => 'nullable|date',
                'address' => 'nullable|string',
                'start_year' => 'nullable|integer|min:2000|max:' . (date('Y') + 1),
                'end_year' => 'nullable|integer|min:2000|max:' . (date('Y') + 10),
            ]);

            $lastRecord = Student::latest('id')->first();
            $nextNumber = $lastRecord ? $lastRecord->id + 1 : 1;

            $regNumber = '142330' . $nextNumber . '/T.26';

            // USER (default active)
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make('mk123'),
                'role' => 'student',
                'status' => 'active'
            ]);

            // STUDENT (no status column here)
            $student = Student::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'reg_number' => $regNumber,
                'program_id' => $request->program_id,
                'department_id' => $request->department_id,
                'phone' => $request->phone,
                'email' => $request->email,
                'gender' => $request->gender,
                'dob' => $request->dob,
                'address' => $request->address,
                'start_year' => $request->start_year,
                'end_year' => $request->end_year,
            ]);

            // Log the activity
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'student_created',
                'description' => 'Created student: ' . $request->name . ' (Reg: ' . $regNumber . ')',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $student->load(['user','program','department','photos']);

            return response()->json([
                'success' => true,
                'message' => 'Student created successfully',
                'default_password' => 'mk123',
                'student' => $student
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= UPDATE STATUS ================= */

    public function updateStatus(Request $request, $id)
    {
        try {
            $request->validate([
                'status' => 'required|in:active,inactive,suspended'
            ]);

            $student = Student::findOrFail($id);
            $user = User::findOrFail($student->user_id);
            
            // ✅ ONLY update the user status (students table doesn't have status column)
            $user->status = $request->status;
            $user->save();

            // Log the activity
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'student_status_updated',
                'description' => 'Updated student ' . ($student->name ?? 'Unknown') . ' status to: ' . $request->status,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $student->load(['user', 'program', 'department', 'photos']);

            return response()->json([
                'success' => true,
                'message' => 'Student status updated successfully',
                'student' => $student,
                'status' => $request->status
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= RESET PASSWORD ================= */

    public function resetPassword($id)
    {
        try {
            $student = Student::findOrFail($id);
            $user = User::findOrFail($student->user_id);
            $user->password = Hash::make('mk123');
            $user->save();

            // Log the activity
            Log::create([
                'user_id' => request()->user()->id,
                'action' => 'student_password_reset',
                'description' => 'Reset password for student: ' . ($student->name ?? 'Unknown'),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= UPDATE STUDENT ================= */

    public function update(Request $request, $id)
    {
        try {
            $student = Student::findOrFail($id);

            $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $student->user_id,
                'reg_number' => 'sometimes|unique:students,reg_number,' . $id,
                'program_id' => 'sometimes|exists:programs,id',
                'department_id' => 'sometimes|exists:departments,id',
                'phone' => 'nullable|string',
                'gender' => 'nullable|string',
                'dob' => 'nullable|date',
                'address' => 'nullable|string',
                'start_year' => 'nullable|integer|min:2000|max:' . (date('Y') + 1),
                'end_year' => 'nullable|integer|min:2000|max:' . (date('Y') + 10),
            ]);

            $user = User::find($student->user_id);

            if ($user) {
                if ($request->filled('name')) $user->name = $request->name;
                if ($request->filled('email')) $user->email = $request->email;
                $user->save();
            }

            $student->update([
                'reg_number' => $request->reg_number ?? $student->reg_number,
                'program_id' => $request->program_id ?? $student->program_id,
                'department_id' => $request->department_id ?? $student->department_id,
                'phone' => $request->phone ?? $student->phone,
                'gender' => $request->gender ?? $student->gender,
                'dob' => $request->dob ?? $student->dob,
                'address' => $request->address ?? $student->address,
                'start_year' => $request->start_year ?? $student->start_year,
                'end_year' => $request->end_year ?? $student->end_year,
            ]);

            // Log the activity
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'student_updated',
                'description' => 'Updated student: ' . ($student->name ?? 'Unknown'),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $student->load(['user','program','department','photos']);

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully',
                'student' => $student
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= DELETE STUDENT ================= */

    public function destroy($id)
    {
        try {
            $student = Student::findOrFail($id);

            // Delete photo files
            $photos = Photo::where('student_id', $student->id)->get();
            foreach ($photos as $photo) {
                $filePath = public_path('photos/' . $photo->path);
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
            
            Photo::where('student_id', $student->id)->delete();
            
            // Log before deleting
            Log::create([
                'user_id' => request()->user()->id,
                'action' => 'student_deleted',
                'description' => 'Deleted student: ' . ($student->name ?? 'Unknown'),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
            
            User::where('id', $student->user_id)->delete();
            $student->delete();

            return response()->json([
                'success' => true,
                'message' => 'Student deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= DASHBOARD STATS ================= */

    public function dashboardStats()
    {
        try {
            $currentYear = date('Y');
            $startYears = Student::select('start_year')
                ->whereNotNull('start_year')
                ->groupBy('start_year')
                ->get()
                ->pluck('start_year')
                ->toArray();

            $yearStats = [];
            foreach ($startYears as $year) {
                $yearStats[$year] = Student::where('start_year', $year)->count();
            }

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_students' => Student::count(),
                    'total_programs' => Program::count(),
                    'total_departments' => Department::count(),
                    'generated_ids' => IdCard::count(),
                    'approved_photos' => Photo::where('status', 'approved')->count(),
                    'students_by_year' => $yearStats,
                    'students_current_year' => Student::where('start_year', $currentYear)->count(),
                    'students_graduating_soon' => Student::where('end_year', $currentYear)->count(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= TOGGLE STATUS ================= */

    public function toggleStatus($id)
    {
        try {
            $student = Student::findOrFail($id);
            $user = User::findOrFail($student->user_id);
            
            // Toggle status
            $newStatus = ($user->status === 'active') ? 'inactive' : 'active';
            
            // ✅ ONLY update the user status
            $user->status = $newStatus;
            $user->save();

            // Log the activity
            Log::create([
                'user_id' => request()->user()->id,
                'action' => 'student_status_toggled',
                'description' => 'Toggled student ' . ($student->name ?? 'Unknown') . ' status to: ' . $newStatus,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            $student->load(['user','program','department','photos']);

            return response()->json([
                'success' => true,
                'message' => 'Student status toggled successfully',
                'student' => $student,
                'status' => $newStatus
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= UPLOAD PHOTO ================= */

    public function uploadPhoto(Request $request)
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

            // Check for pending photo
            $existing = Photo::where('student_id', $student->id)
                ->where('status', 'pending')
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending photo. Please wait for admin approval.'
                ], 403);
            }

            // Delete old photo
            $old = Photo::where('student_id', $student->id)->first();
            if ($old) {
                $oldPath = public_path('photos/' . $old->path);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
                $old->delete();
            }

            // Ensure directory exists
            if (!file_exists(public_path('photos'))) {
                mkdir(public_path('photos'), 0777, true);
            }

            // Save new photo
            $file = $request->file('photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('photos'), $filename);

            // Create photo record
            $photo = Photo::create([
                'student_id' => $student->id,
                'path' => $filename,
                'status' => 'pending'
            ]);

            // Log the activity
            Log::create([
                'user_id' => auth()->id(),
                'action' => 'photo_uploaded',
                'description' => 'Uploaded photo for student: ' . ($student->name ?? 'Unknown'),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'photo' => [
                    'id' => $photo->id,
                    'path' => $filename,
                    'status' => $photo->status,
                    'created_at' => $photo->created_at
                ],
                'url' => asset('photos/' . $filename)
            ], 201);

        } catch (\Exception $e) {
            FacadesLog::error('Student photo upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /* ================= GET STUDENT PHOTO ================= */

    public function getPhoto(Request $request)
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
                    'id' => $photo->id,
                    'path' => $photo->path,
                    'status' => $photo->status
                ],
                'url' => asset('photos/' . $photo->path)
            ]);

        } catch (\Exception $e) {
            FacadesLog::error('Get student photo error: ' . $e->getMessage());
            return response()->json([
                'photo' => null,
                'url' => null
            ]);
        }
    }

    /* ================= GET STUDENTS BY YEAR ================= */

    /**
     * Get students filtered by start year
     */
    public function getByYear($year)
    {
        try {
            $students = Student::with(['user','program','department','photos'])
                ->where('start_year', $year)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'year' => $year,
                'count' => $students->count(),
                'students' => $students
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= GET CURRENT YEAR STUDENTS ================= */

    /**
     * Get students currently enrolled (based on start_year and end_year)
     */
    public function getCurrentStudents()
    {
        try {
            $currentYear = date('Y');
            
            $students = Student::with(['user','program','department','photos'])
                ->where('start_year', '<=', $currentYear)
                ->where(function($query) use ($currentYear) {
                    $query->whereNull('end_year')
                          ->orWhere('end_year', '>=', $currentYear);
                })
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'count' => $students->count(),
                'students' => $students
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= GET GRADUATED STUDENTS ================= */

    /**
     * Get students who have graduated
     */
    public function getGraduatedStudents()
    {
        try {
            $currentYear = date('Y');
            
            $students = Student::with(['user','program','department','photos'])
                ->whereNotNull('end_year')
                ->where('end_year', '<', $currentYear)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'count' => $students->count(),
                'students' => $students
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= GET STUDENT YEAR OF STUDY ================= */

    /**
     * Get a specific student's year of study
     */
    public function getYearOfStudy($id)
    {
        try {
            $student = Student::with(['user','program','department','photos'])
                ->findOrFail($id);

            $yearOfStudy = $student->year_of_study ?? 'N/A';
            $studyPeriod = $student->study_period ?? 'N/A';

            return response()->json([
                'success' => true,
                'student' => $student,
                'year_of_study' => $yearOfStudy,
                'study_period' => $studyPeriod,
                'start_year' => $student->start_year,
                'end_year' => $student->end_year,
                'is_active' => $student->isActive(),
                'has_graduated' => $student->hasGraduated(),
                'is_enrolled' => $student->isEnrolled(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }
    }
}