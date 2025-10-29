'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { DemoSettings } from '@/lib/types';
import DemoSettingsSheet from '@/components/DemoSettingsSheet';
import DemoMessage from '@/components/DemoMessage';

const SETTINGS_KEY = 'insurance-demo-settings';

interface ConversationTurn {
  salesman: string;
  prospect: string;
}

interface Message {
  role: 'salesman' | 'prospect';
  content: string;
  timestamp: number;
}

export default function DemoPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [turns, setTurns] = useState(3);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [salesmanHistory, setSalesmanHistory] = useState<any[]>([]);
  const [prospectHistory, setProspectHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<DemoSettings>({
    prospectName: '田中様',
    age: 38,
    gender: 'female',
    maritalStatus: 'married',
    insuranceProduct: 'cancer',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setCurrentTurn(0);
    setSalesmanHistory([]);
    setProspectHistory([]);

    try {
      let localSalesmanHistory: any[] = [];
      let localProspectHistory: any[] = [];

      for (let i = 0; i < turns; i++) {
        setCurrentTurn(i + 1);

        // 営業マンの発言を生成
        const salesmanResponse = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings,
            role: 'salesman',
            salesmanHistory: localSalesmanHistory,
            prospectHistory: localProspectHistory,
          }),
        });

        const salesmanData = await salesmanResponse.json();

        if (!salesmanResponse.ok) {
          throw new Error(salesmanData.error || '営業マンの発言生成に失敗しました');
        }

        // 営業マンのメッセージを表示
        const salesmanMessage: Message = {
          role: 'salesman',
          content: salesmanData.message,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, salesmanMessage]);

        // 履歴を更新
        localSalesmanHistory = salesmanData.salesmanHistory;
        localProspectHistory = salesmanData.prospectHistory;

        // 見込み客の履歴に営業マンの発言を追加
        localProspectHistory.push({
          role: 'user',
          content: [{ text: salesmanData.message }],
        });

        setSalesmanHistory(localSalesmanHistory);
        setProspectHistory(localProspectHistory);

        // 見込み客の発言を生成
        const prospectResponse = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings,
            role: 'prospect',
            salesmanHistory: localSalesmanHistory,
            prospectHistory: localProspectHistory,
          }),
        });

        const prospectData = await prospectResponse.json();

        if (!prospectResponse.ok) {
          throw new Error(prospectData.error || '見込み客の発言生成に失敗しました');
        }

        // 見込み客のメッセージを表示
        const prospectMessage: Message = {
          role: 'prospect',
          content: prospectData.message,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, prospectMessage]);

        // 履歴を更新
        localSalesmanHistory = prospectData.salesmanHistory;
        localProspectHistory = prospectData.prospectHistory;
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
      let localSalesmanHistory = salesmanHistory;
      let localProspectHistory = prospectHistory;

      // 営業マンの発言を生成
      const salesmanResponse = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          role: 'salesman',
          salesmanHistory: localSalesmanHistory,
          prospectHistory: localProspectHistory,
        }),
      });

      const salesmanData = await salesmanResponse.json();

      if (!salesmanResponse.ok) {
        throw new Error(salesmanData.error || '営業マンの発言生成に失敗しました');
      }

      // 営業マンのメッセージを表示
      const salesmanMessage: Message = {
        role: 'salesman',
        content: salesmanData.message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, salesmanMessage]);

      // 履歴を更新
      localSalesmanHistory = salesmanData.salesmanHistory;
      localProspectHistory = salesmanData.prospectHistory;

      // 見込み客の履歴に営業マンの発言を追加
      localProspectHistory.push({
        role: 'user',
        content: [{ text: salesmanData.message }],
      });

      setSalesmanHistory(localSalesmanHistory);
      setProspectHistory(localProspectHistory);

      // 見込み客の発言を生成
      const prospectResponse = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          role: 'prospect',
          salesmanHistory: localSalesmanHistory,
          prospectHistory: localProspectHistory,
        }),
      });

      const prospectData = await prospectResponse.json();

      if (!prospectResponse.ok) {
        throw new Error(prospectData.error || '見込み客の発言生成に失敗しました');
      }

      // 見込み客のメッセージを表示
      const prospectMessage: Message = {
        role: 'prospect',
        content: prospectData.message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, prospectMessage]);

      // 履歴を更新
      localSalesmanHistory = prospectData.salesmanHistory;
      localProspectHistory = prospectData.prospectHistory;
      setSalesmanHistory(localSalesmanHistory);
      setProspectHistory(localProspectHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (newSettings: DemoSettings) => {
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
    <div className="flex flex-col h-screen bg-gray-50">
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
      <main className="flex-1 overflow-hidden flex flex-col max-w-6xl mx-auto w-full px-4 py-6 gap-4">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">このページについて</h2>
          <p className="text-sm text-blue-800">
            プロの営業マンと金融リテラシーが高い見込み客のAI同士の会話を自動生成します。
            営業初心者の方が、効果的な営業トークを学ぶための参考資料としてご活用ください。
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <h3 className="text-md font-semibold text-gray-800 mb-4">会話の設定</h3>

          <div className="space-y-4">
            {/* Settings Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">見込み客:</span>
                  <span className="ml-2 text-gray-600">
                    {settings.prospectName}（{settings.age}歳・{settings.gender === 'male' ? '男性' : '女性'}・
                    {settings.maritalStatus === 'single'
                      ? '独身'
                      : settings.maritalStatus === 'married'
                      ? '既婚'
                      : '離婚'}）
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">営業商品:</span>
                  <span className="ml-2 text-gray-600">
                    {settings.insuranceProduct === 'cancer'
                      ? 'がん保険'
                      : settings.insuranceProduct === 'medical'
                      ? '医療保険'
                      : settings.insuranceProduct === 'life'
                      ? '生命保険'
                      : settings.insuranceProduct === 'nursing'
                      ? '介護保険'
                      : settings.insuranceProduct === 'education'
                      ? '学資保険'
                      : '個人年金保険'}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-right">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  設定を変更
                </button>
              </div>
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

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && !isLoading && !error && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">上記の設定で「会話を生成」ボタンを押してください</p>
                  <p className="text-sm mt-2">プロの営業マンと見込み客の会話が自動生成されます</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <DemoMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  prospectName={settings.prospectName}
                />
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-lg px-4 py-2 text-gray-600">
                    <span className="inline-block animate-pulse">
                      {currentTurn > 0 ? `ターン ${currentTurn} / ${turns} を生成中...` : '入力中...'}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700">
                  <p className="font-semibold">エラー</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            <div className="max-w-3xl mx-auto flex gap-2">
              <button
                onClick={handleContinue}
                disabled={isLoading || messages.length === 0}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                会話を続ける
              </button>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                新しい会話を生成
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Sheet */}
      {showSettings && (
        <DemoSettingsSheet
          settings={settings}
          onSave={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
