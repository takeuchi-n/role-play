const ACCEPTANCE_KEYWORDS = [
  '加入します',
  '契約します',
  '前向きに検討',
  '申し込みます',
  '申し込みたい',
  '承諾します',
  '受け入れます',
  '賛成です',
  '了解しました',
  '是非お願いします',
  '入りたい',
  '検討します',
  '興味があります',
];

export function containsAcceptance(text: string): boolean {
  // 保険加入に関する明確な受容表現のみを検出
  // 単なる挨拶や相づちは除外
  const normalizedText = text.replace(/\s/g, '');

  return ACCEPTANCE_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.replace(/\s/g, '');
    return normalizedText.includes(normalizedKeyword);
  });
}

export function validateResponse(text: string): { valid: boolean; warning?: string } {
  if (containsAcceptance(text)) {
    return {
      valid: false,
      warning: 'ロールプレイ規約違反の応答（受容表現）が検出されました。もう一度送ってください。',
    };
  }

  return { valid: true };
}
