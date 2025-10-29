import { useState } from 'react';
import type { DemoSettings } from '@/lib/types';

interface DemoSettingsSheetProps {
  settings: DemoSettings;
  onSave: (settings: DemoSettings) => void;
  onClose: () => void;
}

export default function DemoSettingsSheet({ settings, onSave, onClose }: DemoSettingsSheetProps) {
  const [age, setAge] = useState(settings.age);
  const [gender, setGender] = useState(settings.gender);
  const [maritalStatus, setMaritalStatus] = useState(settings.maritalStatus);
  const [insuranceProduct, setInsuranceProduct] = useState(settings.insuranceProduct);

  const handleSave = () => {
    onSave({ age, gender, maritalStatus, insuranceProduct });
  };

  const ageOptions = Array.from({ length: 53 }, (_, i) => i + 18); // 18-70歳

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">見込み客と商品の設定</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">年齢</label>
            <select
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ageOptions.map((a) => (
                <option key={a} value={a}>
                  {a}歳
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="male"
                  checked={gender === 'male'}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="mr-2"
                />
                <span className="text-gray-700">男性</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="female"
                  checked={gender === 'female'}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="mr-2"
                />
                <span className="text-gray-700">女性</span>
              </label>
            </div>
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">結婚状況</label>
            <select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as 'single' | 'married' | 'divorced')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="single">独身</option>
              <option value="married">既婚</option>
              <option value="divorced">離婚</option>
            </select>
          </div>

          {/* Insurance Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">営業する保険商品</label>
            <select
              value={insuranceProduct}
              onChange={(e) => setInsuranceProduct(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cancer">がん保険</option>
              <option value="medical">医療保険</option>
              <option value="life">生命保険（死亡保障）</option>
              <option value="nursing">介護保険</option>
              <option value="education">学資保険</option>
              <option value="pension">個人年金保険</option>
            </select>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 mt-4">
            <p className="text-sm text-gray-600">
              <strong>設定プレビュー:</strong>
            </p>
            <p className="text-sm text-gray-800 mt-1">
              {age}歳・{gender === 'male' ? '男性' : '女性'}・
              {maritalStatus === 'single' ? '独身' : maritalStatus === 'married' ? '既婚' : '離婚'}の見込み客に対して、
              <strong>
                {insuranceProduct === 'cancer'
                  ? 'がん保険'
                  : insuranceProduct === 'medical'
                  ? '医療保険'
                  : insuranceProduct === 'life'
                  ? '生命保険'
                  : insuranceProduct === 'nursing'
                  ? '介護保険'
                  : insuranceProduct === 'education'
                  ? '学資保険'
                  : '個人年金保険'}
              </strong>
              を営業します
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
