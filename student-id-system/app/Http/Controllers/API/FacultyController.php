<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Faculty;

class FacultyController extends Controller
{
    // GET ALL FACULTIES
    public function index()
    {
        return response()->json(
            Faculty::orderBy('id', 'desc')->get()
        );
    }

    // STORE FACULTY
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:faculties,code',
            ]);

            $faculty = Faculty::create([
                'name' => $request->name,
                'code' => $request->code,
            ]);

            return response()->json([
                'message' => 'Faculty created successfully',
                'data' => $faculty
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Server error while creating faculty',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // SHOW
    public function show($id)
    {
        try {
            $faculty = Faculty::findOrFail($id);

            return response()->json($faculty);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Faculty not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        try {
            $faculty = Faculty::findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50',
            ]);

            $faculty->update([
                'name' => $request->name,
                'code' => $request->code,
            ]);

            return response()->json([
                'message' => 'Faculty updated successfully',
                'data' => $faculty
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating faculty',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE
    public function destroy($id)
    {
        try {
            $faculty = Faculty::findOrFail($id);
            $faculty->delete();

            return response()->json([
                'message' => 'Faculty deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting faculty',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}