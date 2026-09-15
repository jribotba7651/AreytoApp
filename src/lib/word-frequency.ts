const SPANISH_STOPWORDS = new Set([
  'a', 'al', 'algo', 'algunas', 'algunos', 'ante', 'antes', 'como', 'con',
  'contra', 'cual', 'cuando', 'de', 'del', 'desde', 'donde', 'durante', 'e',
  'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era', 'erais', 'eran', 'eras',
  'eres', 'es', 'esa', 'esas', 'ese', 'eso', 'esos', 'esta', 'estaba',
  'estaban', 'estado', 'estan', 'estar', 'este', 'esto', 'estos', 'fue', 'han',
  'has', 'hasta', 'hay', 'la', 'las', 'le', 'les', 'lo', 'los', 'me', 'mi',
  'mis', 'mucho', 'muchos', 'muy', 'mas', 'nada', 'ni', 'no', 'nos', 'nosotros',
  'nuestra', 'nuestras', 'nuestro', 'nuestros', 'o', 'os', 'otra', 'otras',
  'otro', 'otros', 'para', 'pero', 'poco', 'por', 'porque', 'que', 'quien',
  'quienes', 'se', 'sea', 'sean', 'ser', 'si', 'sin', 'sobre', 'son', 'su',
  'sus', 'te', 'teneis', 'tenia', 'tiene', 'tienen', 'todo', 'todos', 'tu',
  'tus', 'un', 'una', 'unas', 'uno', 'unos', 'usted', 'ustedes', 'vosotros',
  'y', 'ya', 'yo',
]);

const ENGLISH_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'did', 'do', 'does', 'doing', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'will', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves',
]);

export interface WordFrequency {
  word: string;
  count: number;
}

export function computeWordFrequencies(
  content: string,
  topN: number,
): WordFrequency[] {
  const prose = content.replace(/^#+\s.*$/gm, '');
  const tokens = prose.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  const counts = new Map<string, number>();

  for (const token of tokens) {
    if (token.length < 2) continue;
    if (SPANISH_STOPWORDS.has(token) || ENGLISH_STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, topN);
}