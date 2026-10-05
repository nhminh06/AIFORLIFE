"""
English AI Chatbot Intent Classification Model Training Script
Huấn luyện mô hình Machine Learning nhận diện ý định (Intent Classification) cho Chatbot:
- Dữ liệu: ml_engine/chatbot_dataset.json
- Thuật toán: TF-IDF Vectorizer (ngram 1-2) + Logistic Regression (Softmax)
- Xuất kết quả: ml_engine/chatbot_model.json để tích hợp vào Chatbot Web chạy trong 0ms.
"""

import json
import os
import sys
import numpy as np

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidate_ds = os.path.join(base_dir, "..", "datasets", "chatbot_dataset.json")
    dataset_path = candidate_ds if os.path.exists(candidate_ds) else os.path.join(base_dir, "chatbot_dataset.json")

    if not os.path.exists(dataset_path):
        print(f"[!] Không tìm thấy file dữ liệu: {dataset_path}")
        sys.exit(1)

    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    print("=" * 60)
    print("🚀 BẮT ĐẦU HUẤN LUYỆN MÔ HÌNH CHATBOT INTENT NLP (LOCAL ML)")
    print("=" * 60)
    print(f"[*] Đã tải {len(dataset)} mẫu câu hỏi từ chatbot_dataset.json")

    texts = [item["text"].strip().lower() for item in dataset]
    intents = [item["intent"].strip() for item in dataset]

    # Trích xuất đặc trưng văn bản bằng TF-IDF (Unigram + Bigram) với max_features tối ưu
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=2500,
        min_df=1,
        sublinear_tf=True,
        norm="l2"
    )
    X = vectorizer.fit_transform(texts)
    y = np.array(intents)

    # Huấn luyện mô hình phân loại Logistic Regression với class_weight="balanced"
    clf = LogisticRegression(
        C=5.0,
        max_iter=1000,
        class_weight="balanced",
        random_state=42
    )
    clf.fit(X, y)

    # Đánh giá độ chính xác
    y_pred = clf.predict(X)
    acc = accuracy_score(y, y_pred)
    classes = list(clf.classes_)

    print(f"[✓] Số lượng nhãn ý định (Intents): {len(classes)}")
    print(f"[✓] Kích thước từ điển TF-IDF: {len(vectorizer.vocabulary_)} đặc trưng")
    print(f"[✓] Độ chính xác trên tập huấn luyện: {acc * 100:.2f}%")
    print("-" * 60)

    # Chuẩn bị dữ liệu mô hình để xuất ra JSON cho Chatbot Web dùng trực tiếp
    # clf.coef_ có shape [num_classes, num_features]
    # clf.intercept_ có shape [num_classes]
    vocab_dict = {k: int(v) for k, v in vectorizer.vocabulary_.items()}
    idf_list = [round(float(v), 5) for v in vectorizer.idf_]
    coef_list = [[round(float(w), 5) for w in row] for row in clf.coef_]
    intercept_list = [round(float(b), 5) for b in clf.intercept_]

    model_data = {
        "model_type": "TF-IDF + Logistic Regression Intent Classifier",
        "classes": classes,
        "vocabulary": vocab_dict,
        "idf": idf_list,
        "coefficients": coef_list,
        "intercept": intercept_list,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "num_samples": len(dataset),
            "num_classes": len(classes),
            "num_features": len(vocab_dict),
        }
    }

    models_dir = os.path.join(base_dir, "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    output_path = os.path.join(models_dir, "chatbot_model.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(model_data, f, ensure_ascii=False)

    print(f"[🎉] ĐÃ XUẤT TRỌNG SỐ MÔ HÌNH THÀNH CÔNG VÀO:")
    print(f"     ➡️ {output_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
