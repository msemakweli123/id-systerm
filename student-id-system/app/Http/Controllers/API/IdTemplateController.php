<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\IdTemplate;
use App\Models\Student;
use App\Models\IdCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class IdTemplateController extends Controller
{
    public function index()
    {
        try {
            $templates = IdTemplate::orderBy('created_at', 'desc')->get();
            
            $templates->each(function($template) {
                $template->full_url = $template->path ? asset('storage/' . $template->path) : null;
                $template->file_exists = $template->path ? Storage::disk('public')->exists($template->path) : false;
            });
            
            return response()->json([
                'success' => true,
                'templates' => $templates
            ]);
        } catch (\Exception $e) {
            Log::error('Fetch templates error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch templates: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function show($id)
    {
        try {
            $template = IdTemplate::findOrFail($id);
            $template->full_url = $template->path ? asset('storage/' . $template->path) : null;
            $template->file_exists = $template->path ? Storage::disk('public')->exists($template->path) : false;
            
            return response()->json([
                'success' => true,
                'template' => $template
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }
    }
    
    public function uploadTemplate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'template' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
                'name' => 'required|string|max:255',
                'program' => 'sometimes|string|max:255',
                'department' => 'sometimes|string|max:255',
                'status' => 'sometimes|string|in:active,inactive',
                'width' => 'sometimes|integer',
                'height' => 'sometimes|integer',
                'settings' => 'sometimes|json'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ], 422);
            }
            
            if ($request->status === 'active') {
                IdTemplate::where('status', 'active')->update(['status' => 'inactive']);
            }
            
            $file = $request->file('template');
            $filename = 'templates/' . time() . '_' . preg_replace('/[^a-zA-Z0-9]/', '_', $request->name) . '.' . $file->getClientOriginalExtension();
            
            $path = $file->storeAs('public', $filename);
            
            if (!$path) {
                throw new \Exception('Failed to store file');
            }
            
            $imageInfo = getimagesize($file->getRealPath());
            $width = $request->width ?? $imageInfo[0] ?? 600;
            $height = $request->height ?? $imageInfo[1] ?? 400;
            
            $template = IdTemplate::create([
                'name' => $request->name,
                'path' => $filename,
                'program' => $request->program ?? null,
                'department' => $request->department ?? null,
                'status' => $request->status ?? 'inactive',
                'is_default' => $request->is_default ?? false,
                'width' => $width,
                'height' => $height,
                'settings' => $request->settings ?? json_encode([
                    'primary_color' => '#1a237e',
                    'secondary_color' => '#0d47a1',
                    'text_color' => '#ffffff',
                    'accent_color' => '#ffd54f'
                ])
            ]);
            
            $template->full_url = asset('storage/' . $filename);
            $template->file_exists = true;
            
            return response()->json([
                'success' => true,
                'message' => 'Template uploaded successfully',
                'template' => $template
            ]);
            
        } catch (\Exception $e) {
            Log::error('Upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload template: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function generateTemplate(Request $request)
    {
        try {
            if (!extension_loaded('gd')) {
                return response()->json([
                    'success' => false,
                    'message' => 'GD extension is not enabled. Please enable it in php.ini'
                ], 500);
            }

            $validator = Validator::make($request->all(), [
                'style' => 'required|string|in:darkBlue,whiteMilk,brown,royalGold',
                'name' => 'required|string|max:255',
                'program' => 'sometimes|string|max:255',
                'department' => 'sometimes|string|max:255',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ], 422);
            }
            
            $width = 600;
            $height = 400;
            
            $img = imagecreatetruecolor($width, $height);
            imageantialias($img, true);
            
            $styleColors = [
                'darkBlue' => [
                    'primary' => [26, 35, 126],
                    'secondary' => [13, 71, 161],
                    'text' => [255, 255, 255],
                    'accent' => [255, 215, 0],
                    'header_bg' => [13, 71, 161],
                    'card_bg' => [255, 255, 255],
                    'name' => 'Dark Blue'
                ],
                'whiteMilk' => [
                    'primary' => [33, 150, 243],
                    'secondary' => [66, 165, 245],
                    'text' => [33, 33, 33],
                    'accent' => [255, 193, 7],
                    'header_bg' => [25, 118, 210],
                    'card_bg' => [255, 255, 255],
                    'name' => 'White Milk'
                ],
                'brown' => [
                    'primary' => [121, 85, 72],
                    'secondary' => [93, 64, 55],
                    'text' => [255, 255, 255],
                    'accent' => [255, 193, 7],
                    'header_bg' => [93, 64, 55],
                    'card_bg' => [239, 235, 233],
                    'name' => 'Brown'
                ],
                'royalGold' => [
                    'primary' => [184, 134, 11],
                    'secondary' => [218, 165, 32],
                    'text' => [33, 33, 33],
                    'accent' => [255, 215, 0],
                    'header_bg' => [184, 134, 11],
                    'card_bg' => [255, 248, 225],
                    'name' => 'Royal Gold'
                ]
            ];
            
            $colors = $styleColors[$request->style];
            
            $primaryColor = imagecolorallocate($img, $colors['primary'][0], $colors['primary'][1], $colors['primary'][2]);
            $secondaryColor = imagecolorallocate($img, $colors['secondary'][0], $colors['secondary'][1], $colors['secondary'][2]);
            $textColor = imagecolorallocate($img, $colors['text'][0], $colors['text'][1], $colors['text'][2]);
            $accentColor = imagecolorallocate($img, $colors['accent'][0], $colors['accent'][1], $colors['accent'][2]);
            $headerBgColor = imagecolorallocate($img, $colors['header_bg'][0], $colors['header_bg'][1], $colors['header_bg'][2]);
            $cardBgColor = imagecolorallocate($img, $colors['card_bg'][0], $colors['card_bg'][1], $colors['card_bg'][2]);
            
            // Fill background
            imagefilledrectangle($img, 0, 0, $width, $height, $cardBgColor);
            
            // Outer border - keep this for card frame
            imagerectangle($img, 5, 5, $width - 5, $height - 5, $primaryColor);
            imagerectangle($img, 8, 8, $width - 8, $height - 8, $secondaryColor);
            
            // Header
            imagefilledrectangle($img, 11, 11, $width - 11, 90, $headerBgColor);
            
            $universityText = "MZUMBE UNIVERSITY";
            $universityX = ($width - (imagefontwidth(5) * strlen($universityText))) / 2;
            imagestring($img, 5, $universityX, 25, $universityText, $accentColor);
            
            $subText = "STUDENT IDENTIFICATION CARD";
            $subX = ($width - (imagefontwidth(4) * strlen($subText))) / 2;
            imagestring($img, 4, $subX, 55, $subText, $textColor);
            
            // LINE UNDER HEADER - REMOVED
            // $lineY = 90;
            // imageline($img, 11, $lineY, $width - 11, $lineY, $accentColor);
            
            // Photo area
            $photoX = 25;
            $photoY = 105;
            $photoWidth = 140;
            $photoHeight = 170;
            
            imagerectangle($img, $photoX, $photoY, $photoX + $photoWidth, $photoY + $photoHeight, $primaryColor);
            imagerectangle($img, $photoX + 3, $photoY + 3, $photoX + $photoWidth - 3, $photoY + $photoHeight - 3, $secondaryColor);
            
            $photoBgColor = imagecolorallocate($img, 240, 240, 240);
            imagefilledrectangle($img, $photoX + 6, $photoY + 6, $photoX + $photoWidth - 6, $photoY + $photoHeight - 6, $photoBgColor);
            
            // Info area - labels only
            $infoX = 185;
            $infoY = 108;
            $lineHeight = 26;
            
            $fields = [
                ['label' => 'PROGRAM:', 'y' => $infoY],
                ['label' => 'FULL NAME:', 'y' => $infoY + ($lineHeight * 1)],
                ['label' => 'REG NUMBER:', 'y' => $infoY + ($lineHeight * 2)],
                ['label' => 'DEPARTMENT:', 'y' => $infoY + ($lineHeight * 3)],
                ['label' => 'VALID UNTIL:', 'y' => $infoY + ($lineHeight * 4)]
            ];
            
            foreach ($fields as $field) {
                imagestring($img, 3, $infoX, $field['y'], $field['label'], $secondaryColor);
            }
            
            $emailY = $infoY + ($lineHeight * 5);
            imagestring($img, 3, $infoX, $emailY, 'EMAIL:', $secondaryColor);
            
            // ========== SIGNATURES - NO BORDERS, NO LINES ==========
            $sigY = 290;
            $sigHeight = 30;
            
            // LEFT: Student Signature - NO BORDER, NO LINES
            $sigX1 = 25;
            $sigWidth1 = 200;
            // Draw a light background for the signature area (subtle)
            $sigBgColor = imagecolorallocatealpha($img, 0, 0, 0, 15);
            imagefilledrectangle($img, $sigX1, $sigY, $sigX1 + $sigWidth1, $sigY + $sigHeight, $sigBgColor);
            $sigText1 = "Student Signature";
            $sigText1X = $sigX1 + ($sigWidth1 - (imagefontwidth(2) * strlen($sigText1))) / 2;
            $grayColor = imagecolorallocate($img, 150, 150, 150);
            imagestring($img, 2, $sigText1X, $sigY + 10, $sigText1, $grayColor);
            
            // RIGHT: Authorized Signature - NO BORDER, NO LINES
            $sigX2 = 245;
            $sigWidth2 = 200;
            // Draw a light background for the signature area (subtle)
            imagefilledrectangle($img, $sigX2, $sigY, $sigX2 + $sigWidth2, $sigY + $sigHeight, $sigBgColor);
            $sigText2 = "Authorized Signature";
            $sigText2X = $sigX2 + ($sigWidth2 - (imagefontwidth(2) * strlen($sigText2))) / 2;
            imagestring($img, 2, $sigText2X, $sigY + 10, $sigText2, $grayColor);
            
            // NO imagerectangle() calls around signatures
            // NO lines drawn at all
            
            // Footer
            $footerY = 340;
            $footerText = "This card is property of Mzumbe University. Valid only with photo and signature.";
            $footerX = ($width - (imagefontwidth(2) * strlen($footerText))) / 2;
            $footerColor = imagecolorallocate($img, 100, 100, 100);
            imagestring($img, 2, $footerX, $footerY, $footerText, $footerColor);
            
            $storagePath = storage_path('app/public/templates');
            if (!file_exists($storagePath)) {
                mkdir($storagePath, 0755, true);
            }
            
            $filename = 'templates/template_' . time() . '_' . $request->style . '.png';
            $fullPath = storage_path('app/public/' . $filename);
            
            imagepng($img, $fullPath, 9);
            imagedestroy($img);
            
            if (!file_exists($fullPath)) {
                throw new \Exception('Failed to save image file at: ' . $fullPath);
            }
            
            IdTemplate::where('status', 'active')->update(['status' => 'inactive']);
            
            $settings = json_encode([
                'primary_color' => '#' . sprintf("%02x%02x%02x", $colors['primary'][0], $colors['primary'][1], $colors['primary'][2]),
                'secondary_color' => '#' . sprintf("%02x%02x%02x", $colors['secondary'][0], $colors['secondary'][1], $colors['secondary'][2]),
                'text_color' => '#' . sprintf("%02x%02x%02x", $colors['text'][0], $colors['text'][1], $colors['text'][2]),
                'accent_color' => '#' . sprintf("%02x%02x%02x", $colors['accent'][0], $colors['accent'][1], $colors['accent'][2]),
                'style_name' => $colors['name']
            ]);
            
            $template = IdTemplate::create([
                'name' => $request->name,
                'path' => $filename,
                'program' => $request->program ?? null,
                'department' => $request->department ?? null,
                'status' => 'active',
                'is_default' => true,
                'width' => $width,
                'height' => $height,
                'settings' => $settings
            ]);
            
            $template->full_url = asset('storage/' . $filename);
            $template->file_exists = true;
            
            return response()->json([
                'success' => true,
                'message' => 'Template generated successfully',
                'template' => $template,
                'url' => asset('storage/' . $filename)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Template generation error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate template: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Preview template with student data
     */
    public function preview(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_id' => 'required|exists:id_templates,id',
                'student_id' => 'required|exists:students,id'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ], 422);
            }
            
            $template = IdTemplate::findOrFail($request->template_id);
            $student = Student::with(['user', 'program.department'])->findOrFail($request->student_id);
            
            // ✅ CHECK IF TEMPLATE FILE EXISTS
            $templatePath = storage_path('app/public/' . $template->path);
            
            if (!file_exists($templatePath)) {
                Log::error('Template file not found: ' . $templatePath);
                
                // Try alternative path
                $altPath = storage_path('app/public/templates/' . basename($template->path));
                if (file_exists($altPath)) {
                    $template->path = 'templates/' . basename($template->path);
                    $template->save();
                    $templatePath = $altPath;
                    Log::info('Template path updated to: ' . $template->path);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Template image file not found. Please generate or upload a template first.'
                    ], 404);
                }
            }
            
            // ✅ USE THE ID CARD CONTROLLER TO GENERATE PREVIEW
            $idCardController = new \App\Http\Controllers\API\IdCardController();
            $previewPath = $idCardController->generateIdCard($student, $template, 'Mzumbe University');
            
            return response()->json([
                'success' => true,
                'message' => 'Preview generated successfully',
                'preview_url' => asset('storage/' . $previewPath),
                'student' => [
                    'name' => $student->full_name ?? $student->user->name ?? 'Unknown',
                    'reg_number' => $student->reg_number ?? 'N/A',
                    'program_code' => $student->program->code ?? 'N/A',
                    'program_name' => $student->program->name ?? 'N/A',
                    'department_code' => $student->program->department->code ?? $student->department->code ?? 'N/A',
                    'department_name' => $student->program->department->name ?? $student->department->name ?? 'N/A',
                    'email' => $student->user->email ?? $student->email ?? 'N/A'
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Preview error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate preview: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function update(Request $request, $id)
    {
        try {
            $template = IdTemplate::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'program' => 'sometimes|string|max:255',
                'department' => 'sometimes|string|max:255',
                'status' => 'sometimes|string|in:active,inactive',
                'is_default' => 'sometimes|boolean',
                'width' => 'sometimes|integer',
                'height' => 'sometimes|integer',
                'settings' => 'sometimes|json'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ], 422);
            }
            
            if ($request->status === 'active') {
                IdTemplate::where('status', 'active')->where('id', '!=', $id)->update(['status' => 'inactive']);
            }
            
            if ($request->is_default) {
                IdTemplate::where('is_default', true)->where('id', '!=', $id)->update(['is_default' => false]);
            }
            
            $template->update($request->only(['name', 'program', 'department', 'status', 'is_default', 'width', 'height', 'settings']));
            $template->full_url = $template->path ? asset('storage/' . $template->path) : null;
            $template->file_exists = $template->path ? Storage::disk('public')->exists($template->path) : false;
            
            return response()->json([
                'success' => true,
                'message' => 'Template updated successfully',
                'template' => $template
            ]);
            
        } catch (\Exception $e) {
            Log::error('Update template error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update template: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function activate($id)
    {
        try {
            IdTemplate::where('status', 'active')->update(['status' => 'inactive']);
            
            $template = IdTemplate::findOrFail($id);
            $template->status = 'active';
            $template->save();
            $template->full_url = $template->path ? asset('storage/' . $template->path) : null;
            $template->file_exists = $template->path ? Storage::disk('public')->exists($template->path) : false;
            
            return response()->json([
                'success' => true,
                'message' => 'Template activated successfully',
                'template' => $template
            ]);
            
        } catch (\Exception $e) {
            Log::error('Activate template error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to activate template: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function destroy($id)
    {
        try {
            $template = IdTemplate::findOrFail($id);
            
            if ($template->path && Storage::disk('public')->exists($template->path)) {
                Storage::disk('public')->delete($template->path);
            }
            
            $template->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Delete template error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete template: ' . $e->getMessage()
            ], 500);
        }
    }
}