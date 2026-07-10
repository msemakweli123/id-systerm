<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\StudentController;
use App\Http\Controllers\API\IdCardController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\LogController;
use App\Http\Controllers\API\DepartmentController;
use App\Http\Controllers\API\ProgramController;
use App\Http\Controllers\API\PhotoController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\FacultyController;
use App\Http\Controllers\API\IdTemplateController;
use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\SystemController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\UserController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/verify/{qr_code}', [IdCardController::class, 'verify']);
Route::get('/departments/{id}/programs', [ProgramController::class, 'getByDepartment']);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', fn (Request $request) => $request->user());

    /* ================= PROFILE ================= */
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/password', [ProfileController::class, 'changePassword']);

    /* ================= PHOTOS - Student Routes ================= */
    Route::get('/student/me', [StudentController::class, 'me']);
    Route::get('/student/photo', [PhotoController::class, 'myPhoto']);
    Route::post('/student/upload-photo', [PhotoController::class, 'upload']);

    /* ================= PHOTOS - Admin Routes ================= */
    Route::get('/photos', [PhotoController::class, 'index']);
    Route::get('/photos/pending', [PhotoController::class, 'pending']);
    Route::post('/photos/approve/{id}', [PhotoController::class, 'approve']);
    Route::post('/photos/reject/{id}', [PhotoController::class, 'reject']);

    /* ================= NOTIFICATIONS ================= */
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read/{id}', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::post('/notifications/create', [NotificationController::class, 'create']);

    /* ================= LOGS ================= */
    Route::get('/logs', [LogController::class, 'index']);

    /* ================= STUDENTS ================= */
    Route::get('/students', [StudentController::class, 'index']);
    Route::post('/students', [StudentController::class, 'store']);
    Route::get('/students/{id}', [StudentController::class, 'show']);
    Route::put('/students/{id}', [StudentController::class, 'update']);
    Route::delete('/students/{id}', [StudentController::class, 'destroy']);
    Route::post('/students/{id}/toggle-status', [StudentController::class, 'toggleStatus']);
    Route::patch('/students/{id}/status', [StudentController::class, 'updateStatus']);
    Route::post('/students/{id}/reset-password', [StudentController::class, 'resetPassword']);

    /* ================= STUDENT STUDY YEAR ROUTES ================= */
    Route::get('/students/year/{year}', [StudentController::class, 'getByYear']);
    Route::get('/students/current', [StudentController::class, 'getCurrentStudents']);
    Route::get('/students/graduated', [StudentController::class, 'getGraduatedStudents']);
    Route::get('/students/{id}/year-of-study', [StudentController::class, 'getYearOfStudy']);

    /* ================= PROGRAMS ================= */
    Route::get('/programs', [ProgramController::class, 'index']);
    Route::post('/programs', [ProgramController::class, 'store']);
    Route::get('/programs/{id}', [ProgramController::class, 'show']);
    Route::put('/programs/{id}', [ProgramController::class, 'update']);
    Route::delete('/programs/{id}', [ProgramController::class, 'destroy']);

    /* ================= DEPARTMENTS ================= */
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::get('/departments/{id}', [DepartmentController::class, 'show']);
    Route::put('/departments/{id}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);

    /* ================= FACULTIES ================= */
    Route::get('/faculties', [FacultyController::class, 'index']);
    Route::post('/faculties', [FacultyController::class, 'store']);
    Route::get('/faculties/{id}', [FacultyController::class, 'show']);
    Route::put('/faculties/{id}', [FacultyController::class, 'update']);
    Route::delete('/faculties/{id}', [FacultyController::class, 'destroy']);

    /* ================= ID TEMPLATES ================= */
    Route::get('/id-templates', [IdTemplateController::class, 'index']);
    Route::get('/id-templates/{id}', [IdTemplateController::class, 'show']);
    Route::post('/id-template/generate', [IdTemplateController::class, 'generateTemplate']);
    Route::post('/id-template/preview', [IdTemplateController::class, 'preview']);
    Route::post('/id-template/upload', [IdTemplateController::class, 'uploadTemplate']);
    Route::put('/id-template/{id}', [IdTemplateController::class, 'update']);
    Route::delete('/id-template/{id}', [IdTemplateController::class, 'destroy']);
    Route::put('/id-template/{id}/activate', [IdTemplateController::class, 'activate']);

    /* ================= ID CARDS ================= */
    Route::get('/id-cards', [IdCardController::class, 'index']);
    Route::post('/id-cards/{studentId}/generate', [IdCardController::class, 'generate']);
    Route::post('/id-cards/{id}/sign', [IdCardController::class, 'addSignature']);
    Route::get('/id-cards/{id}/view', [IdCardController::class, 'view']);
    Route::get('/id-cards/{id}/download', [IdCardController::class, 'download']);
    Route::delete('/id-cards/{id}', [IdCardController::class, 'destroy']);
    Route::post('/id-cards/bulk-generate', [IdCardController::class, 'bulkGenerate']);

    /* ================= ID REQUESTS ================= */
    Route::post('/request-id-card', [IdCardController::class, 'requestIDCard']);
    Route::get('/my-id-card', [IdCardController::class, 'myCard']);

    /* ================= DASHBOARD ================= */
    Route::get('/dashboard/stats', [StudentController::class, 'dashboardStats']);

    /* ================= SUPER ADMIN ROUTES ================= */
    Route::middleware('role:super_admin')->group(function () {

        /* Admin Management */
        Route::get('/admins', [AdminController::class, 'index']);
        Route::post('/admins', [AdminController::class, 'store']);
        Route::get('/admins/{id}', [AdminController::class, 'show']);
        Route::put('/admins/{id}', [AdminController::class, 'update']);
        Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
        Route::patch('/admins/{id}/status', [AdminController::class, 'updateStatus']);
        Route::post('/admins/{id}/activate', [AdminController::class, 'activate']);
        Route::post('/admins/{id}/suspend', [AdminController::class, 'suspend']);
        Route::post('/admins/{id}/deactivate', [AdminController::class, 'deactivate']);

        /* System Reports */
        Route::get('/system/reports', [ReportController::class, 'index']);

        /* System Settings */
        Route::get('/system/settings', [SystemController::class, 'index']);
        Route::post('/system/settings', [SystemController::class, 'update']);

        /* Super Admin Dashboard */
        Route::get('/super-admin/dashboard', [StudentController::class, 'dashboardStats']);
        Route::get('/super-admin/users', [StudentController::class, 'index']);
        Route::get('/super-admin/admins', [AdminController::class, 'index']);
        Route::get('/super-admin/logs', [LogController::class, 'index']);
        
        /* Student Study Year - Admin Only Reports */
        Route::get('/admin/students/year/{year}', [StudentController::class, 'getByYear']);
        Route::get('/admin/students/current', [StudentController::class, 'getCurrentStudents']);
        Route::get('/admin/students/graduated', [StudentController::class, 'getGraduatedStudents']);
        Route::get('/admin/students/graduating/{year}', [StudentController::class, 'getGraduatingStudents']);
        Route::get('/admin/students/enrolled', [StudentController::class, 'getEnrolledStudents']);
        
        // ✅ ADDED: Get all users for super admin
        Route::get('/users', [UserController::class, 'index']);
    });
});

// ✅ IMPORTANT: This route is OUTSIDE the auth middleware group
// The controller handles authentication and authorization directly
Route::get('/id-cards/image/{studentId}', [IdCardController::class, 'getCardImage']);

// ✅ ADD THIS: GET signature for an ID card
Route::get('/id-cards/{id}/signature', [IdCardController::class, 'getSignature']);

// ✅ ADD THIS: DELETE signature from an ID card
Route::delete('/id-cards/{id}/signature', [IdCardController::class, 'removeSignature']);