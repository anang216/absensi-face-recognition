import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import * as faceapi from 'face-api.js';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Absensi Face Recognition', href: '/attendance/face-recognition' },
];

// Mock data - dalam real implementation, ini dari API
const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    nim: '2022071001',
    name: 'Ahmad Rizki',
    program: 'Teknik Informatika',
    semester: 6,
    photo: '/images/students/student1.jpg'
  },
  {
    id: '2', 
    nim: '2022071002',
    name: 'Sarah Wijaya',
    program: 'Sistem Informasi',
    semester: 5,
    photo: '/images/students/student2.jpg'
  }
];

export default function FaceRecognitionAttendance() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  
  const [state, setState] = useState<FaceRecognitionState>({
    isCameraActive: false,
    isLoading: false,
    isModelLoaded: false,
    attendanceStatus: 'idle',
    errorMessage: '',
    detectedStudent: null,
    attendanceHistory: [],
    stats: {
      totalStudents: 0,
      presentToday: 0,
      lateToday: 0,
      absentToday: 0,
      attendanceRate: 0
    }
  });

  // Load FaceAPI models
  const loadModels = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      setState(prev => ({ ...prev, isModelLoaded: true, isLoading: false }));
      console.log('FaceAPI models loaded successfully');
    } catch (error) {
      console.error('Error loading models:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        errorMessage: 'Gagal memuat model AI' 
      }));
    }
  }, []);

  // Initialize camera
  const startCamera = async () => {
    try {
      if (!state.isModelLoaded) {
        await loadModels();
      }

      setState(prev => ({ ...prev, isLoading: true }));
      
      const constraints = {
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        setState(prev => ({ 
          ...prev, 
          isCameraActive: true, 
          isLoading: false 
        }));
        
        // Start face detection
        startFaceDetection();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        errorMessage: 'Tidak dapat mengakses kamera. Pastikan izin diberikan.' 
      }));
    }
  };

  // Face detection logic
  const startFaceDetection = () => {
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || state.attendanceStatus === 'success') {
        return;
      }

      try {
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptors()
          .withFaceExpressions();

        const canvas = canvasRef.current;
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        };
        
        faceapi.matchDimensions(canvas, displaySize);
        
        if (detections.length > 0) {
          setState(prev => ({ ...prev, attendanceStatus: 'detecting' }));
          
          // Draw detections
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          
          // Process face recognition
          await processFaceRecognition(detections[0].descriptor);
        } else {
          setState(prev => ({ ...prev, attendanceStatus: 'no_face' }));
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 1000); // Check every second
  };

  // Face recognition logic
  const processFaceRecognition = async (faceDescriptor: Float32Array) => {
    try {
      // In real implementation, compare with stored face descriptors from database
      const matchedStudent = await recognizeFace(faceDescriptor);
      
      if (matchedStudent) {
        setState(prev => ({ 
          ...prev, 
          attendanceStatus: 'success', 
          detectedStudent: matchedStudent,
          isLoading: false 
        }));
        
        // Save attendance record
        await saveAttendanceRecord(matchedStudent);
        
        // Stop detection after success
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
        
        // Auto reset after 5 seconds
        setTimeout(() => {
          resetRecognition();
        }, 5000);
      }
    } catch (error) {
      console.error('Face recognition error:', error);
      setState(prev => ({ 
        ...prev, 
        attendanceStatus: 'error',
        errorMessage: 'Gagal mengenali wajah' 
      }));
    }
  };

  // Face recognition matching (simplified - replace with real matching logic)
  const recognizeFace = async (descriptor: Float32Array): Promise<Student | null> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock recognition - in real app, compare with database descriptors
    const randomStudent = MOCK_STUDENTS[Math.floor(Math.random() * MOCK_STUDENTS.length)];
    
    // Simulate confidence score
    const confidence = Math.random() * 0.3 + 0.7; // 0.7 - 1.0
    
    if (confidence > 0.8) {
      return randomStudent;
    }
    
    return null;
  };

  // Save attendance record
  const saveAttendanceRecord = async (student: Student) => {
    try {
      const record: AttendanceRecord = {
        id: Date.now().toString(),
        studentId: student.id,
        studentName: student.name,
        nim: student.nim,
        timestamp: new Date(),
        status: new Date().getHours() > 8 ? 'late' : 'present',
        confidence: 0.95
      };
      
      // Simulate API call
      await axios.post('/api/attendance', record);
      
      // Update local state
      setState(prev => ({
        ...prev,
        attendanceHistory: [record, ...prev.attendanceHistory.slice(0, 9)]
      }));
      
      updateStatistics();
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  // Update statistics
  const updateStatistics = () => {
    setState(prev => ({
      ...prev,
      stats: {
        totalStudents: MOCK_STUDENTS.length,
        presentToday: prev.stats.presentToday + 1,
        lateToday: new Date().getHours() > 8 ? prev.stats.lateToday + 1 : prev.stats.lateToday,
        absentToday: 0,
        attendanceRate: ((prev.stats.presentToday + 1) / MOCK_STUDENTS.length) * 100
      }
    }));
  };

  // Reset recognition
  const resetRecognition = () => {
    setState(prev => ({
      ...prev,
      attendanceStatus: 'idle',
      detectedStudent: null,
      errorMessage: ''
    }));
    
    if (state.isCameraActive) {
      startFaceDetection();
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (canvasRef.current) {
      canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    setState(prev => ({
      ...prev,
      isCameraActive: false,
      attendanceStatus: 'idle',
      detectedStudent: null
    }));
  };

  // Manual capture for testing
  const manualCapture = async () => {
    if (!videoRef.current) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      if (detections.length > 0) {
        await processFaceRecognition(detections[0].descriptor);
      } else {
        setState(prev => ({ 
          ...prev, 
          attendanceStatus: 'no_face',
          errorMessage: 'Tidak terdeteksi wajah' 
        }));
      }
    } catch (error) {
      console.error('Manual capture error:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Load initial data
  useEffect(() => {
    loadModels();
    loadAttendanceHistory();
  }, []);

  const loadAttendanceHistory = async () => {
    // Simulate API call
    const mockHistory: AttendanceRecord[] = [
      {
        id: '1',
        studentId: '1',
        studentName: 'Ahmad Rizki',
        nim: '2022071001',
        timestamp: new Date('2024-01-16T08:15:00'),
        status: 'present',
        confidence: 0.92
      }
    ];
    
    setState(prev => ({ ...prev, attendanceHistory: mockHistory }));
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      stopCamera();
    };
  }, []);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Absensi Face Recognition - LPPM Asaindo" />

      {/* Hero Section */}
      <section className="hero-attendance">
        <div className="hero-overlay"></div>
        <div className="hero-container-attendance">
          <div className="hero-text-content">
            <h1 className="welcome-attendance-title">Absensi Face Recognition</h1>
            <p className="hero-tagline">
              Sistem absensi modern dengan teknologi AI untuk akurasi dan keamanan maksimal.
            </p>
            <div className="tech-badges">
              <span className="tech-badge">TensorFlow.js</span>
              <span className="tech-badge">Face-api.js</span>
              <span className="tech-badge">Real-time AI</span>
            </div>
          </div>
          <div className="hero-image-attendance"></div>
        </div>
      </section>

      {/* Face Recognition Section */}
      <section className="face-recognition-section">
        <div className="container-lppm">
          <div className="recognition-header">
            <div className="header-icon">
              <i className="fas fa-robot"></i>
            </div>
            <h2 className="section-title">Sistem Absensi AI</h2>
            <p className="section-subtitle">
              Teknologi pengenalan wajah dengan akurasi tinggi untuk proses absensi yang cepat dan aman.
            </p>
            
            <div className="model-status">
              <span className={`status-badge ${state.isModelLoaded ? 'loaded' : 'loading'}`}>
                <i className={`fas ${state.isModelLoaded ? 'fa-check-circle' : 'fa-spinner fa-spin'}`}></i>
                {state.isModelLoaded ? 'Model AI Loaded' : 'Loading AI Models...'}
              </span>
            </div>
          </div>

          <div className="recognition-container">
            <div className="camera-section">
              <div className="camera-wrapper">
                {!state.isCameraActive ? (
                  <div className="camera-placeholder">
                    <i className="fas fa-camera fa-4x"></i>
                    <p>Kamera siap diaktifkan</p>
                    <button 
                      onClick={startCamera}
                      disabled={state.isLoading || !state.isModelLoaded}
                      className="btn-start-camera"
                    >
                      {state.isLoading ? 'Memulai...' : 'Aktifkan Kamera'}
                    </button>
                  </div>
                ) : (
                  <div className="camera-active">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-feed"
                    />
                    <canvas 
                      ref={canvasRef} 
                      className="detection-canvas"
                    />
                    
                    <div className="face-overlay">
                      <div className="face-frame"></div>
                      <p>Posisikan wajah dalam frame</p>
                    </div>

                    {/* Detection Status */}
                    <div className="detection-status">
                      {state.attendanceStatus === 'detecting' && (
                        <div className="status-detecting">
                          <i className="fas fa-search fa-spin"></i>
                          <span>Mendeteksi wajah...</span>
                        </div>
                      )}
                      {state.attendanceStatus === 'no_face' && (
                        <div className="status-no-face">
                          <i className="fas fa-user-slash"></i>
                          <span>Tidak terdeteksi wajah</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="camera-controls">
                {state.isCameraActive && (
                  <>
                    <button 
                      onClick={manualCapture}
                      disabled={state.isLoading}
                      className="btn-capture"
                    >
                      <i className="fas fa-camera"></i>
                      Capture Manual
                    </button>
                    <button 
                      onClick={resetRecognition}
                      className="btn-reset"
                    >
                      <i className="fas fa-redo"></i>
                      Reset
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="btn-stop-camera"
                    >
                      <i className="fas fa-stop"></i>
                      Stop Kamera
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="attendance-info">
              {/* Recognition Result */}
              <div className="info-card">
                <h3>Hasil Pengenalan</h3>
                
                {state.attendanceStatus === 'idle' && !state.detectedStudent && (
                  <div className="status-idle">
                    <i className="fas fa-user-clock"></i>
                    <p>Menunggu deteksi wajah...</p>
                  </div>
                )}

                {state.attendanceStatus === 'detecting' && (
                  <div className="status-detecting">
                    <i className="fas fa-search fa-spin"></i>
                    <p>Menganalisis wajah...</p>
                    <div className="loading-bar">
                      <div className="loading-progress"></div>
                    </div>
                  </div>
                )}

                {state.attendanceStatus === 'success' && state.detectedStudent && (
                  <div className="status-success">
                    <div className="success-header">
                      <i className="fas fa-check-circle"></i>
                      <h4>Absensi Berhasil!</h4>
                    </div>
                    <div className="student-info">
                      <div className="student-avatar">
                        <img src={state.detectedStudent.photo} alt={state.detectedStudent.name} />
                      </div>
                      <div className="student-details">
                        <p><strong>Nama:</strong> {state.detectedStudent.name}</p>
                        <p><strong>NIM:</strong> {state.detectedStudent.nim}</p>
                        <p><strong>Program:</strong> {state.detectedStudent.program}</p>
                        <p><strong>Semester:</strong> {state.detectedStudent.semester}</p>
                      </div>
                    </div>
                    <div className="attendance-meta">
                      <p><strong>Waktu:</strong> {new Date().toLocaleString('id-ID')}</p>
                      <p><strong>Status:</strong> <span className="status-present">Hadir</span></p>
                    </div>
                  </div>
                )}

                {state.attendanceStatus === 'error' && (
                  <div className="status-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <h4>Gagal Mengenali</h4>
                    <p>{state.errorMessage || 'Terjadi kesalahan dalam pengenalan wajah'}</p>
                    <button className="btn-retry" onClick={resetRecognition}>
                      Coba Lagi
                    </button>
                  </div>
                )}

                {state.attendanceStatus === 'no_face' && (
                  <div className="status-no-face">
                    <i className="fas fa-user-slash"></i>
                    <h4>Wajah Tidak Terdeteksi</h4>
                    <p>Pastikan wajah terlihat jelas dalam frame</p>
                    <button className="btn-retry" onClick={resetRecognition}>
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="instructions-card">
                <h3>Petunjuk Penggunaan</h3>
                <ul className="instructions-list">
                  <li>
                    <i className="fas fa-lightbulb"></i>
                    <div>
                      <strong>Pencahayaan cukup</strong>
                      <span>Hindari bayangan pada wajah</span>
                    </div>
                  </li>
                  <li>
                    <i className="fas fa-user"></i>
                    <div>
                      <strong>Posisi wajah lurus</strong>
                      <span>Hadap langsung ke kamera</span>
                    </div>
                  </li>
                  <li>
                    <i className="fas fa-glasses"></i>
                    <div>
                      <strong>Hindari aksesoris</strong>
                      <span>Lepaskan kacamata gelap/topi</span>
                    </div>
                  </li>
                  <li>
                    <i className="fas fa-expand"></i>
                    <div>
                      <strong>Jarak optimal</strong>
                      <span>50-100 cm dari kamera</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Statistics */}
      <section className="attendance-stats">
        <div className="container-lppm">
          <h2 className="section-title">Statistik Real-time</h2>
          
          <div className="stats-cards-wrapper">
            <div className="stat-card">
              <div className="stat-icon bg-blue">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>{state.stats.totalStudents}</h3>
                <p>Total Mahasiswa</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-green">
                <i className="fas fa-user-check"></i>
              </div>
              <div className="stat-content">
                <h3>{state.stats.presentToday}</h3>
                <p>Hadir Hari Ini</p>
                <span className="stat-percentage">{state.stats.attendanceRate.toFixed(1)}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-orange">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <h3>{state.stats.lateToday}</h3>
                <p>Terlambat</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-red">
                <i className="fas fa-user-times"></i>
              </div>
              <div className="stat-content">
                <h3>{state.stats.absentToday}</h3>
                <p>Tidak Hadir</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Attendance History */}
      <section className="attendance-history">
        <div className="container-lppm">
          <h2 className="section-title">Riwayat Absensi Terbaru</h2>

          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Nama Mahasiswa</th>
                  <th>NIM</th>
                  <th>Waktu Absensi</th>
                  <th>Status</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {state.attendanceHistory.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div className="student-cell">
                        <img src={MOCK_STUDENTS.find(s => s.id === record.studentId)?.photo || ''} 
                             alt={record.studentName} 
                             className="student-thumb" />
                        {record.studentName}
                      </div>
                    </td>
                    <td>{record.nim}</td>
                    <td>{record.timestamp.toLocaleString('id-ID')}</td>
                    <td>
                      <span className={`status-${record.status}`}>
                        {record.status === 'present' ? 'Hadir' : 
                         record.status === 'late' ? 'Terlambat' : 'Tidak Hadir'}
                      </span>
                    </td>
                    <td>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill" 
                          style={{ width: `${record.confidence * 100}%` }}
                        ></div>
                        <span>{(record.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
