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
from data_utils import (
    LABEL_CORRECT,
    LABEL_ERROR,
    dedupe_records,
    dedupe_key,
    fingerprint,
    get_run_seed,
    run_timestamp,
    stratified_sample,
)

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

def _load_jfleg_records() -> list[dict]:
    """Đọc JFLEG gốc, sinh record phẳng theo format chuẩn."""
    jfleg_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "jfleg_dataset.json")

    print(f"[!] Không tìm thấy combined dataset, dùng JFLEG gốc.")
    if not os.path.exists(jfleg_path):
        raise FileNotFoundError(f"Không tìm thấy JFLEG tại: {jfleg_path}")

    with open(jfleg_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    for item in data:
        orig = (item.get("original") or "").strip()
        if not orig or len(orig) <= 5:
            continue

        records.append({"text": orig, "label": LABEL_ERROR, "source": "jfleg"})

        for corr in item.get("corrections", []):
            clean = (corr or "").strip()
            if clean and clean != orig and len(clean) > 5:
                records.append({"text": clean, "label": LABEL_CORRECT, "source": "jfleg_corrected"})

    print(f"[✓] JFLEG gốc: {len(records):,} bản ghi")
    return records


def _load_combined_records() -> list[dict] | None:
    """Đọc ged_combined_dataset.json nếu tồn tại."""
    combined_path = os.path.join(
        os.path.dirname(__file__), "..", "datasets", "ged_combined_dataset.json"
    )
    if not os.path.exists(combined_path):
        return None

    print(f"[✓] Dùng Combined Dataset: {combined_path}")
    with open(combined_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    for item in data:
        text = item.get("text")
        if not isinstance(text, str):
            continue
        records.append({
            "text": text,
            "label": int(item.get("label", LABEL_ERROR)),
            "source": item.get("source", "unknown"),
        })
    return records


def load_combined_dataset():
    """Tải + làm sạch + lấy mẫu NGẪU NHIÊN THEO SEED CHO MỖI LẦN CHẠY.

    Quy trình:
      1. Đọc combined dataset (hoặc fallback JFLEG).
      2. Dedup theo text đã chuẩn hoá + loại nhóm xung đột nhãn.
      3. Sinh seed KHÁC NHAU mỗi lần chạy (trừ khi ép cứng qua GED_RUN_SEED).
      4. Lấy mẫu cân bằng theo nhãn với seed đó.
      5. Tách train/test 80/20 với CÙNG seed để tái lập được.

    Nhờ bước 3-4, mỗi lần `npm run ml:train:ged` sẽ dùng tập dữ liệu khác nhau.
    """
    records = _load_combined_records()
    if records is None:
        records = _load_jfleg_records()

    # ── 1. DEDUP + xử lý xung đột nhãn ──
    print("\n" + "=" * 70)
    print("🧹 LÀM SẠCH DỮ LIỆU (dedup + xung đột nhãn)")
    print("=" * 70)

    unique, dedup_stats = dedupe_records(records)

    print(f"  Tổng bản ghi đọc vào : {dedup_stats['input_rows']:,}")
    print(f"  - Rỗng/quá ngắn     : {dedup_stats['dropped_empty']:,}")
    print(f"  - Trùng lặp         : {dedup_stats['dropped_duplicate']:,}")
    print(f"  - Xung đột nhãn     : {dedup_stats['dropped_conflict']:,}")
    print(f"  Còn lại (sạch)      : {dedup_stats['output_rows']:,}")

    if dedup_stats["output_rows"] == 0:
        raise ValueError("Không còn dữ liệu hợp lệ sau khi dedup.")

    # ── 2. SEED KHÁC NHAU CHO MỖI LẦN CHẠY ──
    run_seed, seed_is_fixed = get_run_seed()

    print("\n" + "=" * 70)
    print("🎲 SEED & LẤY MẪU CHO LẦN CHẠY NÀY")
    print("=" * 70)
    print(f"  Run seed    : {run_seed} {'(ép cứng → lần chạy sẽ GIỐNG NHAU)' if seed_is_fixed else '(ngẫu nhiên → dữ liệu KHÁC mọi lần chạy)'}")

    # ── 3. LẤY MẪU theo seed ──
    max_samples_env = os.environ.get("GED_MAX_SAMPLES", "").strip()
    max_samples = int(max_samples_env) if max_samples_env.isdigit() else None

    sampled, sample_stats = stratified_sample(unique, seed=run_seed, max_samples=max_samples)

    print(f"  Khả dụng (đã dedup) : {sample_stats['total_available']:,}")
    print(f"  Chọn cho lần chạy này: {sample_stats['total_selected']:,}")
    print(f"    - Có lỗi (label 0): {sample_stats['error_count']:,}")
    print(f"    - Chuẩn  (label 1): {sample_stats['correct_count']:,}")
    print("  Theo nguồn (đã chọn):")
    for src, cnt in sample_stats["selected_by_source"].items():
        print(f"    - {src}: {cnt:,}")

    texts = [r["text"] for r in sampled]
    labels = np.array([r["label"] for r in sampled], dtype=np.int32)

    if len(set(labels.tolist())) < 2:
        raise ValueError("Dữ liệu chỉ còn 1 nhãn, không thể huấn luyện.")

    # ── 4. TÁCH TRAIN/TEST với cùng seed ──
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=run_seed, stratify=labels
    )

    run_info = {
        "timestamp": run_timestamp(),
        "run_seed": run_seed,
        "seed_is_fixed": seed_is_fixed,
        "dedup": dedup_stats,
        "sampling": sample_stats,
        "fingerprint_all": fingerprint(texts),
        "fingerprint_train": fingerprint(X_train),
        "fingerprint_test": fingerprint(X_test),
        "train_size": len(X_train),
        "test_size": len(X_test),
    }

    print(f"\n  Fingerprint tập train: {run_info['fingerprint_train']}")
    print(f"  Fingerprint tập test : {run_info['fingerprint_test']}")

    return X_train, y_train, X_test, y_test, run_info


def _history_path() -> str:
    return os.path.join(CURRENT_DIR, "..", "models", "ged_runs_history.json")


def _load_history() -> list[dict]:
    path = _history_path()
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _warn_if_repeated_run(run_info: dict) -> None:
    """Cảnh báo nếu tập train trùng khớp với một lần chạy trước."""
    history = _load_history()
    fp = run_info["fingerprint_train"]

    duplicates = [h for h in history if h.get("fingerprint_train") == fp]

    if duplicates:
        last = duplicates[-1]
        print("=" * 70)
        print("⚠️  CẢNH BÁO: DỮ LIỆU TRAIN TRÙNG LẶP VỚI LẦN CHẠY TRƯỚC!")
        print(f"    Lần trước : {last.get('timestamp')} (seed={last.get('run_seed')})")
        print(f"    Lần này   : {run_info['timestamp']} (seed={run_info['run_seed']})")
        print("    → Nguyên nhân: có thể đã đặt GED_RUN_SEED cố định.")
        print("    → Cần dùng seed NGẪU NHIÊN (bỏ biến GED_RUN_SEED) để mỗi lần train khác nhau.")
        print("=" * 70)
    elif history:
        print(f"✅ Dữ liệu lần này KHÁC {len(history)} lần chạy trước (fingerprint độc nhất).")

    run_info["is_repeat_of_previous_run"] = bool(duplicates)
    run_info["previous_matching_runs"] = len(duplicates)


def _save_run_history(run_info: dict) -> None:
    """Lưu lịch sử các lần chạy để so sánh về sau."""
    models_dir = os.path.join(CURRENT_DIR, "..", "models")
    os.makedirs(models_dir, exist_ok=True)

    history = _load_history()
    history.append(run_info)

    # Giữ 50 lần chạy gần nhất
    history = history[-50:]

    with open(_history_path(), "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

def main():
    print("=" * 70)
    print("🚀 BẮT ĐẦU HUẤN LUYỆN MÔ HÌNH GED v2 — COMBINED DATASET")
    print("=" * 70)

    X_train_texts, y_train, X_test_texts, y_test, run_info = load_combined_dataset()
    print(f"[*] Tập Huấn luyện: {len(X_train_texts):,} câu (Lỗi: {np.sum(y_train == 0):,}, Đúng: {np.sum(y_train == 1):,})")
    print(f"[*] Tập Kiểm tra  : {len(X_test_texts):,} câu (Lỗi: {np.sum(y_test == 0):,}, Đúng: {np.sum(y_test == 1):,})\n")

    # Cảnh báo nếu dữ liệu lặp lại y hệt một lần chạy trước
    _warn_if_repeated_run(run_info)

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

    # B. Word N-grams (1-3 grams): Bắt từ đơn bất thường & cụm kết hợp từ
    print("[2/3] Đang vector hoá Word N-grams (1-3 gram)...")
    word_vec = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=4000,
        sublinear_tf=True,
        min_df=2,
    )
    X_train_word = word_vec.fit_transform(X_train_texts)
    X_test_word = word_vec.transform(X_test_texts)

    # C. Dense Heuristic Syntax Features
    print("[3/3] Đang trích xuất đặc trưng cú pháp & dị thường ngữ pháp ESL v3...")
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

    # 3. Huấn luyện và so sánh các mô hình Machine Learning (sử dụng 100% đặc trưng composite)
    from sklearn.ensemble import VotingClassifier

    from sklearn.linear_model import SGDClassifier

    models = {
        "Logistic Regression (L2, C=1.5)": LogisticRegression(C=1.5, max_iter=1500, class_weight="balanced", random_state=42),
        "Logistic Regression (L2, C=3.0)": LogisticRegression(C=3.0, max_iter=1500, class_weight="balanced", random_state=42),
        "Linear SVM (Calibrated)": CalibratedClassifierCV(
            estimator=LinearSVC(C=0.5, class_weight="balanced", dual="auto", max_iter=5000, random_state=42),
            method="sigmoid",
            cv=3
        ),
        "SGD Classifier (Log Loss)": SGDClassifier(
            loss="log_loss",
            alpha=1e-4,
            max_iter=2000,
            class_weight="balanced",
            random_state=42
        )
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

        if bal_acc > best_score:
            best_score = bal_acc
            best_model_name = name
            best_clf = clf

    print("=" * 88)
    print(f"\n🏆 Mô hình tối ưu nhất được lựa chọn: **{best_model_name}** (Balanced Accuracy = {best_score * 100:.2f}%)")

    # 4. Đánh giá chi tiết mô hình tốt nhất
    y_best_pred = best_clf.predict(X_test)
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
            "data_run": run_info,
        }, f, indent=2, ensure_ascii=False)
    print(f"[+] Đã lưu chỉ số đánh giá vào: {metrics_path}")

    # Lưu lịch sử lần chạy (seed + fingerprint) để so sánh các lần train
    _save_run_history(run_info)
    print(f"[+] Đã ghi lịch sử lần chạy vào: {_history_path()}")

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
