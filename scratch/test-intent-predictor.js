const modelData = require('../ml_engine/models/chatbot_model.json');

const { classes, vocabulary, idf, coefficients, intercept } = modelData;

function extractNgrams(text) {
  const words = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  const tokens = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
  }
  return tokens;
}

function predict(text) {
  const tokens = extractNgrams(text);
  const numFeatures = Object.keys(vocabulary).length;
  const counts = {};
  for (const token of tokens) {
    const idx = vocabulary[token];
    if (idx !== undefined && idx < numFeatures) {
      counts[idx] = (counts[idx] || 0) + 1;
    }
  }

  const activeIndices = [];
  const activeValues = [];
  let normSq = 0;
  for (const [idxStr, count] of Object.entries(counts)) {
    const idx = Number(idxStr);
    const val = (1 + Math.log(count)) * (idf[idx] || 1);
    activeIndices.push(idx);
    activeValues.push(val);
    normSq += val * val;
  }

  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let k = 0; k < activeValues.length; k++) {
      activeValues[k] /= norm;
    }
  }

  const numClasses = classes.length;
  const rawScores = new Float32Array(numClasses);
  let maxScore = -Infinity;

  for (let c = 0; c < numClasses; c++) {
    let score = intercept[c] ?? 0;
    const classWeights = coefficients[c];
    if (classWeights) {
      for (let k = 0; k < activeIndices.length; k++) {
        const idx = activeIndices[k];
        score += (classWeights[idx] ?? 0) * activeValues[k];
      }
    }
    rawScores[c] = score;
    if (score > maxScore) maxScore = score;
  }

  let sumExp = 0;
  const probs = new Float32Array(numClasses);
  for (let c = 0; c < numClasses; c++) {
    const rawVal = rawScores[c] ?? 0;
    const expVal = Math.exp(rawVal - maxScore);
    probs[c] = expVal;
    sumExp += expVal;
  }

  let bestIdx = 0;
  let bestProb = 0;
  for (let c = 0; c < numClasses; c++) {
    const p = sumExp > 0 ? (probs[c] ?? 0) / sumExp : 0;
    if (p > bestProb) {
      bestProb = p;
      bestIdx = c;
    }
  }

  return { intent: classes[bestIdx], confidence: (bestProb * 100).toFixed(1) + "%" };
}

const testQueries = [
  "Tra cứu 12 thì",
  "Thì hiện tại hoàn thành tiếp diễn",
  "thì quá khứ tiếp diễn",
  "công thức tương lai hoàn thành",
  "Phân biệt affect và effect",
  "Phân biệt house và home",
  "Cho tôi vài ví dụ",
  "Cho bài tập trắc nghiệm",
  "Chấm điểm bài viết essay này",
  "Sửa lỗi câu: She don't like apple",
  "xin chào bạn"
];

for (const q of testQueries) {
  console.log(`"${q}" ->`, predict(q));
}
