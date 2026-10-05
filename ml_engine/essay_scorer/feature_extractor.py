"""
NLP Feature Extractor for Automated Essay Scoring (AES)
Trích xuất 6 đặc trưng ngôn ngữ học và thống kê từ văn bản tiếng Anh:
1. word_count: Tổng số từ
2. avg_sentence_length: Độ dài trung bình câu (Words per Sentence - WPS)
3. lexical_diversity: Tỷ lệ Type-Token Ratio (TTR = số từ độc nhất / tổng từ)
4. advanced_vocab_ratio: Tỷ lệ từ vựng nâng cao thuộc khung CEFR B1/C1
5. flesch_reading_ease: Điểm số độ dễ đọc theo công thức quốc tế Flesch Reading Ease
6. cohesive_density: Mật độ liên từ / từ nối (tính trên 100 từ)
"""

import re
import json
import os
from typing import Dict, Any, List

def count_syllables(word: str) -> int:
    """Đếm số âm tiết gần đúng của một từ tiếng Anh."""
    word = word.lower().strip()
    if not word:
        return 0
    if len(word) <= 3:
        return 1
    # Bỏ 'e' câm ở cuối từ
    word = re.sub(r'(?:[^laeiouy]|ed|es|e)$', '', word)
    # Bỏ các tiền tố hậu tố thường gặp
    word = re.sub(r'^y', '', word)
    syllables = len(re.findall(r'[aeiouy]{1,2}', word))
    return max(1, syllables)

class NLPFeatureExtractor:
    def __init__(self, vocab_path: str = None):
        if vocab_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            candidate = os.path.join(base_dir, "..", "datasets", "cefr_vocab.json")
            if os.path.exists(candidate):
                vocab_path = candidate
            else:
                vocab_path = os.path.join(base_dir, "cefr_vocab.json")
            
        with open(vocab_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        self.levels = data.get("levels", {})
        self.a1_set = set(self.levels.get("A1", []))
        self.b1_set = set(self.levels.get("B1", []))
        self.c1_set = set(self.levels.get("C1", []))
        self.cohesive_devices = [c.lower() for c in data.get("cohesive_devices", [])]

    def extract(self, text: str) -> Dict[str, float]:
        text_clean = text.strip()
        if not text_clean:
            return {
                "word_count": 0.0,
                "avg_sentence_length": 0.0,
                "lexical_diversity": 0.0,
                "advanced_vocab_ratio": 0.0,
                "flesch_reading_ease": 0.0,
                "cohesive_density": 0.0,
            }

        # 1. Tách câu
        sentences = [s.strip() for s in re.split(r'[.!?]+', text_clean) if s.strip()]
        sentence_count = max(1, len(sentences))

        # 2. Tách từ
        raw_words = re.findall(r'\b[a-zA-Z\']+\b', text_clean)
        words = [w.lower() for w in raw_words]
        total_words = max(1, len(words))

        # 3. Đặc trưng 1 & 2: Số từ & Độ dài trung bình câu
        avg_sentence_length = float(total_words) / float(sentence_count)

        # 4. Đặc trưng 3: Lexical Diversity (Type-Token Ratio - TTR)
        unique_words = set(words)
        lexical_diversity = len(unique_words) / float(total_words)

        # 5. Đặc trưng 4: Tỷ lệ từ vựng B1 - C1
        advanced_count = sum(1 for w in words if w in self.b1_set or w in self.c1_set)
        advanced_vocab_ratio = advanced_count / float(total_words)

        # 6. Đặc trưng 5: Flesch Reading Ease
        total_syllables = sum(count_syllables(w) for w in words)
        asw = total_syllables / float(total_words) # Average syllables per word
        flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * asw)
        # Chuẩn hóa về thang 0-100
        flesch_reading_ease = max(0.0, min(100.0, flesch_score))

        # 7. Đặc trưng 6: Mật độ liên từ (Cohesive Devices trên 100 từ)
        lower_text = text_clean.lower()
        cohesive_count = 0
        for device in self.cohesive_devices:
            # Tìm kiếm cụm từ nguyên vẹn
            matches = re.findall(r'\b' + re.escape(device) + r'\b', lower_text)
            cohesive_count += len(matches)
        cohesive_density = (cohesive_count / float(total_words)) * 100.0

        return {
            "word_count": float(total_words),
            "avg_sentence_length": round(avg_sentence_length, 2),
            "lexical_diversity": round(lexical_diversity, 4),
            "advanced_vocab_ratio": round(advanced_vocab_ratio, 4),
            "flesch_reading_ease": round(flesch_reading_ease, 2),
            "cohesive_density": round(cohesive_density, 2),
        }
