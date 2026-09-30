export interface BulkQuestionInput {
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

export function parseBulkQuestions(rawContent: string, format: 'json' | 'csv'): BulkQuestionInput[] {
  if (format === 'json') {
    const parsed = JSON.parse(rawContent);
    if (!Array.isArray(parsed)) throw new Error('JSON root must be an array of questions');
    return parsed.map((q, idx) => ({
      text: q.text || `Question ${idx + 1}`,
      options: q.options || [],
      correctOptionId: q.correctOptionId || 'opt-1',
      explanation: q.explanation || '',
    }));
  }

  // Simple CSV parser: text,opt1,opt2,opt3,opt4,correctIndex(1-4),explanation
  const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  const questions: BulkQuestionInput[] = [];

  lines.forEach((line, idx) => {
    // Skip header line if detected
    if (idx === 0 && line.toLowerCase().includes('question')) return;

    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 6) {
      const [text, opt1, opt2, opt3, opt4, correctIdxStr, explanation] = parts;
      const correctIndex = parseInt(correctIdxStr, 10) || 1;
      const options = [
        { id: 'opt-1', text: opt1 },
        { id: 'opt-2', text: opt2 },
        { id: 'opt-3', text: opt3 },
        { id: 'opt-4', text: opt4 },
      ].filter(o => o.text && o.text.length > 0);

      questions.push({
        text,
        options,
        correctOptionId: `opt-${correctIndex}`,
        explanation: explanation || '',
      });
    }
  });

  return questions;
}
