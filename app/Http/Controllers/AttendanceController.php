<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AttendanceController extends Controller
{
    public function faceRecognition()
    {
        return inertia('Attendance/FaceRecognition');
    }

    public function recognizeFace(Request $request)
    {
        try {
            $descriptor = $request->input('descriptor');
            
            if (!$descriptor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Face descriptor tidak ditemukan'
                ]);
            }

            // Konversi array ke Float32Array equivalent
            $inputDescriptor = $descriptor;

            // Ambil semua siswa dengan face descriptor
            $students = Student::whereNotNull('face_descriptor')->get();
            
            $bestMatch = null;
            $bestDistance = PHP_FLOAT_MAX;
            $threshold = 0.6; // Threshold untuk matching

            foreach ($students as $student) {
                $storedDescriptor = json_decode($student->face_descriptor, true);
                
                if ($storedDescriptor) {
                    $distance = $this->computeDistance($inputDescriptor, $storedDescriptor);
                    
                    if ($distance < $bestDistance && $distance < $threshold) {
                        $bestDistance = $distance;
                        $bestMatch = $student;
                    }
                }
            }

            if ($bestMatch) {
                return response()->json([
                    'success' => true,
                    'student' => [
                        'id' => $bestMatch->id,
                        'nim' => $bestMatch->nim,
                        'name' => $bestMatch->name,
                        'program' => $bestMatch->program,
                        'semester' => $bestMatch->semester,
                        'photo' => $bestMatch->photo ? Storage::url($bestMatch->photo) : '/images/default-avatar.png'
                    ],
                    'confidence' => 1 - $bestDistance,
                    'message' => 'Wajah dikenali'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Wajah tidak dikenali dalam database'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error dalam pengenalan wajah: ' . $e->getMessage()
            ]);
        }
    }

    public function recordAttendance(Request $request)
    {
        try {
            $studentId = $request->input('student_id');
            $confidence = $request->input('confidence', 0);
            
            $student = Student::find($studentId);
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Siswa tidak ditemukan'
                ]);
            }

            // Tentukan status berdasarkan waktu
            $currentTime = now();
            $status = 'present';
            
            if ($currentTime->hour > 8 || ($currentTime->hour == 8 && $currentTime->minute > 15)) {
                $status = 'late';
            }

            // Cek apakah sudah absen hari ini
            $existingAttendance = Attendance::where('student_id', $studentId)
                ->whereDate('attendance_time', $currentTime->toDateString())
                ->first();

            if ($existingAttendance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sudah melakukan absensi hari ini'
                ]);
            }

            $attendance = Attendance::create([
                'student_id' => $studentId,
                'attendance_time' => $currentTime,
                'status' => $status,
                'confidence' => $confidence,
                'method' => 'face_recognition'
            ]);

            return response()->json([
                'success' => true,
                'record' => [
                    'id' => $attendance->id,
                    'studentId' => $student->id,
                    'studentName' => $student->name,
                    'nim' => $student->nim,
                    'timestamp' => $attendance->attendance_time,
                    'status' => $attendance->status,
                    'confidence' => $attendance->confidence
                ],
                'message' => 'Absensi berhasil dicatat'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error mencatat absensi: ' . $e->getMessage()
            ]);
        }
    }

    public function getHistory()
    {
        try {
            $attendance = Attendance::with('student')
                ->orderBy('attendance_time', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'studentId' => $record->student_id,
                        'studentName' => $record->student->name,
                        'nim' => $record->student->nim,
                        'timestamp' => $record->attendance_time,
                        'status' => $record->status,
                        'confidence' => $record->confidence
                    ];
                });

            return response()->json([
                'success' => true,
                'history' => $attendance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error mengambil riwayat: ' . $e->getMessage()
            ]);
        }
    }

    public function getStatistics()
    {
        try {
            $today = now()->toDateString();
            
            $totalStudents = Student::count();
            $presentToday = Attendance::whereDate('attendance_time', $today)
                ->whereIn('status', ['present', 'late'])
                ->count();
            $lateToday = Attendance::whereDate('attendance_time', $today)
                ->where('status', 'late')
                ->count();
            $absentToday = $totalStudents - $presentToday;
            $attendanceRate = $totalStudents > 0 ? ($presentToday / $totalStudents) * 100 : 0;

            return response()->json([
                'success' => true,
                'statistics' => [
                    'totalStudents' => $totalStudents,
                    'presentToday' => $presentToday,
                    'lateToday' => $lateToday,
                    'absentToday' => $absentToday,
                    'attendanceRate' => $attendanceRate
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error mengambil statistik: ' . $e->getMessage()
            ]);
        }
    }

    public function registerFace(Request $request)
    {
        try {
            $studentId = $request->input('student_id');
            $descriptor = $request->input('descriptor');
            
            $student = Student::find($studentId);
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Siswa tidak ditemukan'
                ]);
            }

            $student->face_descriptor = json_encode($descriptor);
            $student->save();

            return response()->json([
                'success' => true,
                'message' => 'Face descriptor berhasil disimpan'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error menyimpan face descriptor: ' . $e->getMessage()
            ]);
        }
    }

    private function computeDistance(array $desc1, array $desc2)
    {
        // Euclidean distance calculation
        $sum = 0;
        $count = min(count($desc1), count($desc2));
        
        for ($i = 0; $i < $count; $i++) {
            $diff = $desc1[$i] - $desc2[$i];
            $sum += $diff * $diff;
        }
        
        return sqrt($sum);
    }
}