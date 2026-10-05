"""
Huấn luyện Mô hình Đánh giá Độ Trôi Chảy (Fluency & Grammatical Correctness)
dựa trên bộ dữ liệu chuẩn JFLEG (Johns Hopkins University - 1.501 câu gốc vs 4.879 câu bản xứ).

Mô hình:
1. TF-IDF Character & Word n-grams
2. Logistic Regression phân loại nhị phân (0 = Câu có lỗi/gượng gạo, 1 = Câu chuẩn bản xứ)
3. Lưu trọng số mô hình vào ml_engine/fluency_model.json để TypeScript chạy nội bộ 0ms.
"""

import json
import os
import sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

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
        data = json.load(f)
    return data

def main():
    print("=== HUẤN LUYỆN MÔ HÌNH FLUENCY & GEC TRÊN DATASET JFLEG ===")
    data = load_jfleg()
    print(f"-> Đã tải {len(data)} mẫu từ jfleg_dataset.json")

    X = []
    y = []

    # Nhãn 0: Câu của người học (chứa lỗi ngữ pháp hoặc diễn đạt chưa tự nhiên)
    # Nhãn 1: Câu sửa của người bản xứ (chuẩn ngữ pháp và mượt mà)
    for item in data:
        orig = item["original"].strip()
        if orig:
            X.append(orig)
            y.append(0)

        # Lấy câu sửa chuẩn đầu tiên (ref0) của người bản xứ
        if item["corrections"]:
            best_corr = item["corrections"][0].strip()
            if best_corr and best_corr != orig:
                X.append(best_corr)
                y.append(1)

    print(f"-> Tổng số mẫu huấn luyện cân bằng: {len(X)} câu (Nhãn 0: {y.count(0)}, Nhãn 1: {y.count(1)})")

    # Chia train / test (85% train, 15% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    # Trích xuất đặc trưng TF-IDF hỗn hợp (word unigram + bigram)
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=2500,
        sublinear_tf=True,
        min_df=2
    )

    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Huấn luyện mô hình Logistic Regression với L2 Regularization
    clf = LogisticRegression(C=2.0, max_iter=500, random_state=42)
    clf.fit(X_train_vec, y_train)

    y_pred = clf.predict(X_test_vec)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n✓ Độ chính xác trên tập kiểm tra (Accuracy): {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred, target_names=["Learner (Needs Edit)", "Native Fluent"]))

    # Xuất trọng số mô hình sang JSON để TypeScript nạp trực tiếp trong 0ms
    vocab = vectorizer.vocabulary_
    idf = vectorizer.idf_.tolist()
    coef = clf.coef_[0].tolist()
    intercept = float(clf.intercept_[0])

    # Chọn 100 cặp câu JFLEG điển hình nhất để làm bộ nhớ tra cứu mẫu câu tương đồng (GEC Retrieval)
    exemplars = []
    for item in data[:120]:
        if item["corrections"]:
            exemplars.append({
                "original": item["original"],
                "correction": item["corrections"][0]
            })

    model_export = {
        "model_type": "TF-IDF + Logistic Regression Fluency Scorer",
        "dataset": "JFLEG (JHU FLuency-Extended GUG)",
        "num_samples": len(X),
        "accuracy": round(acc, 4),
        "vocabulary": vocab,
        "idf": idf,
        "coefficients": coef,
        "intercept": intercept,
        "exemplars": exemplars
    }

    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    out_path = os.path.join(models_dir, "fluency_model.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(model_export, f, ensure_ascii=False)

    print(f"✓ Đã xuất trọng số mô hình vào: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")
    print("✓ Quá trình huấn luyện trên dataset JFLEG hoàn tất thành công!")

if __name__ == "__main__":
    main()
