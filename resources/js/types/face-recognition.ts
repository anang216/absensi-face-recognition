// types/face-recognition.ts
export interface Student {
  id: string;
  nim: string;
  name: string;
  program: string;
  semester: number;
  faceDescriptor?: Float32Array;
  photo: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  nim: string;
  timestamp: Date;
  status: 'present' | 'late' | 'absent';
  confidence: number;
  image?: string;
}

export interface FaceRecognitionState {
  isCameraActive: boolean;
  isLoading: boolean;
  isModelLoaded: boolean;
  attendanceStatus: 'idle' | 'detecting' | 'success' | 'error' | 'no_face';
  errorMessage: string;
  detectedStudent: Student | null;
  attendanceHistory: AttendanceRecord[];
  stats: AttendanceStats;
}

export interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  attendanceRate: number;
}
