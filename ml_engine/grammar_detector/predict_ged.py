"""
CLI Thử nghiệm Dự đoán Lỗi Ngữ pháp (Grammar Error Detection - Predict)
Tải mô hình ged_model.joblib đã huấn luyện và dự đoán bất kỳ câu tiếng Anh nào.
"""

import os
import sys
import scipy.sparse as sp
import joblib

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "..", "models", "ged_model.joblib")

def load_ged_model():
    if not os.path.exists(MODEL_PATH):
        print(f"[!] Chưa tìm thấy mô hình huấn luyện tại {MODEL_PATH}")
        print("    Vui lòng chạy 'python ml_engine/grammar_detector/train_ged.py' trước!")
        sys.exit(1)
    return joblib.load(MODEL_PATH)

def predict_sentence(text: str, bundle=None):
    if bundle is None:
        bundle = load_ged_model()

    classifier = bundle["classifier"]
    char_vec = bundle["char_vec"]
    word_vec = bundle["word_vec"]
    scaler = bundle["scaler"]
    dense_extractor = bundle["dense_extractor"]

    c_feat = char_vec.transform([text])
    w_feat = word_vec.transform([text])
    d_feat = scaler.transform(dense_extractor.transform([text]))
    x = sp.hstack([c_feat, w_feat, sp.csr_matrix(d_feat)]).tocsr()

    pred_class = classifier.predict(x)[0]
    prob = classifier.predict_proba(x)[0]

    return {
        "text": text,
        "is_correct": bool(pred_class == 1),
        "label": "Correct" if pred_class == 1 else "Has Error",
        "confidence": float(prob[pred_class]),
        "prob_correct": float(prob[1]),
        "prob_error": float(prob[0]),
    }

def main():
    bundle = load_ged_model()
    print("=" * 65)
    print(f"🧠 AFL GRAMMAR ERROR DETECTION (Mô hình: {bundle['model_name']})")
    print("=" * 65)

    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        res = predict_sentence(query, bundle)
        tag = "✅ CHUẨN XÁC" if res["is_correct"] else "⚠️ PHÁT HIỆN LỖI"
        print(f"Câu kiểm tra : \"{res['text']}\"")
        print(f"Dự đoán ML   : {tag}")
        print(f"Xác suất đúng: {res['prob_correct'] * 100:.1f}% | Xác suất lỗi: {res['prob_error'] * 100:.1f}%")
        print(f"Độ tin cậy   : {res['confidence'] * 100:.1f}%")
        return

    # Interactive mode
    print("Nhập câu tiếng Anh cần kiểm tra lỗi (hoặc 'exit' để thoát):")
    while True:
        try:
            line = input("\n👉 Nhập câu: ").strip()
            if not line or line.lower() in ("exit", "quit", "q"):
                break
            res = predict_sentence(line, bundle)
            tag = "✅ CHUẨN NGỮ PHÁP" if res["is_correct"] else "⚠️ PHÁT HIỆN LỖI NGỮ PHÁP"
            print(f"  {tag}")
            print(f"  - P(Chuẩn bản ngữ): {res['prob_correct'] * 100:.1f}%")
            print(f"  - P(Có lỗi ngữ pháp): {res['prob_error'] * 100:.1f}%")
        except (KeyboardInterrupt, EOFError):
            break

if __name__ == "__main__":
    main()
