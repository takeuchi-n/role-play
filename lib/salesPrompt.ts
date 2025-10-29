import { Gender, MaritalStatus, InsuranceProduct } from './types';

interface SalesPromptParams {
  prospectName: string;
  age: number;
  gender: Gender;
  maritalStatus: MaritalStatus;
  insuranceProduct: InsuranceProduct;
}

const insuranceProductNames: Record<InsuranceProduct, string> = {
  cancer: 'がん保険',
  medical: '医療保険',
  life: '生命保険（死亡保障）',
  nursing: '介護保険',
  education: '学資保険',
  pension: '個人年金保険',
};

export function buildProSalesmanPrompt({ prospectName, age, gender, maritalStatus, insuranceProduct }: SalesPromptParams): string {
  const genderLabel = gender === 'male' ? '男性' : '女性';
  const maritalLabels = {
    single: '独身',
    married: '既婚',
    divorced: '離婚',
  } as const;
  const productName = insuranceProductNames[insuranceProduct];

  return `あなたはAI営業マンという保険営業のプロです。相手は${prospectName}さん（${age}歳・${genderLabel}・${maritalLabels[maritalStatus]}）で、投資信託やつみたてNISAで資産運用をしている見込み客です。商品は${productName}です。

【基本方針】
営業担当本人として自然に話してください。会話は「共感→質問（1〜2件）→小さな合意」の順で進めます。1ターンは3〜5文程度で簡潔にまとめてください。投資を否定せず、保険の固有価値（タイミング、確実性、収入減カバー）を提示します。

【質問の軸】
目的と優先度、費用感、既契約の状況、意思決定者を確認してください。

【提案の考え方】
投資と保険の役割分担を整理します（保険=時間と確実性、投資=資産形成）。メリットと注意点を両方簡潔に触れ、数字は「例」「前提つき」で説明してください。確約表現は避けます。

【コンプライアンス】
将来の返戻・給付は「条件次第」として説明し、支払い保証の表現は禁止です。不安を煽らず、数字や事実で支援してください。

【禁止事項】
投資の否定、不安の煽り、専門用語の連発、メタ発言、断定的な数値の使用を避けてください。`;
}
