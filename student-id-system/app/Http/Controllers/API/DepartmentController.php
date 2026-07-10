<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Department;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    // ================= GET ALL =================
    public function index()
    {
        return response()->json(
            Department::with('faculty') // optional if relationship exists
                ->latest()
                ->get()
        );
    }

    // ================= CREATE =================
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('departments', 'name')
                ],
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('departments', 'code')
                ],
                'faculty_id' => [
                    'required',
                    'exists:faculties,id'
                ],
            ]);

            $department = Department::create($validated);

            return response()->json([
                'message' => 'Department created successfully',
                'data' => $department
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Server error while creating department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ================= SHOW =================
    public function show($id)
    {
        try {
            return response()->json(
                Department::with('faculty')->findOrFail($id)
            );
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Department not found'
            ], 404);
        }
    }

    // ================= UPDATE =================
    public function update(Request $request, $id)
    {
        try {
            $department = Department::findOrFail($id);

            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('departments', 'name')->ignore($id)
                ],
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('departments', 'code')->ignore($id)
                ],
                'faculty_id' => [
                    'required',
                    'exists:faculties,id'
                ],
            ]);

            $department->update($validated);

            return response()->json([
                'message' => 'Department updated successfully',
                'data' => $department
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ================= DELETE =================
    public function destroy($id)
    {
        try {
            $department = Department::findOrFail($id);
            $department->delete();

            return response()->json([
                'message' => 'Department deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting department',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}