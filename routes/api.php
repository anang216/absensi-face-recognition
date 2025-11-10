// routes/api.php
Route::post('/attendance', [AttendanceController::class, 'store']);
Route::get('/attendance/history', [AttendanceController::class, 'history']);
Route::post('/students/register-face', [StudentController::class, 'registerFace']);

// app/Http/Controllers/AttendanceController.php
public function store(Request $request)
{
    $validated = $request->validate([
        'student_id' => 'required|exists:students,id',
        'timestamp' => 'required|date',
        'confidence' => 'required|numeric',
        'image' => 'sometimes|string'
    ]);

    $attendance = Attendance::create($validated);

    return response()->json([
        'success' => true,
        'data' => $attendance
    ]);
}
