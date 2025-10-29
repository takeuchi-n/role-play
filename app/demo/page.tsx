'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { ChatSettings } from '@/lib/types';
import SettingsSheet from '@/components/SettingsSheet';

const SETTINGS_KEY = 'insurance-demo-settings';

interface ConversationTurn {
  salesman: string;
  prospect: string;
}

export default function DemoPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [turns, setTurns] = useState(3);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [salesmanHistory, setSalesmanHistory] = useState<any[]>([]);
  const [prospectHistory, setProspectHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<ChatSettings>({
    age: 38,
    gender: 'female',
    maritalStatus: 'married',
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setConversation([]);
    setCurrentTurn(0);
    setSalesmanHistory([]);
    setProspectHistory([]);

    try {
      let localSalesmanHistory: any[] = [];
      let localProspectHistory: any[] = [];

      for (let i = 0; i < turns; i++) {
        setCurrentTurn(i + 1);

        const response = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings,
            salesmanHistory: localSalesmanHistory,
            prospectHistory: localProspectHistory,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '会話の生成に失敗しました');
        }

        // 会話を追加
        setConversation((prev) => [...prev, data.turn]);

        // 履歴を更新
        localSalesmanHistory = data.salesmanHistory;
        localProspectHistory = data.prospectHistory;
        setSalesmanHistory(localSalesmanHistory);
        setProspectHistory(localProspectHistory);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信エラーが発生しました');
    } finally {
      setIsLoading(false);
      setCurrentTurn(0);
    }
  };

  const handleContinue = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          salesmanHistory,
          prospectHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '会話の生成に失敗しました');
      }

      // 会話を追加
      setConversation((prev) => [...prev, data.turn]);

      // 履歴を更新
      setSalesmanHistory(data.salesmanHistory);
      setProspectHistory(data.prospectHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (newSettings: ChatSettings) => {
    setSettings(newSettings);
    setShowSettings(false);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">営業トーク参考デモ</h1>
        <div className="flex items-center gap-3">
          <a
            href="/chat"
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
            title="ロープレ練習へ"
          >
            🎯 ロープレ練習
          </a>
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-600 hover:text-gray-800 text-2xl"
            aria-label="設定"
          >
            ⚙️
          </button>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={logout}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">このページについて</h2>
          <p className="text-sm text-blue-800">
            プロの営業マンと金融リテラシーが高い見込み客のAI同士の会話を自動生成します。
            営業初心者の方が、効果的な営業トークを学ぶための参考資料としてご活用ください。
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-4">会話の設定</h3>

          <div className="space-y-4">
            {/* Persona Display */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 min-w-32">見込み客</label>
              <div className="flex-1 text-sm text-gray-600">
                {settings.age}歳・{settings.gender === 'male' ? '男性' : '女性'}・
                {settings.maritalStatus === 'single'
                  ? '独身'
                  : settings.maritalStatus === 'married'
                  ? '既婚'
                  : '離婚'}
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                変更
              </button>
            </div>

            {/* Turns Slider */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 min-w-32">会話ターン数</label>
              <input
                type="range"
                min="1"
                max="10"
                value={turns}
                onChange={(e) => setTurns(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 min-w-12 text-right">{turns}ターン</span>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? '会話を生成中...' : '会話を生成'}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 mb-6">
            <p className="font-semibold">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading (initial generation) */}
        {isLoading && conversation.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">
              {currentTurn > 0 ? `ターン ${currentTurn} / ${turns} を生成中...` : '会話を生成中...'}
            </p>
            <p className="text-sm text-gray-500 mt-2">お待ちください</p>
          </div>
        )}

        {/* Conversation Display */}
        {conversation.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">生成された会話</h3>

            {conversation.map((turn, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Turn Header */}
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700">ターン {index + 1}</h4>
                </div>

                {/* Salesman */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                      👔
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900 mb-1">営業担当</div>
                      <div className="text-gray-800 whitespace-pre-wrap">{turn.salesman}</div>
                    </div>
                  </div>
                </div>

                {/* Prospect */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-green-900 mb-1">見込み客</div>
                      <div className="text-gray-800 whitespace-pre-wrap">{turn.prospect}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator for continuing conversation */}
            {isLoading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-3">次のターンを生成中...</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center pt-4 space-x-3">
              <button
                onClick={handleContinue}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                会話を続ける
              </button>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                新しい会話を生成
              </button>
            </div>
          </div>
        )}

        {/* Initial State */}
        {conversation.length === 0 && !isLoading && !error && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">上記の設定で「会話を生成」ボタンを押してください</p>
            <p className="text-sm mt-2">プロの営業マンと見込み客の会話が自動生成されます</p>
          </div>
        )}
      </main>

      {/* Settings Sheet */}
      {showSettings && (
        <SettingsSheet
          settings={settings}
          onSave={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
