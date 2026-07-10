<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * GET /api/admins
     * Get all admins and super admins
     */
    public function index()
    {
        $admins = User::whereIn('role', ['admin', 'super_admin'])
            ->select(
                'id',
                'name',
                'email',
                'role',
                'status',
                'created_at',
                'updated_at'
            )
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $admins,
            'total' => $admins->count()
        ]);
    }

    /**
     * POST /api/admins
     * Create a new admin or super admin
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,super_admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'status'   => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin created successfully',
            'data'    => $admin,
        ], 201);
    }

    /**
     * GET /api/admins/{id}
     * Get a specific admin or super admin
     */
    public function show($id)
    {
        $admin = User::whereIn('role', ['admin', 'super_admin'])
            ->find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $admin
        ]);
    }

    /**
     * PUT /api/admins/{id}
     * Update an admin or super admin
     */
    public function update(Request $request, $id)
    {
        $admin = User::whereIn('role', ['admin', 'super_admin'])
            ->find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'     => 'nullable|string|max:255',
            'email'    => 'nullable|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role'     => 'nullable|in:admin,super_admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->has('name')) {
            $admin->name = $request->name;
        }

        if ($request->has('email')) {
            $admin->email = $request->email;
        }

        if ($request->has('role')) {
            $admin->role = $request->role;
        }

        if ($request->filled('password')) {
            $admin->password = Hash::make($request->password);
        }

        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Admin updated successfully',
            'data'    => $admin
        ]);
    }

    /**
     * DELETE /api/admins/{id}
     * Delete an admin or super admin
     */
    public function destroy($id)
    {
        // Fix: Include both admin and super_admin
        $admin = User::whereIn('role', ['admin', 'super_admin'])->find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found'
            ], 404);
        }

        // Prevent deleting yourself
        if ($admin->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ], 403);
        }

        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Admin deleted successfully'
        ]);
    }

    /**
     * PATCH /api/admins/{id}/status
     * Update admin status
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,suspended,inactive'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = User::whereIn('role', ['admin', 'super_admin'])
            ->find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found'
            ], 404);
        }

        // Protect Super Admin from being suspended or deactivated
        if ($admin->role === 'super_admin' && $request->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Super Admin cannot be suspended or deactivated'
            ], 403);
        }

        $admin->status = $request->status;
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data'    => $admin
        ]);
    }

    /**
     * POST /api/admins/{id}/activate
     */
    public function activate($id)
    {
        return $this->changeStatus($id, 'active');
    }

    /**
     * POST /api/admins/{id}/suspend
     */
    public function suspend($id)
    {
        return $this->changeStatus($id, 'suspended');
    }

    /**
     * POST /api/admins/{id}/deactivate
     */
    public function deactivate($id)
    {
        return $this->changeStatus($id, 'inactive');
    }

    /**
     * Common Status Method
     */
    private function changeStatus($id, $status)
    {
        // Fix: Include both admin and super_admin
        $admin = User::whereIn('role', ['admin', 'super_admin'])->find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found'
            ], 404);
        }

        // Protect Super Admin
        if ($admin->role === 'super_admin' && $status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Super Admin cannot be suspended or deactivated'
            ], 403);
        }

        $admin->status = $status;
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => "Admin {$status} successfully",
            'data'    => $admin
        ]);
    }
}