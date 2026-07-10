<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\IdCard;
use App\Models\IdTemplate;
use App\Models\Student;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class IdCardController extends Controller
{
    /**
     * Generate ID card for a student
     */
    public function generate(Request $request, $studentId)
    {
        try {
            DB::beginTransaction();
            
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            Log::info('User generating ID card', ['user_id' => $user->id, 'user_email' => $user->email]);
            
            $validator = Validator::make($request->all(), [
                'university' => 'sometimes|string',
                'template_id' => 'required|exists:id_templates,id',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ], 422);
            }
            
            $student = Student::with(['user', 'program.department'])->findOrFail($studentId);
            
            // Check if card already exists
            $existingCard = IdCard::where('student_id', $studentId)->first();
            if ($existingCard) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID card already exists for this student'
                ], 409);
            }
            
            $template = IdTemplate::findOrFail($request->template_id);
            $universityName = $request->university ?? 'Mzumbe University';
            
            // Generate the ID card image with student data
            $cardPath = $this->generateIdCard($student, $template, $universityName);
            
            // Generate card number
            $cardNumber = 'ID-' . str_pad($student->id, 5, '0', STR_PAD_LEFT) . '-' . date('Y');
            
            // Create ID card with correct data
            $idCard = IdCard::create([
                'student_id' => $studentId,
                'card_number' => $cardNumber,
                'issue_date' => now()->toDateString(),
                'expiry_date' => now()->addYears(5)->toDateString(),
                'status' => 'generated',
                'generated_by' => $user->id,
                'authorized_signature' => $this->getAuthorizedSignature(),
            ]);
            
            DB::commit();
            
            // Create notification for student
            Notification::create([
                'user_id' => $student->user_id,
                'title' => 'ID Card Generated',
                'message' => 'Your ID card has been generated successfully.',
                'type' => 'success',
                'is_read' => 0
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'ID card generated successfully',
                'id_card' => $idCard,
                'card_url' => asset('storage/' . $cardPath)
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ID Card Generation Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate ID card: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get authorized signature from mk.mg
     */
    private function getAuthorizedSignature()
    {
        try {
            // Path to the authorized signature image (mk.mg)
            $signaturePath = storage_path('app/public/signatures/authorized_mk.png');
            
            // If the signature file doesn't exist, create a default one
            if (!file_exists($signaturePath)) {
                Log::info('Authorized signature not found, creating default signature');
                $this->createDefaultAuthorizedSignature();
            }
            
            // Read the signature file and convert to base64
            if (file_exists($signaturePath)) {
                $imageData = file_get_contents($signaturePath);
                $base64 = base64_encode($imageData);
                return 'data:image/png;base64,' . $base64;
            }
            
            Log::warning('Could not find or create authorized signature');
            return null;
            
        } catch (\Exception $e) {
            Log::error('Error getting authorized signature: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Create a default authorized signature - ONLY "mk.mg" with NO lines
     */
    private function createDefaultAuthorizedSignature()
    {
        try {
            $directory = storage_path('app/public/signatures');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            
            $signaturePath = $directory . '/authorized_mk.png';
            
            // Create a signature image with GD
            $width = 200;
            $height = 60;
            $img = imagecreatetruecolor($width, $height);
            
            // Enable alpha channel for transparency
            imagealphablending($img, true);
            imagesavealpha($img, true);
            
            // Transparent background
            $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
            imagefill($img, 0, 0, $transparent);
            
            // Signature color (dark blue)
            $signatureColor = imagecolorallocate($img, 26, 35, 126);
            
            // Draw ONLY "mk.mg" - NO lines, NO extra text
            $text = "mk.mg";
            $fontSize = 5;
            
            // Get text dimensions
            $textWidth = imagefontwidth($fontSize) * strlen($text);
            $textHeight = imagefontheight($fontSize);
            $x = ($width - $textWidth) / 2;
            $y = ($height - $textHeight) / 2 + $textHeight;
            
            // Add ONLY the text "mk.mg"
            imagestring($img, $fontSize, $x, $y - 10, $text, $signatureColor);
            
            // Save the image - NO lines drawn at all
            imagepng($img, $signaturePath, 9);
            imagedestroy($img);
            
            Log::info('Default authorized signature created at: ' . $signaturePath);
            
        } catch (\Exception $e) {
            Log::error('Failed to create default authorized signature: ' . $e->getMessage());
        }
    }
    
    /**
     * Generate ID card image using GD library - fills student data into template
     */
    public function generateIdCard($student, $template, $universityName)
    {
        try {
            // Check if GD extension is loaded
            if (!extension_loaded('gd')) {
                throw new \Exception('GD extension is not enabled. Please enable it in php.ini');
            }

            // Load the template image
            $templatePath = storage_path('app/public/' . $template->path);
            
            if (!file_exists($templatePath)) {
                throw new \Exception('Template image not found at: ' . $templatePath);
            }
            
            $imageInfo = getimagesize($templatePath);
            if (!$imageInfo) {
                throw new \Exception('Invalid template image file');
            }
            
            $imageWidth = $imageInfo[0];
            $imageHeight = $imageInfo[1];
            $mime = $imageInfo['mime'];
            
            // Load image based on type
            if ($mime == 'image/webp') {
                $img = imagecreatefromwebp($templatePath);
            } elseif ($mime == 'image/png') {
                $img = imagecreatefrompng($templatePath);
            } else {
                $img = imagecreatefromjpeg($templatePath);
            }
            
            if (!$img) {
                throw new \Exception('Failed to load template image');
            }
            
            // Allocate colors
            $white = imagecolorallocate($img, 255, 255, 255);
            $gold = imagecolorallocate($img, 255, 215, 0);
            $darkGray = imagecolorallocate($img, 60, 60, 60);
            
            // Get ACTUAL student data
            $studentName = $student->full_name ?? $student->user->name ?? 'Unknown';
            $regNumber = $student->reg_number ?? 'N/A';
            $programCode = $student->program->code ?? 'N/A';
            $departmentCode = $student->program->department->code ?? $student->department->code ?? 'N/A';
            $email = $student->user->email ?? $student->email ?? 'N/A';
            
            // VALID UNTIL - Use end_year if available
            $startYear = $student->start_year ?? null;
            $endYear = $student->end_year ?? null;
            
            if ($endYear) {
                $validUntil = date('d/m/Y', strtotime($endYear . '-12-31'));
            } elseif ($startYear) {
                $calculatedEndYear = $startYear + 4;
                $validUntil = date('d/m/Y', strtotime($calculatedEndYear . '-12-31'));
            } else {
                $validUntil = date('d/m/Y', strtotime('+5 years'));
            }
            
            $issueDate = date('d/m/Y');
            $uniqueId = 'ID-' . str_pad($student->id, 5, '0', STR_PAD_LEFT) . '-' . date('Y');
            
            // Fill student data into the template
            $startX = 185;
            $startY = 108;
            $spacing = 26;
            
            // Colors
            $primaryColor = imagecolorallocate($img, 26, 35, 126);
            $textColor = imagecolorallocate($img, 60, 60, 60);
            
            // Fill each field with actual student data
            $fields = [
                ['label' => 'PROGRAM:', 'value' => $programCode, 'y' => $startY],
                ['label' => 'FULL NAME:', 'value' => substr($studentName, 0, 28), 'y' => $startY + ($spacing * 1)],
                ['label' => 'REG NUMBER:', 'value' => $regNumber, 'y' => $startY + ($spacing * 2)],
                ['label' => 'DEPARTMENT:', 'value' => $departmentCode, 'y' => $startY + ($spacing * 3)],
                ['label' => 'VALID UNTIL:', 'value' => $validUntil, 'y' => $startY + ($spacing * 4)],
            ];
            
            foreach ($fields as $field) {
                imagestring($img, 3, $startX, $field['y'], $field['label'], $primaryColor);
                $valueX = $startX + (imagefontwidth(3) * strlen($field['label'])) + 10;
                imagestring($img, 3, $valueX, $field['y'], ': ' . $field['value'], $textColor);
            }
            
            // Email
            $emailY = $startY + ($spacing * 5);
            imagestring($img, 3, $startX, $emailY, 'EMAIL:', $primaryColor);
            imagestring($img, 3, $startX + (imagefontwidth(3) * 7) + 10, $emailY, ': ' . substr($email, 0, 30), $textColor);
            
            // Add student photo
            $photoPath = $this->getStudentPhotoPath($student);
            if ($photoPath && file_exists($photoPath)) {
                $this->addPhotoToCard($img, $photoPath, 35, 110, 110, 150);
            } else {
                $gray = imagecolorallocate($img, 150, 150, 150);
                imagefilledrectangle($img, 35, 100, 145, 250, $gray);
                imagestring($img, 3, 55, 170, 'NO PHOTO', $white);
            }
            
            // ========== SIGNATURES SECTION ==========
            $idCard = IdCard::where('student_id', $student->id)->first();
            
            // Signature positions
            $sigY = 290;
            $sigHeight = 30;
            
            // LEFT: Student Signature (position 25, 290)
            $studentSigX = 25;
            $studentSigWidth = 200;
            
            Log::info('Generating ID card for student: ' . $student->id);
            Log::info('Has student signature: ' . ($idCard && $idCard->signature ? 'Yes' : 'No'));
            
            // Clear the student signature area
            $bgColor = imagecolorallocate($img, 255, 255, 255);
            imagefilledrectangle($img, $studentSigX, $sigY, $studentSigX + $studentSigWidth, $sigY + $sigHeight, $bgColor);
            
            // Add student signature if exists
            if ($idCard && $idCard->signature) {
                Log::info('Adding student signature to card for student: ' . $student->id);
                $this->addSignatureToCard($img, $idCard->signature, $studentSigX, $sigY, $studentSigWidth, $sigHeight);
            } else {
                // Draw placeholder for student signature
                imagefilledrectangle($img, $studentSigX, $sigY, $studentSigX + $studentSigWidth, $sigY + $sigHeight, imagecolorallocatealpha($img, 0, 0, 0, 20));
                $placeholderText = "Student Signature";
                $textX = $studentSigX + ($studentSigWidth - (imagefontwidth(2) * strlen($placeholderText))) / 2;
                $grayColor = imagecolorallocate($img, 120, 120, 120);
                imagestring($img, 2, $textX, $sigY + 10, $placeholderText, $grayColor);
            }
            
            // RIGHT: Authorized Signature (position 245, 290)
            $authSigX = 245;
            $authSigWidth = 200;
            
            Log::info('Adding authorized signature (mk.mg) to card');
            $authorizedSig = $this->getAuthorizedSignature();
            
            // Clear the authorized signature area
            imagefilledrectangle($img, $authSigX, $sigY, $authSigX + $authSigWidth, $sigY + $sigHeight, $bgColor);
            
            if ($authorizedSig) {
                // Add the authorized signature WITHOUT any lines
                $this->addSignatureToCard($img, $authorizedSig, $authSigX, $sigY, $authSigWidth, $sigHeight);
                Log::info('Authorized signature (mk.mg) added to card at position: ' . $authSigX . ', ' . $sigY);
            } else {
                // No placeholder - keep empty
                Log::info('No authorized signature available - leaving area empty');
            }
            
            // Delete old ID card images before saving new one
            $this->deleteOldIdCardImages($student->id);
            
            // Save the ID card
            $filename = 'id-cards/id_card_' . $student->id . '_' . time() . '.png';
            $fullPath = storage_path('app/public/' . $filename);
            
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            
            imagepng($img, $fullPath, 9);
            imagedestroy($img);
            
            if (!file_exists($fullPath)) {
                throw new \Exception('Failed to save image file');
            }
            
            Log::info('ID card saved successfully at: ' . $fullPath);
            
            return $filename;
            
        } catch (\Exception $e) {
            Log::error('Error in generateIdCard: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }
    
    /**
     * Delete old ID card images for a student
     */
    private function deleteOldIdCardImages($studentId)
    {
        try {
            $basePath = storage_path("app/public/id-cards");
            
            if (!is_dir($basePath)) {
                return;
            }
            
            $patterns = [
                "id_card_{$studentId}_*.png",
                "id_card_{$studentId}_*.jpg", 
                "id_card_{$studentId}_*.jpeg",
                "id_card_{$studentId}.png",
                "id_card_{$studentId}.jpg", 
                "id_card_{$studentId}.jpeg",
            ];

            foreach ($patterns as $pattern) {
                $files = glob($basePath . '/' . $pattern);
                foreach ($files as $file) {
                    if (file_exists($file)) {
                        unlink($file);
                        Log::info('Deleted old ID card image: ' . $file);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error deleting old ID card images: ' . $e->getMessage());
        }
    }
    
    /**
     * Add signature to the ID card image - NO lines, NO borders
     */
    private function addSignatureToCard($img, $signatureData, $x, $y, $width, $height)
    {
        try {
            Log::info('Adding signature at position: ' . $x . ', ' . $y);
            Log::info('Signature data length: ' . strlen($signatureData));
            
            // Decode the base64 signature data
            $signatureData = str_replace('data:image/png;base64,', '', $signatureData);
            $signatureData = str_replace('data:image/jpeg;base64,', '', $signatureData);
            $signatureData = str_replace(' ', '+', $signatureData);
            $imageData = base64_decode($signatureData);
            
            if (!$imageData) {
                Log::warning('Failed to decode signature data');
                return;
            }
            
            Log::info('Decoded image data length: ' . strlen($imageData));
            
            // Create image from string
            $signatureImg = imagecreatefromstring($imageData);
            
            if (!$signatureImg) {
                Log::warning('Failed to create image from signature data');
                return;
            }
            
            Log::info('Signature image created successfully');
            
            // Get original dimensions
            $origWidth = imagesx($signatureImg);
            $origHeight = imagesy($signatureImg);
            
            Log::info('Original signature dimensions: ' . $origWidth . 'x' . $origHeight);
            
            // Create resized image
            $resized = imagecreatetruecolor($width, $height);
            
            // Enable alpha blending
            imagealphablending($resized, true);
            imagesavealpha($resized, true);
            
            // Fill with transparent background
            $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
            imagefill($resized, 0, 0, $transparent);
            
            // Resize the signature
            imagecopyresampled(
                $resized,
                $signatureImg,
                0, 0, 0, 0,
                $width, $height,
                $origWidth, $origHeight
            );
            
            // Copy the signature to the main image at the specified position
            imagecopy(
                $img,
                $resized,
                $x, $y,
                0, 0,
                $width, $height
            );
            
            // NO lines, NO borders drawn at all
            
            // Free memory
            imagedestroy($signatureImg);
            imagedestroy($resized);
            
            Log::info('Signature added to ID card successfully at position: ' . $x . ',' . $y);
            
        } catch (\Exception $e) {
            Log::error('Failed to add signature to card: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
        }
    }
    
    /**
     * Get student photo path
     */
    private function getStudentPhotoPath($student)
    {
        if ($student->photo && $student->photo->status === 'approved' && $student->photo->path) {
            $paths = [
                storage_path('app/public/' . $student->photo->path),
                storage_path('app/public/photos/' . basename($student->photo->path)),
                public_path('photos/' . basename($student->photo->path))
            ];
            
            foreach ($paths as $path) {
                if (file_exists($path)) {
                    return $path;
                }
            }
        }
        
        if ($student->photos) {
            $approvedPhoto = $student->photos->where('status', 'approved')->first();
            if ($approvedPhoto && $approvedPhoto->path) {
                $paths = [
                    storage_path('app/public/' . $approvedPhoto->path),
                    storage_path('app/public/photos/' . basename($approvedPhoto->path)),
                    public_path('photos/' . basename($approvedPhoto->path))
                ];
                
                foreach ($paths as $path) {
                    if (file_exists($path)) {
                        return $path;
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * Add photo to card
     */
    private function addPhotoToCard($img, $photoPath, $x, $y, $width, $height)
    {
        try {
            $photoInfo = getimagesize($photoPath);
            if (!$photoInfo) return;
            
            $photoMime = $photoInfo['mime'];
            
            if ($photoMime == 'image/png') {
                $photoImg = imagecreatefrompng($photoPath);
            } elseif ($photoMime == 'image/webp') {
                $photoImg = imagecreatefromwebp($photoPath);
            } elseif ($photoMime == 'image/jpeg' || $photoMime == 'image/jpg') {
                $photoImg = imagecreatefromjpeg($photoPath);
            } else {
                return;
            }
            
            if (!$photoImg) return;
            
            $photoResized = imagecreatetruecolor($width, $height);
            imagealphablending($photoResized, true);
            imagesavealpha($photoResized, true);
            
            $transparent = imagecolorallocatealpha($photoResized, 0, 0, 0, 127);
            imagefill($photoResized, 0, 0, $transparent);
            
            imagecopyresampled(
                $photoResized, 
                $photoImg, 
                0, 0, 0, 0, 
                $width, $height, 
                imagesx($photoImg), 
                imagesy($photoImg)
            );
            
            $borderColor = imagecolorallocate($img, 255, 215, 0);
            
            imagecopy($img, $photoResized, $x, $y, 0, 0, $width, $height);
            imagerectangle($img, $x, $y, $x + $width, $y + $height, $borderColor);
            
            imagedestroy($photoImg);
            imagedestroy($photoResized);
            
        } catch (\Exception $e) {
            Log::error('Failed to add photo to card: ' . $e->getMessage());
        }
    }
    
    /**
     * Get ID card image for a student
     */
    public function getCardImage($studentId)
    {
        try {
            $student = Student::find($studentId);
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            $basePath = storage_path("app/public/id-cards");
            
            if (!is_dir($basePath)) {
                Log::warning('ID cards directory not found: ' . $basePath);
                mkdir($basePath, 0755, true);
            }

            $patterns = [
                "id_card_{$studentId}_*.png",
                "id_card_{$studentId}_*.jpg", 
                "id_card_{$studentId}_*.jpeg",
                "id_card_{$studentId}.png",
                "id_card_{$studentId}.jpg", 
                "id_card_{$studentId}.jpeg",
            ];

            $filePath = null;
            $latestTime = 0;
            
            foreach ($patterns as $pattern) {
                $files = glob($basePath . '/' . $pattern);
                foreach ($files as $file) {
                    if (file_exists($file)) {
                        $mtime = filemtime($file);
                        if ($mtime > $latestTime) {
                            $latestTime = $mtime;
                            $filePath = $file;
                        }
                    }
                }
            }

            if (!$filePath || !file_exists($filePath)) {
                Log::warning('ID card image not found for student #' . $studentId . ', attempting to generate...');
                
                $template = IdTemplate::where('status', 'active')->first();
                if ($template) {
                    try {
                        $universityName = 'Mzumbe University';
                        $this->generateIdCard($student, $template, $universityName);
                        
                        foreach ($patterns as $pattern) {
                            $files = glob($basePath . '/' . $pattern);
                            foreach ($files as $file) {
                                if (file_exists($file)) {
                                    $mtime = filemtime($file);
                                    if ($mtime > $latestTime) {
                                        $latestTime = $mtime;
                                        $filePath = $file;
                                    }
                                }
                            }
                        }
                        Log::info('ID card generated successfully for student #' . $studentId);
                    } catch (\Exception $e) {
                        Log::error('Failed to generate ID card: ' . $e->getMessage());
                    }
                }
            }
            
            if (!$filePath || !file_exists($filePath)) {
                Log::warning('ID card image not found after generation attempt for student #' . $studentId);
                return response()->json([
                    'success' => false,
                    'message' => 'ID card image not found for student #' . $studentId . '. Please generate the ID card first.'
                ], 404);
            }

            $mimeType = mime_content_type($filePath);
            if (!$mimeType) {
                $extension = pathinfo($filePath, PATHINFO_EXTENSION);
                $mimeTypes = [
                    'png' => 'image/png',
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'gif' => 'image/gif',
                    'webp' => 'image/webp'
                ];
                $mimeType = $mimeTypes[$extension] ?? 'image/png';
            }
            
            $fileSize = filesize($filePath);
            
            Log::info('ID card image served for student #' . $studentId, [
                'file' => basename($filePath),
                'size' => $fileSize
            ]);
            
            return response()->file($filePath, [
                'Content-Type' => $mimeType,
                'Content-Length' => $fileSize,
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
                'Content-Disposition' => 'inline; filename="id_card_' . $studentId . '.png"',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, OPTIONS',
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching ID card image: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ID card image: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // ================= OTHER METHODS =================
    
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden - Admin access required'
                ], 403);
            }
            
            $idCards = IdCard::with(['student.user', 'student.program'])->latest()->get();
            return response()->json([
                'success' => true, 
                'id_cards' => $idCards
            ]);
        } catch (\Exception $e) {
            Log::error('Fetch ID cards error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to fetch ID cards: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function view($id)
    {
        try {
            $idCard = IdCard::with(['student.user', 'student.program'])->findOrFail($id);
            return response()->json([
                'success' => true, 
                'id_card' => $idCard
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'ID card not found'
            ], 404);
        }
    }
    
    public function download($id)
    {
        try {
            $idCard = IdCard::findOrFail($id);
            $basePath = storage_path("app/public/id-cards");
            $patterns = [
                "id_card_{$idCard->student_id}_*.png",
                "id_card_{$idCard->student_id}_*.jpg",
                "id_card_{$idCard->student_id}.png",
                "id_card_{$idCard->student_id}.jpg"
            ];
            
            $filePath = null;
            foreach ($patterns as $pattern) {
                $files = glob($basePath . '/' . $pattern);
                if (!empty($files)) {
                    $filePath = $files[0];
                    break;
                }
            }
            
            if (!$filePath || !file_exists($filePath)) {
                return response()->json([
                    'success' => false, 
                    'message' => 'File not found'
                ], 404);
            }
            return response()->download($filePath, 'id_card_' . $idCard->card_number . '.png');
        } catch (\Exception $e) {
            Log::error('Download error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to download: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function destroy($id)
    {
        try {
            $user = request()->user();
            if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden - Admin access required'
                ], 403);
            }
            
            $idCard = IdCard::findOrFail($id);
            $basePath = storage_path("app/public/id-cards");
            $patterns = [
                "id_card_{$idCard->student_id}_*.png",
                "id_card_{$idCard->student_id}_*.jpg",
                "id_card_{$idCard->student_id}.png",
                "id_card_{$idCard->student_id}.jpg"
            ];
            
            foreach ($patterns as $pattern) {
                $files = glob($basePath . '/' . $pattern);
                foreach ($files as $file) {
                    if (file_exists($file)) {
                        unlink($file);
                    }
                }
            }
            $idCard->delete();
            return response()->json([
                'success' => true, 
                'message' => 'ID card deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to delete: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function myCard(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $student = Student::where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Student profile not found'
                ], 404);
            }
            
            $idCard = IdCard::where('student_id', $student->id)->first();
            if (!$idCard) {
                return response()->json([
                    'success' => false, 
                    'message' => 'No ID card found for this student',
                    'has_card' => false
                ], 404);
            }
            
            $idCard->load(['student.user', 'student.program']);
            
            return response()->json([
                'success' => true, 
                'id_card' => $idCard,
                'has_card' => true
            ]);
        } catch (\Exception $e) {
            Log::error('My card error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to fetch ID card: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function requestIDCard(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $student = Student::with('user')->where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Student not found'
                ], 404);
            }
            
            $existingCard = IdCard::where('student_id', $student->id)->first();
            if ($existingCard) {
                return response()->json([
                    'success' => false, 
                    'message' => 'You already have an ID card'
                ], 409);
            }
            
            $admins = User::whereIn('role', ['admin', 'super_admin'])->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'ID Card Request',
                    'message' => ($student->full_name ?? $student->user->name) . ' requested an ID card',
                    'type' => 'info',
                    'is_read' => 0
                ]);
            }
            
            return response()->json([
                'success' => true, 
                'message' => 'Request sent to admin successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Request ID error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to request ID card: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function bulkGenerate(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden - Admin access required'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'student_ids' => 'required|array',
                'student_ids.*' => 'exists:students,id',
                'template_id' => 'required|exists:id_templates,id',
                'university' => 'sometimes|string'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false, 
                    'message' => $validator->errors()->first()
                ], 422);
            }
            
            $generated = [];
            $failed = [];
            $template = IdTemplate::findOrFail($request->template_id);
            $universityName = $request->university ?? 'Mzumbe University';
            
            foreach ($request->student_ids as $studentId) {
                try {
                    $student = Student::with(['user', 'program'])->find($studentId);
                    if (!$student) {
                        $failed[] = $studentId;
                        continue;
                    }
                    
                    $existingCard = IdCard::where('student_id', $studentId)->first();
                    if ($existingCard) {
                        $failed[] = $studentId;
                        continue;
                    }
                    
                    $cardPath = $this->generateIdCard($student, $template, $universityName);
                    
                    $cardNumber = 'ID-' . str_pad($student->id, 5, '0', STR_PAD_LEFT) . '-' . date('Y');
                    
                    $idCard = IdCard::create([
                        'student_id' => $studentId,
                        'card_number' => $cardNumber,
                        'issue_date' => now()->toDateString(),
                        'expiry_date' => now()->addYears(5)->toDateString(),
                        'status' => 'generated',
                        'generated_by' => $user->id,
                        'authorized_signature' => $this->getAuthorizedSignature(),
                    ]);
                    
                    $generated[] = $idCard;
                    
                    Notification::create([
                        'user_id' => $student->user_id,
                        'title' => 'ID Card Generated',
                        'message' => 'Your ID card has been generated successfully.',
                        'type' => 'success',
                        'is_read' => 0
                    ]);
                    
                } catch (\Exception $e) {
                    $failed[] = $studentId;
                    Log::error('Bulk generate failed for student ' . $studentId . ': ' . $e->getMessage());
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Bulk generation completed',
                'generated_count' => count($generated),
                'failed_count' => count($failed),
                'generated' => $generated,
                'failed' => $failed
            ]);
            
        } catch (\Exception $e) {
            Log::error('Bulk generate error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to bulk generate: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Add signature to ID card
     */
    public function addSignature(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $idCard = IdCard::findOrFail($id);
            $student = Student::find($idCard->student_id);
            
            if (!$student) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Student not found'
                ], 404);
            }
            
            if ($user->id !== $student->user_id) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Forbidden - You can only sign your own ID card'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'signature' => 'required|string'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false, 
                    'message' => $validator->errors()->first()
                ], 422);
            }
            
            Log::info('Signature length: ' . strlen($request->signature));
            
            // Save signature to database
            $idCard->signature = $request->signature;
            $idCard->save();
            
            Log::info('Signature saved successfully for ID card: ' . $id);
            
            // REGENERATE THE ID CARD IMAGE WITH SIGNATURE
            try {
                $template = IdTemplate::where('status', 'active')->first();
                
                if ($template) {
                    $universityName = 'Mzumbe University';
                    $cardPath = $this->generateIdCard($student, $template, $universityName);
                    Log::info('ID card regenerated with signature for student: ' . $student->id);
                } else {
                    Log::warning('No active template found for regenerating ID card');
                    $template = IdTemplate::first();
                    if ($template) {
                        $universityName = 'Mzumbe University';
                        $cardPath = $this->generateIdCard($student, $template, $universityName);
                        Log::info('ID card regenerated with fallback template for student: ' . $student->id);
                    } else {
                        Log::error('No template found at all!');
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to regenerate ID card after signature: ' . $e->getMessage());
            }
            
            return response()->json([
                'success' => true, 
                'message' => 'Signature added successfully and ID card regenerated',
                'signature_length' => strlen($request->signature)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Add signature error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to add signature: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get signature for an ID card
     */
    public function getSignature($id)
    {
        try {
            $user = request()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $idCard = IdCard::with('student')->findOrFail($id);
            $student = $idCard->student;
            
            $isStudent = $user->id === $student->user_id;
            $isAdmin = in_array($user->role, ['admin', 'super_admin']);
            
            if (!$isAdmin && !$isStudent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden - You do not have permission to view this signature'
                ], 403);
            }
            
            return response()->json([
                'success' => true,
                'signature' => $idCard->signature,
                'has_signature' => !is_null($idCard->signature)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get signature error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get signature: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Remove signature from an ID card
     */
    public function removeSignature($id)
    {
        try {
            $user = request()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $idCard = IdCard::with('student')->findOrFail($id);
            $student = $idCard->student;
            
            $isStudent = $user->id === $student->user_id;
            $isAdmin = in_array($user->role, ['admin', 'super_admin']);
            
            if (!$isAdmin && !$isStudent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden - You do not have permission to remove this signature'
                ], 403);
            }
            
            $idCard->signature = null;
            $idCard->save();
            
            // REGENERATE THE ID CARD IMAGE WITHOUT SIGNATURE
            try {
                $template = IdTemplate::where('status', 'active')->first();
                if ($template) {
                    $universityName = 'Mzumbe University';
                    $cardPath = $this->generateIdCard($student, $template, $universityName);
                    Log::info('ID card regenerated without signature for student: ' . $student->id);
                }
            } catch (\Exception $e) {
                Log::error('Failed to regenerate ID card after removing signature: ' . $e->getMessage());
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Signature removed successfully and ID card regenerated'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Remove signature error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove signature: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function verify($qrCode)
    {
        try {
            $idCard = IdCard::where('card_number', $qrCode)->with('student.user')->first();
            if (!$idCard) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Invalid ID card'
                ], 404);
            }
            
            $isValid = $idCard->status === 'generated' && ($idCard->expiry_date > now());
            
            return response()->json([
                'success' => true,
                'verified' => $isValid,
                'id_card' => [
                    'card_number' => $idCard->card_number,
                    'status' => $idCard->status,
                    'issue_date' => $idCard->issue_date,
                    'expiry_date' => $idCard->expiry_date,
                    'student_name' => $idCard->student->full_name ?? $idCard->student->user->name,
                    'reg_number' => $idCard->student->reg_number,
                    'has_signature' => !is_null($idCard->signature),
                    'has_authorized_signature' => !is_null($idCard->authorized_signature)
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Verification error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Verification failed: ' . $e->getMessage()
            ], 500);
        }
    }
}