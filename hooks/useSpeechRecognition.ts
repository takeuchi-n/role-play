import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    onResult,
    onFinalResult,
    onError,
    continuous = false,
    language = 'ja-JP',
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        // Call onResult for interim results (real-time display)
        if (onResult) {
          onResult(currentTranscript);
        }

        // Call onFinalResult only when speech is final
        if (finalTranscript && onFinalResult) {
          onFinalResult(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.log('Speech recognition error event:', event.error);

        // In continuous mode, ignore no-speech errors and keep listening
        if (continuous && event.error === 'no-speech') {
          console.log('No speech detected in continuous mode, will auto-restart');
          return;
        }

        // Ignore abort errors (user stopped manually)
        if (event.error === 'aborted') {
          setIsListening(false);
          return;
        }

        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        if (onError) {
          const errorMessages: { [key: string]: string } = {
            'not-allowed': 'マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。',
            'audio-capture': 'マイクが使用できません。他のアプリケーションがマイクを使用中か、マイクが接続されていない可能性があります。',
            'network': 'ネットワークエラーが発生しました',
            'service-not-allowed': '音声認識サービスが利用できません',
          };
          onError(errorMessages[event.error] || event.error);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, language, onResult, onError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
