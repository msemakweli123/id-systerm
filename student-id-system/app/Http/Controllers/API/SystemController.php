<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SystemSetting;

class SystemController extends Controller
{
    public function index()
    {
        try {
            $settings = SystemSetting::first();

            // CREATE DEFAULT IF EMPTY (VERY IMPORTANT)
            if (!$settings) {
                $settings = SystemSetting::create([
                    'system_name' => 'Job Portal System',
                    'system_email' => null,
                    'system_phone' => null,
                    'default_password' => 'mk123',
                    'force_password_change' => true,
                    'two_factor_auth' => false,
                    'maintenance_mode' => false,
                    'email_notifications' => true,
                    'sms_notifications' => false,
                    'auto_activate_users' => true,
                    'allow_registration' => true,
                    'id_prefix' => '142330',
                    'id_suffix' => '/T.26',
                    'auto_generate_id' => true,
                    'max_upload_size' => 2048,
                    'allowed_file_types' => 'jpg,png,pdf',
                    'enable_logs' => true,
                ]);
            }

            return response()->json([
                'settings' => $settings
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error loading settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $settings = SystemSetting::first();

            if (!$settings) {
                $settings = new SystemSetting();
            }

            $settings->fill($request->all());
            $settings->save();

            return response()->json([
                'message' => 'Settings updated successfully',
                'settings' => $settings
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error saving settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}