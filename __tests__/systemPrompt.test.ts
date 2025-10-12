import { buildSystemPrompt, buildRetrySystemPrompt } from '../lib/systemPrompt';

describe('systemPrompt', () => {
  describe('buildSystemPrompt', () => {
    it('断る指針が含まれている', () => {
      const prompt = buildSystemPrompt({ rejectionType: 'budget', intensity: 2 });

      expect(prompt).toContain('絶対に保険加入を受け入れません');
      expect(prompt).toContain('加入はしない');
      expect(prompt).toContain('お断り');
    });

    it('予算タイプの理由が含まれている', () => {
      const prompt = buildSystemPrompt({ rejectionType: 'budget', intensity: 2 });

      expect(prompt).toContain('可処分所得');
      expect(prompt).toContain('固定費');
    });

    it('既契約タイプの理由が含まれている', () => {
      const prompt = buildSystemPrompt({ rejectionType: 'existing', intensity: 2 });

      expect(prompt).toContain('十分な補償');
    });

    it('家族反対タイプの理由が含まれている', () => {
      const prompt = buildSystemPrompt({ rejectionType: 'family', intensity: 2 });

      expect(prompt).toContain('配偶者');
      expect(prompt).toContain('抵抗感');
    });

    it('多忙タイプの理由が含まれている', () => {
      const prompt = buildSystemPrompt({ rejectionType: 'busy', intensity: 2 });

      expect(prompt).toContain('判断に時間');
      expect(prompt).toContain('先延ばし');
    });

    it('人物設定が含まれている', () => {
      const prompt = buildSystemPrompt({ rejectionType: 'budget', intensity: 2 });

      expect(prompt).toContain('山田 愛');
      expect(prompt).toContain('38歳');
      expect(prompt).toContain('事務職');
    });

    it('応答スタイルの強さが反映される', () => {
      const prompt1 = buildSystemPrompt({ rejectionType: 'budget', intensity: 1 });
      const prompt3 = buildSystemPrompt({ rejectionType: 'budget', intensity: 3 });

      expect(prompt1).toContain('控えめ');
      expect(prompt3).toContain('強め');
      expect(prompt3).toContain('断固');
    });
  });

  describe('buildRetrySystemPrompt', () => {
    it('リトライ用の追加指示が含まれている', () => {
      const prompt = buildRetrySystemPrompt({ rejectionType: 'budget', intensity: 2 });

      expect(prompt).toContain('直近の応答は誤り');
      expect(prompt).toContain('厳守');
    });

    it('元のシステムプロンプトの内容も含まれている', () => {
      const prompt = buildRetrySystemPrompt({ rejectionType: 'budget', intensity: 2 });

      expect(prompt).toContain('山田 愛');
      expect(prompt).toContain('絶対に保険加入を受け入れません');
    });
  });
});
