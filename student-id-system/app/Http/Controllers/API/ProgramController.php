<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Program;

class ProgramController extends Controller
{
    /* ================= GET ALL PROGRAMS ================= */
    public function index(Request $request)
    {
        try {
            $query = Program::with('department')->latest();

            if ($request->filled('department_id')) {
                $query->where('department_id', $request->department_id);
            }

            return response()->json([
                'success' => true,
                'data' => $query->get()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load programs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= GET BY DEPARTMENT ================= */
    public function getByDepartment($id)
    {
        try {
            $programs = Program::with('department')
                ->where('department_id', $id)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $programs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load programs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= CREATE ================= */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|unique:programs,code',
                'department_id' => 'required|exists:departments,id',
            ]);

            $program = Program::create([
                'name' => $request->name,
                'code' => $request->code,
                'department_id' => $request->department_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Program created successfully',
                'data' => $program
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= SHOW ================= */
    public function show($id)
    {
        try {
            $program = Program::with('department')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $program
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Program not found'
            ], 404);
        }
    }

    /* ================= UPDATE (FIXED) ================= */
    public function update(Request $request, $id)
    {
        try {
            $program = Program::findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|unique:programs,code,' . $program->id,
                'department_id' => 'required|exists:departments,id',
            ]);

            $program->update([
                'name' => $request->name,
                'code' => $request->code,
                'department_id' => $request->department_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Program updated successfully',
                'data' => $program
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /* ================= DELETE ================= */
    public function destroy($id)
    {
        try {
            $program = Program::findOrFail($id);
            $program->delete();

            return response()->json([
                'success' => true,
                'message' => 'Program deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete program'
            ], 500);
        }
    }
}