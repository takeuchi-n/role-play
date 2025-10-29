'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { Message, ChatSettings } from '@/lib/types';
import ChatMessage from '@/components/ChatMessage';
import SettingsSheet from '@/components/SettingsSheet';

const SETTINGS_KEY = 'insurance-roleplay-settings';
const VOICE_SETTINGS_KEY = 'insurance-roleplay-voice-settings';

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VoiceSettings {
  autoSpeak: boolean;
  speechRate: number;
  pitch: number;
  handsFree: boolean;
}

export default function ChatPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    age: 38,
    gender: 'female',
    maritalStatus: 'married',
  });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    autoSpeak: true,
    speechRate: 1.1,
    pitch: 1.0,
    handsFree: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');

  // Speech Recognition
  const {
    isListening,
    transcript,
    isSupported: isRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: voiceSettings.handsFree,
    onResult: (text) => {
      console.log('Speech recognition interim result:', text);
      setInputText(text);
      if (!voiceSettings.handsFree) {
        stopListening();
      }
    },
    onFinalResult: (text) => {
      console.log('Speech recognition final result:', text);
      if (voiceSettings.handsFree && text.trim()) {
        // Auto-send in hands-free mode with direct text
        console.log('Hands-free: Sending message:', text);
        setInputText(text);
        // Pass the text directly to avoid state timing issues
        handleSend(text);
      }
    },
    onError: (err) => {
      console.error('Speech recognition error:', err);
      if (err !== 'aborted' && err !== 'no-speech') {
        setError('音声認識エラーが発生しました');
      }
    },
  });

  // Speech Synthesis
  const { speak, cancel: cancelSpeech, isSpeaking, isSupported: isSynthesisSupported } = useSpeechSynthesis({
    rate: voiceSettings.speechRate,
    pitch: voiceSettings.pitch,
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }

    const savedVoiceSettings = localStorage.getItem(VOICE_SETTINGS_KEY);
    if (savedVoiceSettings) {
      try {
        setVoiceSettings(JSON.parse(savedVoiceSettings));
      } catch (e) {
        console.error('Failed to load voice settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  // Load conversations when authenticated
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-speak assistant messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === 'assistant' &&
      lastMessage.content !== lastMessageRef.current &&
      voiceSettings.autoSpeak &&
      !isLoading
    ) {
      lastMessageRef.current = lastMessage.content;
      speak(lastMessage.content);
    }
  }, [messages, voiceSettings.autoSpeak, speak, isLoading]);

  // Update transcript to input
  useEffect(() => {
    if (transcript && isListening) {
      setInputText(transcript);
    }
  }, [transcript, isListening]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();

      if (data.success) {
        const msgs: Message[] = data.conversation.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt).getTime(),
        }));
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新しい会話' }),
      });

      const data = await response.json();

      if (data.success) {
        setConversations([data.conversation, ...conversations]);
        setCurrentConversationId(data.conversation.id);
      }
    } catch (err) {
      setError('会話の作成に失敗しました');
    }
  };

  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || inputText;
    if (!messageText.trim() || isLoading) return;

    // Stop any ongoing speech
    cancelSpeech();

    // Create new conversation if none exists
    if (!currentConversationId) {
      await handleNewConversation();
      // Wait for the conversation to be created
      setTimeout(() => handleSendMessage(messageText), 100);
      return;
    }

    await handleSendMessage(messageText);
  };

  const handleSendMessage = async (messageText?: string) => {
    if (!currentConversationId) return;

    const textToSend = messageText || inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    resetTranscript();
    setError(null);
    setWarning(null);
    setIsLoading(true);

    try {
      // Save user message
      await fetch(`/api/conversations/${currentConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: userMessage.content,
        }),
      });

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'リクエストに失敗しました');
      }

      if (data.warning) {
        setWarning(data.warning);
      } else if (data.message) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
        };

        // Save assistant message
        await fetch(`/api/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: assistantMessage.content,
          }),
        });

        setMessages([...newMessages, assistantMessage]);
        await loadConversations(); // Refresh conversation list
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('この会話を削除しますか？')) return;

    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      setConversations(conversations.filter((c) => c.id !== conversationId));

      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
    } catch (err) {
      setError('会話の削除に失敗しました');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enterキーでの送信は無効化（送信ボタンのみで送信）
  };

  const handleSettingsChange = (newSettings: ChatSettings) => {
    setSettings(newSettings);
    setShowSettings(false);
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleAutoSpeak = () => {
    setVoiceSettings((prev) => ({ ...prev, autoSpeak: !prev.autoSpeak }));
    if (!voiceSettings.autoSpeak) {
      cancelSpeech();
    }
  };

  const handleSpeechRateChange = (rate: number) => {
    setVoiceSettings((prev) => ({ ...prev, speechRate: rate }));
  };

  const handlePitchChange = (pitch: number) => {
    setVoiceSettings((prev) => ({ ...prev, pitch }));
  };

  const toggleHandsFree = () => {
    const newHandsFree = !voiceSettings.handsFree;
    setVoiceSettings((prev) => ({ ...prev, handsFree: newHandsFree }));

    if (newHandsFree) {
      console.log('Hands-free enabled, starting listening...');
      // Start listening when hands-free is enabled
      setTimeout(() => {
        startListening();
      }, 500);
    } else {
      console.log('Hands-free disabled, stopping listening...');
      // Stop listening when hands-free is disabled
      stopListening();
      resetTranscript();
      setInputText('');
    }
  };

  // Auto-restart listening after sending in hands-free mode
  useEffect(() => {
    if (voiceSettings.handsFree && !isListening && !isLoading && !isSpeaking) {
      console.log('Auto-restarting speech recognition...');
      const timer = setTimeout(() => {
        startListening();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [voiceSettings.handsFree, isListening, isLoading, isSpeaking, startListening]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleNewConversation}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              新しい会話
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setCurrentConversationId(conv.id)}
                className={`p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 ${
                  currentConversationId === conv.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.title}</p>
                    <p className="text-xs text-gray-500">{conv.messageCount} messages</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="text-gray-400 hover:text-red-600 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">{user?.email}</div>
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ログアウト
            </button>
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-600 hover:text-gray-800"
            >
              ☰
            </button>
            <h1 className="text-xl font-bold text-gray-800">保険ロープレ（断る人 練習用）</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Demo Link */}
            <a
              href="/demo"
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
              title="営業トーク参考デモ"
            >
              📚 営業参考
            </a>
            {/* Voice Settings Button */}
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                voiceSettings.handsFree
                  ? 'bg-green-100 text-green-700'
                  : voiceSettings.autoSpeak
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
              title="音声設定"
            >
              {voiceSettings.handsFree ? '🎙️ ハンズフリー' : voiceSettings.autoSpeak ? '🔊 ON' : '🔊 OFF'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-600 hover:text-gray-800 text-2xl"
              aria-label="設定"
            >
              ⚙️
            </button>
          </div>
        </header>

        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  🎙️ ハンズフリーモード
                  <span className="block text-xs text-gray-500 mt-1">話し始めると自動で送信</span>
                </label>
                <button
                  onClick={toggleHandsFree}
                  className={`px-4 py-1 rounded-lg text-sm font-medium ${
                    voiceSettings.handsFree
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {voiceSettings.handsFree ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">自動読み上げ</label>
                <button
                  onClick={toggleAutoSpeak}
                  className={`px-4 py-1 rounded-lg text-sm font-medium ${
                    voiceSettings.autoSpeak
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {voiceSettings.autoSpeak ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 min-w-20">読み上げ速度</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceSettings.speechRate}
                  onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 min-w-10">{voiceSettings.speechRate.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 min-w-20">声の高さ</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 min-w-10">{voiceSettings.pitch.toFixed(1)}</span>
              </div>
              {!isRecognitionSupported && (
                <p className="text-xs text-orange-600">
                  ⚠️ このブラウザは音声認識に対応していません
                </p>
              )}
              {!isSynthesisSupported && (
                <p className="text-xs text-orange-600">
                  ⚠️ このブラウザは音声合成に対応していません
                </p>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-12">
                <p>営業トークを入力してロープレを開始してください。</p>
                <p className="text-sm mt-2">相手は金融リテラシーが高く、費用対効果を重視します。</p>
                {isRecognitionSupported && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-blue-600">🎤 音声入力が利用できます</p>
                    <p className="text-sm text-green-600">
                      💡 ヘッダーの音声ボタン → ハンズフリーモードON で、<br />
                      話し始めると自動で送信されます
                    </p>
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg px-4 py-2 text-gray-600">
                  <span className="inline-block animate-pulse">入力中...</span>
                </div>
              </div>
            )}

            {isSpeaking && (
              <div className="flex justify-center">
                <div className="bg-blue-100 text-blue-700 rounded-lg px-4 py-2 text-sm">
                  🔊 読み上げ中...
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700">
                <p className="font-semibold">エラー</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {warning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-yellow-800">
                <p className="text-sm">{warning}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            {/* Hands-Free Status */}
            {voiceSettings.handsFree && (
              <div className="mb-2 text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  isListening
                    ? 'bg-green-100 text-green-700 animate-pulse'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isListening ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                      🎙️ 音声を聞き取り中...
                    </>
                  ) : isLoading ? (
                    <>⏳ 処理中...</>
                  ) : isSpeaking ? (
                    <>🔊 読み上げ中...</>
                  ) : (
                    <>✓ 待機中（話しかけてください）</>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-2">
              {/* Microphone Button - Only show when NOT in hands-free mode */}
              {isRecognitionSupported && !voiceSettings.handsFree && (
                <button
                  onClick={toggleMicrophone}
                  disabled={isLoading}
                  type="button"
                  className={`min-w-[60px] px-5 py-2 rounded-lg text-xl font-medium transition-all ${
                    isListening
                      ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse shadow-lg'
                      : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                  } disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500`}
                  title={isListening ? '🔴 録音中（クリックで停止）' : '🎤 音声入力を開始'}
                >
                  {isListening ? '⏹' : '🎤'}
                </button>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  voiceSettings.handsFree
                    ? '音声認識の結果が表示されます'
                    : isListening
                    ? '音声認識中...'
                    : '営業トークを入力...'
                }
                disabled={isLoading || isListening || voiceSettings.handsFree}
                readOnly={voiceSettings.handsFree}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {!voiceSettings.handsFree && (
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isLoading || isListening}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  送信
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              本アプリは練習用です。出力内容の正確性は保証しません。
            </p>
          </div>
        </footer>

        {/* Settings Sheet */}
        {showSettings && (
          <SettingsSheet
            settings={settings}
            onSave={handleSettingsChange}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}
