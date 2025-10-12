import { useState } from 'react';
import type { ChatSettings, Gender, MaritalStatus } from '@/lib/types';

interface SettingsSheetProps {
  settings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
  onClose: () => void;
}

const genderLabels: Record<Gender, string> = {
  male: '男性',
  female: '女性',
};

const maritalStatusLabels: Record<MaritalStatus, string> = {
  single: '独身',
  married: '既婚',
  divorced: '離婚',
};

export default function SettingsSheet({ settings, onSave, onClose }: SettingsSheetProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800">見込み客の設定</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              年齢
            </label>
            <input
              type="number"
              min="20"
              max="70"
              value={localSettings.age}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  age: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性別
            </label>
            <div className="flex gap-2">
              {(Object.entries(genderLabels) as [Gender, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    setLocalSettings({ ...localSettings, gender: value })
                  }
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    localSettings.gender === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              結婚状況
            </label>
            <select
              value={localSettings.maritalStatus}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  maritalStatus: e.target.value as MaritalStatus,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.entries(maritalStatusLabels) as [MaritalStatus, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
