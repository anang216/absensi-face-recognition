import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import styles from '../../css/dashboard.module.css';


const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Admin - Absensi Face Recognition & NFC', href: '/admin/attendance' },
];

// Types
interface Student {
  id: string;
  nim: string;
  name: string;
  program: string;
  semester: number;
  photo: string;
  nfc_card_id?: string;
  face_descriptor?: Float32Array;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  nim: string;
  timestamp: Date;
  status: 'present' | 'late' | 'absent';
  confidence: number;
  method: 'face_recognition' | 'nfc_card';
  nfcCardId?: string;
}

interface FaceRecognitionState {
  isCameraActive: boolean;
  isLoading: boolean;
  isModelLoaded: boolean;
  isNFCConnected: boolean;
  attendanceStatus: 'idle' | 'detecting' | 'success' | 'error' | 'no_face' | 'nfc_reading' | 'nfc_success' | 'nfc_error';
  errorMessage: string;
  detectedStudent: Student | null;
  attendanceHistory: AttendanceRecord[];
  stats: {
    totalStudents: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    attendanceRate: number;
    faceRecognitionCount: number;
    nfcCardCount: number;
  };
  currentMethod: 'face' | 'nfc';
}

export default function AdminFaceRecognitionAttendance() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  
  const [state, setState] = useState<FaceRecognitionState>({
    isCameraActive: false,
    isLoading: false,
    isModelLoaded: false,
    isNFCConnected: false,
    attendanceStatus: 'idle',
    errorMessage: '',
    detectedStudent: null,
    attendanceHistory: [],
    currentMethod: 'face',
    stats: {
      totalStudents: 0,
      presentToday: 0,
      lateToday: 0,
      absentToday: 0,
      attendanceRate: 0,
      faceRecognitionCount: 0,
      nfcCardCount: 0
    }
  });

  // Load FaceAPI models dari public/models
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
        errorMessage: 'Gagal memuat model AI. Pastikan folder models ada di public/models' 
      }));
    }
  }, []);

  // NFC Reader Functions
  const initializeNFCReader = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Check if Web NFC API is available
      if ('NDEFReader' in window) {
        // Web NFC API (Chrome/Edge)
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        
        console.log('NFC Reader initialized');
        
        ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
          handleNFCCardDetected(serialNumber);
        });
        
        setState(prev => ({ 
          ...prev, 
          isNFCConnected: true, 
          isLoading: false,
          currentMethod: 'nfc'
        }));
        
      } else {
        // Fallback to serial USB NFC reader
        await initializeSerialNFCReader();
      }
    } catch (error) {
      console.error('Error initializing NFC reader:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        errorMessage: 'Tidak dapat mengakses pembaca NFC. Pastikan perangkat terhubung.' 
      }));
    }
  };

  const initializeSerialNFCReader = async () => {
    try {
      // Request serial port access
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      const decoder = new TextDecoder();
      const reader = port.readable.getReader();
      
      setState(prev => ({ 
        ...prev, 
        isNFCConnected: true, 
        isLoading: false,
        currentMethod: 'nfc'
      }));
      
      // Listen for NFC data
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const cardId = decoder.decode(value).trim();
        if (cardId) {
          handleNFCCardDetected(cardId);
        }
      }
      
    } catch (error) {
      console.error('Serial NFC error:', error);
      throw error;
    }
  };

  const handleNFCCardDetected = async (cardId: string) => {
    try {
      setState(prev => ({ ...prev, attendanceStatus: 'nfc_reading', isLoading: true }));
      
      const response = await axios.post('/attendance/nfc-scan', {
        nfc_card_id: cardId
      });
      
      if (response.data.success && response.data.student) {
        setState(prev => ({ 
          ...prev, 
          attendanceStatus: 'nfc_success', 
          detectedStudent: response.data.student,
          isLoading: false 
        }));
        
        await saveAttendanceRecord(response.data.student, 'nfc_card', cardId);
        
        // Auto reset after 3 seconds
        setTimeout(() => {
          resetRecognition();
        }, 3000);
      } else {
        setState(prev => ({ 
          ...prev, 
          attendanceStatus: 'nfc_error',
          errorMessage: response.data.message || 'Kartu NFC tidak dikenali',
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('NFC recognition error:', error);
      setState(prev => ({ 
        ...prev, 
        attendanceStatus: 'nfc_error',
        errorMessage: 'Gagal membaca kartu NFC',
        isLoading: false 
      }));
    }
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      if (!state.isModelLoaded) {
        await loadModels();
      }

      setState(prev => ({ ...prev, isLoading: true, currentMethod: 'face' }));
      
      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const constraints = {
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          deviceId: videoDevices.length > 1 ? { exact: videoDevices[1].deviceId } : undefined
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
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
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
          
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          
          await processFaceRecognition(detections[0].descriptor);
        } else {
          setState(prev => ({ ...prev, attendanceStatus: 'no_face' }));
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 1000);
  };

  // Face recognition logic
  const processFaceRecognition = async (faceDescriptor: Float32Array) => {
    try {
      const response = await axios.post('/attendance/recognize-face', {
        descriptor: Array.from(faceDescriptor)
      });
      
      if (response.data.success && response.data.student) {
        setState(prev => ({ 
          ...prev, 
          attendanceStatus: 'success', 
          detectedStudent: response.data.student,
          isLoading: false 
        }));
        
        await saveAttendanceRecord(response.data.student, 'face_recognition');
        
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
        
        setTimeout(() => {
          resetRecognition();
        }, 5000);
      } else {
        setState(prev => ({ 
          ...prev, 
          attendanceStatus: 'error',
          errorMessage: response.data.message || 'Wajah tidak dikenali' 
        }));
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

  // Save attendance record
  const saveAttendanceRecord = async (student: Student, method: 'face_recognition' | 'nfc_card', nfcCardId?: string) => {
    try {
      const response = await axios.post('/attendance/record', {
        student_id: student.id,
        confidence: 0.95,
        method: method,
        nfc_card_id: nfcCardId
      });
      
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          attendanceHistory: [response.data.record, ...prev.attendanceHistory.slice(0, 9)]
        }));
        
        loadStatistics();
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await axios.get('/attendance/statistics');
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          stats: response.data.statistics
        }));
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Reset recognition
  const resetRecognition = () => {
    setState(prev => ({
      ...prev,
      attendanceStatus: 'idle',
      detectedStudent: null,
      errorMessage: ''
    }));
    
    if (state.isCameraActive && state.currentMethod === 'face') {
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

  // Switch between methods
  const switchToFaceRecognition = () => {
    stopCamera();
    setState(prev => ({ ...prev, currentMethod: 'face' }));
  };

  const switchToNFC = () => {
    stopCamera();
    setState(prev => ({ ...prev, currentMethod: 'nfc' }));
  };

  // Load initial data
  useEffect(() => {
    loadModels();
    loadAttendanceHistory();
    loadStatistics();
  }, []);

  const loadAttendanceHistory = async () => {
    try {
      const response = await axios.get('/attendance/history');
      if (response.data.success) {
        const history = response.data.history.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
        setState(prev => ({ ...prev, attendanceHistory: history }));
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
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
      <Head title="Admin - Absensi Face Recognition & NFC - LPPM Asaindo" />

      {/* Admin Header */}
      <section className={styles.adminHeader}>
        <div className={styles.containerLppm}>
          <div className={styles.adminHeaderContent}>
            <div className={styles.adminBadge}>
              <i className="fas fa-user-shield"></i>
              <span>Admin Panel</span>
            </div>
            <h1 className={styles.adminTitle}>Sistem Absensi Face Recognition & NFC</h1>
            <p className={styles.adminSubtitle}>
              Dashboard admin untuk monitoring dan manajemen absensi dengan teknologi AI dan NFC
            </p>
          </div>
        </div>
      </section>

      {/* Method Selection */}
      <section className={styles.methodSelection}>
        <div className={styles.containerLppm}>
          <div className={styles.methodTabs}>
            <button 
              className={`${styles.methodTab} ${state.currentMethod === 'face' ? styles.active : ''}`}
              onClick={switchToFaceRecognition}
            >
              <i className="fas fa-camera"></i>
              Face Recognition
            </button>
            <button 
              className={`${styles.methodTab} ${state.currentMethod === 'nfc' ? styles.active : ''}`}
              onClick={switchToNFC}
            >
              <i className="fas fa-id-card"></i>
              NFC Card
            </button>
          </div>
        </div>
      </section>

      {/* Main Recognition Section */}
      <section className={styles.recognitionMain}>
        <div className={styles.containerLppm}>
          <div className={styles.recognitionGrid}>
            
            {/* Left Column - Camera/NFC Interface */}
            <div className={styles.interfaceColumn}>
              {state.currentMethod === 'face' ? (
                <div className={styles.cameraInterface}>
                  <div className={styles.interfaceHeader}>
                    <h3>
                      <i className="fas fa-camera"></i>
                      Face Recognition Camera
                    </h3>
                    <div className={styles.deviceStatus}>
                      <span className={`${styles.statusDot} ${state.isCameraActive ? styles.active : styles.inactive}`}></span>
                      {state.isCameraActive ? 'Kamera Aktif' : 'Kamera Nonaktif'}
                    </div>
                  </div>

                  <div className={styles.cameraWrapper}>
                    {!state.isCameraActive ? (
                      <div className={styles.devicePlaceholder}>
                        <i className="fas fa-camera fa-4x"></i>
                        <p>Kamera USB/Device siap diaktifkan</p>
                        <button 
                          onClick={startCamera}
                          disabled={state.isLoading || !state.isModelLoaded}
                          className={styles.btnPrimary}
                        >
                          {state.isLoading ? 'Memulai...' : 'Aktifkan Kamera'}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.cameraActive}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={styles.cameraFeed}
                        />
                        <canvas 
                          ref={canvasRef} 
                          className={styles.detectionCanvas}
                        />
                        
                        <div className={styles.faceOverlay}>
                          <div className={styles.faceFrame}></div>
                          <p>Posisikan wajah dalam frame</p>
                        </div>

                        <div className={styles.detectionStatus}>
                          {state.attendanceStatus === 'detecting' && (
                            <div className={styles.statusDetecting}>
                              <i className="fas fa-search fa-spin"></i>
                              <span>Mendeteksi wajah...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.deviceControls}>
                    {state.isCameraActive && (
                      <>
                        <button onClick={stopCamera} className={styles.btnDanger}>
                          <i className="fas fa-stop"></i>
                          Stop Kamera
                        </button>
                        <button onClick={resetRecognition} className={styles.btnSecondary}>
                          <i className="fas fa-redo"></i>
                          Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.nfcInterface}>
                  <div className={styles.interfaceHeader}>
                    <h3>
                      <i className="fas fa-id-card"></i>
                      NFC Card Reader
                    </h3>
                    <div className={styles.deviceStatus}>
                      <span className={`${styles.statusDot} ${state.isNFCConnected ? styles.active : styles.inactive}`}></span>
                      {state.isNFCConnected ? 'NFC Connected' : 'NFC Disconnected'}
                    </div>
                  </div>

                  <div className={styles.nfcWrapper}>
                    {!state.isNFCConnected ? (
                      <div className={styles.devicePlaceholder}>
                        <i className="fas fa-id-card fa-4x"></i>
                        <p>Pembaca NFC USB siap diaktifkan</p>
                        <button 
                          onClick={initializeNFCReader}
                          disabled={state.isLoading}
                          className={styles.btnPrimary}
                        >
                          {state.isLoading ? 'Menghubungkan...' : 'Hubungkan NFC Reader'}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.nfcActive}>
                        <div className={styles.nfcReaderAnimation}>
                          <div className={styles.nfcWave}></div>
                          <i className="fas fa-id-card"></i>
                          <div className={styles.nfcWave}></div>
                        </div>
                        <p className={styles.nfcInstruction}>Tempelkan kartu NFC ke reader</p>
                        
                        {state.attendanceStatus === 'nfc_reading' && (
                          <div className={`${styles.nfcStatus} ${styles.reading}`}>
                            <i className="fas fa-sync fa-spin"></i>
                            <span>Membaca kartu...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.deviceControls}>
                    <button 
                      onClick={resetRecognition}
                      className={styles.btnSecondary}
                      disabled={state.attendanceStatus === 'nfc_reading'}
                    >
                      <i className="fas fa-redo"></i>
                      Reset NFC Reader
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Recognition Result */}
            <div className={styles.resultColumn}>
              <div className={styles.resultCard}>
                <h3 className={styles.resultTitle}>
                  {state.currentMethod === 'face' ? 'Hasil Face Recognition' : 'Hasil NFC Scan'}
                </h3>
                
                <div className={styles.resultContent}>
                  {state.attendanceStatus === 'idle' && !state.detectedStudent && (
                    <div className={styles.statusIdle}>
                      <i className="fas fa-user-clock"></i>
                      <p>Menunggu {state.currentMethod === 'face' ? 'deteksi wajah' : 'scan kartu NFC'}...</p>
                    </div>
                  )}

                  {(state.attendanceStatus === 'detecting' || state.attendanceStatus === 'nfc_reading') && (
                    <div className={styles.statusProcessing}>
                      <i className="fas fa-spinner fa-spin"></i>
                      <p>
                        {state.currentMethod === 'face' ? 'Menganalisis wajah...' : 'Membaca kartu NFC...'}
                      </p>
                      <div className={styles.loadingBar}>
                        <div className={styles.loadingProgress}></div>
                      </div>
                    </div>
                  )}

                  {(state.attendanceStatus === 'success' || state.attendanceStatus === 'nfc_success') && state.detectedStudent && (
                    <div className={styles.statusSuccess}>
                      <div className={styles.successHeader}>
                        <i className="fas fa-check-circle"></i>
                        <h4>Absensi Berhasil!</h4>
                        <span className={styles.methodBadge}>
                          {state.currentMethod === 'face' ? 'Face Recognition' : 'NFC Card'}
                        </span>
                      </div>
                      <div className={styles.studentInfo}>
                        <div className={styles.studentAvatar}>
                          <img src={state.detectedStudent.photo} alt={state.detectedStudent.name} />
                        </div>
                        <div className={styles.studentDetails}>
                          <p><strong>Nama:</strong> {state.detectedStudent.name}</p>
                          <p><strong>NIM:</strong> {state.detectedStudent.nim}</p>
                          <p><strong>Program:</strong> {state.detectedStudent.program}</p>
                          <p><strong>Semester:</strong> {state.detectedStudent.semester}</p>
                          {state.detectedStudent.nfc_card_id && (
                            <p><strong>NFC Card ID:</strong> {state.detectedStudent.nfc_card_id}</p>
                          )}
                        </div>
                      </div>
                      <div className={styles.attendanceMeta}>
                        <p><strong>Waktu:</strong> {new Date().toLocaleString('id-ID')}</p>
                        <p><strong>Status:</strong> <span className={styles.statusPresent}>Hadir</span></p>
                      </div>
                    </div>
                  )}

                  {(state.attendanceStatus === 'error' || state.attendanceStatus === 'nfc_error') && (
                    <div className={styles.statusError}>
                      <i className="fas fa-exclamation-circle"></i>
                      <h4>Gagal Mengenali</h4>
                      <p>{state.errorMessage}</p>
                      <button className={styles.btnRetry} onClick={resetRecognition}>
                        Coba Lagi
                      </button>
                    </div>
                  )}

                  {state.attendanceStatus === 'no_face' && (
                    <div className={styles.statusWarning}>
                      <i className="fas fa-user-slash"></i>
                      <h4>Wajah Tidak Terdeteksi</h4>
                      <p>Pastikan wajah terlihat jelas dalam frame</p>
                      <button className={styles.btnRetry} onClick={resetRecognition}>
                        Coba Lagi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className={styles.quickStatsCard}>
                <h4>Statistik Cepat</h4>
                <div className={styles.quickStats}>
                  <div className={styles.quickStat}>
                    <span className={styles.statValue}>{state.stats.faceRecognitionCount}</span>
                    <span className={styles.statLabel}>Face Recognition</span>
                  </div>
                  <div className={styles.quickStat}>
                    <span className={styles.statValue}>{state.stats.nfcCardCount}</span>
                    <span className={styles.statLabel}>NFC Card</span>
                  </div>
                  <div className={styles.quickStat}>
                    <span className={styles.statValue}>{state.stats.presentToday}</span>
                    <span className={styles.statLabel}>Hadir Hari Ini</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Statistics */}
      <section className={styles.adminStats}>
        <div className={styles.containerLppm}>
          <h2 className={styles.sectionTitle}>Statistik Admin Real-time</h2>
          
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.admin}`}>
              <div className={`${styles.statIcon} ${styles.bgPurple}`}>
                <i className="fas fa-users"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{state.stats.totalStudents}</h3>
                <p>Total Mahasiswa</p>
                <div className={styles.statTrend}>
                  <i className="fas fa-arrow-up"></i>
                  <span>+5% dari kemarin</span>
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.admin}`}>
              <div className={`${styles.statIcon} ${styles.bgGreen}`}>
                <i className="fas fa-user-check"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{state.stats.presentToday}</h3>
                <p>Hadir Hari Ini</p>
                <span className={styles.statPercentage}>{state.stats.attendanceRate.toFixed(1)}%</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.admin}`}>
              <div className={`${styles.statIcon} ${styles.bgBlue}`}>
                <i className="fas fa-camera"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{state.stats.faceRecognitionCount}</h3>
                <p>Face Recognition</p>
                <span className={styles.statSubtext}>Total penggunaan</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.admin}`}>
              <div className={`${styles.statIcon} ${styles.bgTeal}`}>
                <i className="fas fa-id-card"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{state.stats.nfcCardCount}</h3>
                <p>NFC Card</p>
                <span className={styles.statSubtext}>Total penggunaan</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.admin}`}>
              <div className={`${styles.statIcon} ${styles.bgOrange}`}>
                <i className="fas fa-clock"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{state.stats.lateToday}</h3>
                <p>Terlambat</p>
                <span className={styles.statSubtext}>Hari ini</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.admin}`}>
              <div className={`${styles.statIcon} ${styles.bgRed}`}>
                <i className="fas fa-user-times"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{state.stats.absentToday}</h3>
                <p>Tidak Hadir</p>
                <span className={styles.statSubtext}>Hari ini</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Attendance History */}
      <section className={styles.adminHistory}>
        <div className={styles.containerLppm}>
          <div className={styles.historyHeader}>
            <h2 className={styles.sectionTitle}>Riwayat Absensi Terbaru</h2>
            <div className={styles.historyFilters}>
              <select className={styles.filterSelect}>
                <option value="all">Semua Metode</option>
                <option value="face">Face Recognition</option>
                <option value="nfc">NFC Card</option>
              </select>
              <button className={styles.btnExport}>
                <i className="fas fa-download"></i>
                Export
              </button>
            </div>
          </div>

          <div className={`${styles.attendanceTableWrapper} ${styles.admin}`}>
            <table className={`${styles.attendanceTable} ${styles.admin}`}>
              <thead>
                <tr>
                  <th>Mahasiswa</th>
                  <th>NIM</th>
                  <th>Waktu</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {state.attendanceHistory.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div className={styles.studentCell}>
                        <img src={record.studentId + '.jpg'} 
                             alt={record.studentName} 
                             className={styles.studentThumb} />
                        <div className={styles.studentInfo}>
                          <span className={styles.studentName}>{record.studentName}</span>
                          {record.nfcCardId && (
                            <span className={styles.nfcId}>NFC: {record.nfcCardId}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{record.nim}</td>
                    <td>
                      <div className={styles.timestampCell}>
                        <span className={styles.time}>{record.timestamp.toLocaleTimeString('id-ID')}</span>
                        <span className={styles.date}>{record.timestamp.toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.methodBadge} ${styles[record.method]}`}>
                        <i className={`fas ${record.method === 'face_recognition' ? 'fa-camera' : 'fa-id-card'}`}></i>
                        {record.method === 'face_recognition' ? 'Face' : 'NFC'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[record.status]}`}>
                        {record.status === 'present' ? 'Hadir' : 
                         record.status === 'late' ? 'Terlambat' : 'Tidak Hadir'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.confidenceCell}>
                        <div className={styles.confidenceBar}>
                          <div 
                            className={styles.confidenceFill} 
                            style={{ width: `${record.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span>{(record.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.btnAction} title="Detail">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className={styles.btnAction} title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className={`${styles.btnAction} ${styles.danger}`} title="Hapus">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className={styles.systemStatus}>
        <div className={styles.containerLppm}>
          <h2 className={styles.sectionTitle}>Status Sistem</h2>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                <i className="fas fa-robot"></i>
              </div>
              <div className={styles.statusContent}>
                <h4>AI Face Recognition</h4>
                <p className={state.isModelLoaded ? styles.statusOnline : styles.statusOffline}>
                  {state.isModelLoaded ? 'Model Loaded' : 'Loading Models...'}
                </p>
              </div>
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                <i className="fas fa-camera"></i>
              </div>
              <div className={styles.statusContent}>
                <h4>Kamera USB</h4>
                <p className={state.isCameraActive ? styles.statusOnline : styles.statusOffline}>
                  {state.isCameraActive ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                <i className="fas fa-id-card"></i>
              </div>
              <div className={styles.statusContent}>
                <h4>NFC Reader USB</h4>
                <p className={state.isNFCConnected ? styles.statusOnline : styles.statusOffline}>
                  {state.isNFCConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                <i className="fas fa-database"></i>
              </div>
              <div className={styles.statusContent}>
                <h4>Database</h4>
                <p className={styles.statusOnline}>Connected</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}