import { useState, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '../constants/api';

interface STTUtterance {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface UseSTTReturn {
  isRecording: boolean;
  isProcessing: boolean;
  utterances: STTUtterance[];
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useSTT = (): UseSTTReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [utterances, setUtterances] = useState<STTUtterance[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // WAV 형식 지원 확인
      const mimeTypes = [
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/webm;codecs=pcm',
        'audio/webm;codecs=opus'  // fallback
      ];
      
      let selectedMimeType = 'audio/webm;codecs=opus';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      console.log('선택된 MIME 타입:', selectedMimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const text = await transcribeAudio(audioBlob);
          setUtterances(text);
        } catch (err) {
          setError('음성을 텍스트로 변환하는 중 오류가 발생했습니다.');
          console.error('STT Error:', err);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('마이크 접근 권한이 필요합니다.');
      console.error('Recording Error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setUtterances([]);
    setError(null);
  }, []);

  // WebM을 WAV로 변환하는 함수
  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // WAV 파일 생성
          const wavBlob = audioBufferToWav(audioBuffer);
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(webmBlob);
    });
  };

  // AudioBuffer를 WAV Blob으로 변환하는 함수
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV 헤더 작성
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // 오디오 데이터 작성
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<STTUtterance[]> => {
    try {
      // WebM을 WAV로 변환
      let wavBlob: Blob;
      if (audioBlob.type.includes('webm')) {
        console.log('WebM을 WAV로 변환 중...');
        wavBlob = await convertWebmToWav(audioBlob);
        console.log('WAV 변환 완료');
      } else {
        wavBlob = audioBlob;
      }
      
      // FormData 생성
      const formData = new FormData();
      formData.append('file', wavBlob, 'recording.wav');
      
      // 백엔드 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${API_ENDPOINTS.STT}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '음성 인식에 실패했습니다.');
      }
      
      const result = await response.json();
      
      if (result.utterances && Array.isArray(result.utterances)) {
        return result.utterances;
      }
      
      // text 필드만 있는 경우, 단일 utterance로 변환
      if (result.text) {
        return [{ speaker: "SYSTEM", start: 0, end: 0, text: result.text }];
      }
      
      return [];
      
    } catch (error) {
      console.error('STT API 호출 오류:', error);
      throw error;
    }
  };

  return {
    isRecording,
    isProcessing,
    utterances,
    startRecording,
    stopRecording,
    resetTranscript,
    error
  };
};
