"""
Huấn luyện Mô hình Phát hiện Lỗi Ngữ pháp (Grammar Error Detection - GED)
Sử dụng Bộ dữ liệu Chuẩn JFLEG (Johns Hopkins University)
Các mô hình: Logistic Regression, Linear SVM (Calibrated), Complement Naive Bayes.
Đánh giá theo chuẩn quốc tế: Accuracy, Precision, Recall, F0.5 Score.
"""

import json
import os
import sys
import numpy as np
import scipy.sparse as sp
import joblib

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from feature_extractor import GrammarFeatureExtractor

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.naive_bayes import ComplementNB
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    fbeta_score,
    classification_report,
    confusion_matrix,
)

def load_combined_dataset():
    """
    Tải bộ dữ liệu GED đã hợp nhất (CoLA + C4_200M + JFLEG).
    File: ml_engine/datasets/ged_combined_dataset.json
    Format: [{"text": str, "label": 0|1, "source": str}, ...]
    Nếu không có combined dataset thì fallback về JFLEG thuần.
    """
    base_dir = os.path.dirname(__file__)
    combined_path = os.path.join(base_dir, "..", "datasets", "ged_combined_dataset.json")
    jfleg_path = os.path.join(base_dir, "..", "datasets", "jfleg_dataset.json")

    # ── Thử combined dataset trước ──
    if os.path.exists(combined_path):
        print(f"[✓] Dùng Combined Dataset: {combined_path}")
        with open(combined_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # ── Cân bằng class: lấy tối đa 1:1 (lỗi:đúng) để tránh bias ──
        # JFLEG có chất lượng cao nhất (human-annotated), C4M ưu tiên thấp hơn
        source_priority = {"jfleg": 3, "jfleg_corrected": 3, "cola": 2, "c4m": 1}

        label0 = [d for d in data if d["label"] == 0]
        label1 = [d for d in data if d["label"] == 1]

        # Sort by source priority (high priority first)
        import random as _rnd
        _rnd.seed(42)
        label0.sort(key=lambda d: -source_priority.get(d.get("source", "c4m"), 1))
        label1.sort(key=lambda d: -source_priority.get(d.get("source", "c4m"), 1))

        # Undersample majority class để đạt 1:1
        min_count = min(len(label0), len(label1))
        balanced = label0[:min_count] + label1[:min_count]
        _rnd.shuffle(balanced)

        texts = [d["text"] for d in balanced]
        labels = np.array([d["label"] for d in balanced], dtype=np.int32)

        print(f"[✓] Đã cân bằng: {min_count:,} lỗi + {min_count:,} đúng = {len(balanced):,} câu total")

        # Stratified split: 80% train / 20% test
        from sklearn.model_selection import train_test_split as tts
        X_train, X_test, y_train, y_test = tts(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )
        return X_train, y_train, X_test, y_test

    # ── Fallback: JFLEG gốc ──
    print(f"[!] Không tìm thấy combined dataset, dùng JFLEG gốc.")
    if not os.path.exists(jfleg_path):
        raise FileNotFoundError(f"Không tìm thấy JFLEG tại: {jfleg_path}")

    with open(jfleg_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    X_train_texts, y_train_list = [], []
    X_test_texts, y_test_list = [], []

    for item in data:
        is_test = (item.get("split") == "test")
        orig = item.get("original", "").strip()
        corrections = item.get("corrections", [])
        target_X = X_test_texts if is_test else X_train_texts
        target_y = y_test_list if is_test else y_train_list
        if orig and len(orig) > 5:
            target_X.append(orig)
            target_y.append(0)
        for corr in corrections:
            clean_corr = corr.strip()
            if clean_corr and clean_corr != orig and len(clean_corr) > 5:
                target_X.append(clean_corr)
                target_y.append(1)

    return (
        X_train_texts,
        np.array(y_train_list, dtype=np.int32),
        X_test_texts,
        np.array(y_test_list, dtype=np.int32),
    )

def main():
    print("=" * 70)
    print("🚀 BẮT ĐẦU HUẤN LUYỆN MÔ HÌNH GED v2 — COMBINED DATASET")
    print("=" * 70)

    X_train_texts, y_train, X_test_texts, y_test = load_combined_dataset()
    print(f"[*] Tập Huấn luyện: {len(X_train_texts):,} câu (Lỗi: {np.sum(y_train == 0):,}, Đúng: {np.sum(y_train == 1):,})")
    print(f"[*] Tập Kiểm tra  : {len(X_test_texts):,} câu (Lỗi: {np.sum(y_test == 0):,}, Đúng: {np.sum(y_test == 1):,})\n")

    # 2. Trích xuất đặc trưng (Feature Engineering):
    # A. Character N-grams (3-5 grams): Bắt lỗi hình thái từ, sai chính tả, biến dạng hậu tố
    print("[1/3] Đang vector hoá Character N-grams (3-5 gram)...")
    char_vec = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        max_features=6000,
        sublinear_tf=True,
        min_df=3,
    )
    X_train_char = char_vec.fit_transform(X_train_texts)
    X_test_char = char_vec.transform(X_test_texts)

    # B. Word N-grams (2-3 grams): Bắt các cụm kết hợp từ & trợ động từ bất thường
    print("[2/3] Đang vector hoá Word N-grams (2-3 gram)...")
    word_vec = TfidfVectorizer(
        ngram_range=(2, 3),
        max_features=4000,
        sublinear_tf=True,
        min_df=3,
    )
    X_train_word = word_vec.fit_transform(X_train_texts)
    X_test_word = word_vec.transform(X_test_texts)

    # C. Dense Heuristic Syntax Features
    print("[3/3] Đang trích xuất 10 đặc trưng cú pháp & dị thường ngữ pháp...")
    dense_extractor = GrammarFeatureExtractor()
    X_train_dense_raw = dense_extractor.transform(X_train_texts)
    X_test_dense_raw = dense_extractor.transform(X_test_texts)

    scaler = StandardScaler()
    X_train_dense = scaler.fit_transform(X_train_dense_raw)
    X_test_dense = scaler.transform(X_test_dense_raw)

    # Ghép toàn bộ đặc trưng vào Ma trận Thưa (Composite Feature Matrix)
    X_train = sp.hstack([X_train_char, X_train_word, sp.csr_matrix(X_train_dense)]).tocsr()
    X_test = sp.hstack([X_test_char, X_test_word, sp.csr_matrix(X_test_dense)]).tocsr()

    print(f"[✓] Tổng số chiều không gian đặc trưng (Feature Dimensions): {X_train.shape[1]}")

    # 3. Huấn luyện và so sánh các mô hình Machine Learning
    models = {
        "Logistic Regression (L2)": LogisticRegression(
            C=1.5,
            max_iter=1000,
            class_weight="balanced",
            random_state=42
        ),
        "Linear SVM (Calibrated)": CalibratedClassifierCV(
            estimator=LinearSVC(C=0.8, class_weight="balanced", dual="auto", max_iter=3000, random_state=42),
            method="sigmoid",
            cv=3
        ),
        "Complement Naive Bayes": ComplementNB(alpha=0.5),
    }

    from sklearn.metrics import balanced_accuracy_score, f1_score

    print("\n" + "=" * 88)
    print(f"{'Mô hình Machine Learning':<28} | {'Accuracy':<10} | {'Balanced Acc':<12} | {'Precision':<10} | {'Macro F1':<10}")
    print("-" * 88)

    best_model_name = None
    best_score = -1.0
    best_clf = None
    results = {}

    for name, clf in models.items():
        if name == "Complement Naive Bayes":
            # Naive Bayes chỉ nhận giá trị không âm
            X_tr = sp.hstack([X_train_char, X_train_word]).tocsr()
            X_te = sp.hstack([X_test_char, X_test_word]).tocsr()
            clf.fit(X_tr, y_train)
            y_pred = clf.predict(X_te)
        else:
            clf.fit(X_train, y_train)
            y_pred = clf.predict(X_test)

        acc = accuracy_score(y_test, y_pred)
        bal_acc = balanced_accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
        f05 = fbeta_score(y_test, y_pred, beta=0.5, zero_division=0)

        results[name] = {
            "accuracy": float(acc),
            "balanced_accuracy": float(bal_acc),
            "precision": float(prec),
            "recall": float(rec),
            "macro_f1": float(macro_f1),
            "f05": float(f05)
        }

        print(f"{name:<28} | {acc * 100:>8.2f}% | {bal_acc * 100:>10.2f}% | {prec * 100:>8.2f}% | {macro_f1 * 100:>8.2f}%")

        # Tiêu chí chọn: Cân bằng tốt nhất giữa bắt lỗi và nhận diện câu chuẩn
        if bal_acc > best_score:
            best_score = bal_acc
            best_model_name = name
            best_clf = clf

    print("=" * 88)
    print(f"\n🏆 Mô hình tối ưu nhất được lựa chọn: **{best_model_name}** (Balanced Accuracy = {best_score * 100:.2f}%)")

    # 4. Đánh giá chi tiết mô hình tốt nhất
    y_best_pred = best_clf.predict(X_test if best_model_name != "Complement Naive Bayes" else sp.hstack([X_test_char, X_test_word]).tocsr())
    print("\n📊 BẢNG BÁO CÁO PHÂN LOẠI CHI TIẾT (Classification Report):")
    print(classification_report(y_test, y_best_pred, target_names=["Learner (Has Error)", "Native (Correct)"]))

    cm = confusion_matrix(y_test, y_best_pred)
    print("📈 Ma trận nhầm lẫn (Confusion Matrix):")
    print(f"  [TN: {cm[0][0]:<4} FP: {cm[0][1]:<4}] (Nhãn 0: Câu có lỗi)")
    print(f"  [FN: {cm[1][0]:<4} TP: {cm[1][1]:<4}] (Nhãn 1: Câu chuẩn bản xứ)\n")

    # 5. Lưu toàn bộ mô hình và bộ vector hoá sang file joblib
    models_dir = os.path.join(CURRENT_DIR, "..", "models")
    os.makedirs(models_dir, exist_ok=True)

    saved_bundle = {
        "model_name": best_model_name,
        "classifier": best_clf,
        "char_vec": char_vec,
        "word_vec": word_vec,
        "scaler": scaler,
        "dense_extractor": dense_extractor,
        "results": results,
    }

    joblib_path = os.path.join(models_dir, "ged_model.joblib")
    joblib.dump(saved_bundle, joblib_path, compress=3)
    print(f"[+] Đã lưu gói mô hình huấn luyện vào: {joblib_path}")

    # Xuất metrics json
    metrics_path = os.path.join(models_dir, "ged_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump({
            "best_model": best_model_name,
            "metrics": results[best_model_name],
            "all_results": results,
            "num_samples": len(X_train_texts) + len(X_test_texts),
            "train_samples": len(X_train_texts),
            "test_samples": len(X_test_texts),
        }, f, indent=2, ensure_ascii=False)
    print(f"[+] Đã lưu chỉ số đánh giá vào: {metrics_path}")

    # 6. Thử nghiệm dự đoán thực tế trên các câu mẫu
    print("\n" + "=" * 70)
    print("🧪 KIỂM TRA DỰ ĐOÁN THỰC NGHIỆM TRÊN CÁC CÂU THỰC TẾ:")
    print("=" * 70)

    test_sentences = [
        # Câu có lỗi
        "The strange mans has been following me because I have been carrying his forgotten umbrella",
        "She do not has any books in her bag.",
        "He did not went to school yesterday because he was sick.",
        "I have a apple in my backpack.",
        # Câu chuẩn
        "The strange man has been following me because I have been carrying his forgotten umbrella.",
        "She does not have any books in her bag.",
        "He did not go to school yesterday because he was sick.",
        "I have an apple in my backpack."
    ]

    for sent in test_sentences:
        c_feat = char_vec.transform([sent])
        w_feat = word_vec.transform([sent])
        d_feat = scaler.transform(dense_extractor.transform([sent]))
        x_sent = sp.hstack([c_feat, w_feat, sp.csr_matrix(d_feat)]).tocsr()

        pred_class = best_clf.predict(x_sent)[0]
        prob = best_clf.predict_proba(x_sent)[0]
        
        status = "✅ CHUẨN XÁC (Correct)" if pred_class == 1 else "⚠️ PHÁT HIỆN LỖI (Error Detected)"
        confidence = prob[pred_class] * 100
        print(f"Câu: \"{sent}\"")
        print(f"  ➔ Kết quả ML: {status} (Độ tin cậy: {confidence:.1f}% | P(Correct) = {prob[1]*100:.1f}%)")
        print("-" * 70)

if __name__ == "__main__":
    main()
