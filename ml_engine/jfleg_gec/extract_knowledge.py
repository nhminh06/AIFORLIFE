"""
Phân tích và trích xuất tri thức từ bộ dữ liệu JFLEG:
1. Dùng difflib để tự động bóc tách các cụm từ sai (learner phrase) và cụm từ sửa (native phrase).
2. Xây dựng chỉ mục TF-IDF để tìm kiếm câu tương đồng (GEC Sentence Retrieval).
3. Xuất ra file ml_engine/jfleg_knowledge.json cho TypeScript nạp trực tiếp.
"""

import json
import os
import sys
import difflib
import re
from sklearn.feature_extraction.text import TfidfVectorizer

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def load_jfleg():
    base_dir = os.path.dirname(__file__)
    candidate = os.path.join(base_dir, "..", "datasets", "jfleg_dataset.json")
    dataset_path = candidate if os.path.exists(candidate) else os.path.join(base_dir, "jfleg_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_phrasal_edits(orig: str, corr: str):
    """Trích xuất các cụm từ bị thay thế giữa câu gốc và câu sửa"""
    orig_words = orig.split()
    corr_words = corr.split()
    
    matcher = difflib.SequenceMatcher(None, orig_words, corr_words)
    edits = []
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "replace":
            bad = " ".join(orig_words[i1:i2])
            good = " ".join(corr_words[j1:j2])
            # Bỏ qua nếu chỉ là viết hoa chữ cái đầu câu
            if bad.lower() != good.lower() and len(bad) > 1 and len(good) > 1:
                edits.append({"bad": bad, "good": good})
        elif tag == "delete":
            deleted = " ".join(orig_words[i1:i2])
            if len(deleted) > 1:
                edits.append({"bad": deleted, "good": "", "type": "redundant"})
        elif tag == "insert":
            inserted = " ".join(corr_words[j1:j2])
            if len(inserted) > 1:
                edits.append({"bad": "", "good": inserted, "type": "missing"})
                
    return edits

def main():
    print("=== TRÍCH XUẤT TRI THỨC NGỮ PHÁP TỪ 1.501 CÂU JFLEG ===")
    data = load_jfleg()
    
    all_edits = []
    edit_frequency = {}
    indexed_pairs = []
    
    for item in data:
        orig = item["original"]
        best_ref = item["corrections"][0] if item["corrections"] else orig
        
        # Trích xuất edits
        edits = extract_phrasal_edits(orig, best_ref)
        if edits:
            all_edits.extend(edits)
            for e in edits:
                if e.get("bad") and e.get("good"):
                    key = f"{e['bad'].lower()} -> {e['good'].lower()}"
                    edit_frequency[key] = edit_frequency.get(key, 0) + 1
                    
        indexed_pairs.append({
            "id": item["id"],
            "original": orig,
            "correction": best_ref,
            "num_corrections": len(item["corrections"])
        })
        
    print(f"✓ Đã phân tích: {len(data)} câu")
    print(f"✓ Đã bóc tách: {len(all_edits)} điểm chỉnh sửa ngữ pháp & từ vựng từ người bản xứ!")
    
    # Xây dựng TF-IDF Vectorizer cho 1.501 câu gốc
    corpus = [item["original"] for item in data]
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1500, min_df=2, sublinear_tf=True)
    X_tfidf = vectorizer.fit_transform(corpus)
    
    vocab = {k: int(v) for k, v in vectorizer.vocabulary_.items()}
    idf = [float(x) for x in vectorizer.idf_]
    
    # Lấy toàn bộ 1.501 cặp câu để bộ nhớ tra cứu có đầy đủ mọi mẫu lỗi
    exemplars = indexed_pairs
    
    knowledge_export = {
        "dataset_name": "JFLEG (JHU FLuency-Extended)",
        "total_pairs": len(data),
        "total_edits_extracted": len(all_edits),
        "vocabulary": vocab,
        "idf": idf,
        "exemplars": exemplars
    }
    
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    out_path = os.path.join(models_dir, "jfleg_knowledge.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(knowledge_export, f, ensure_ascii=False)
        
    print(f"✓ Đã xuất tri thức vào: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")
    print("✓ Hoàn tất thành công!")

if __name__ == "__main__":
    main()
