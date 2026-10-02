"""
Inference script: Chấm điểm bài viết bất kỳ bằng mô hình ML đã huấn luyện
Cách dùng:
  python predict.py
hoặc truyền bài viết qua code/import
"""

import os
import json
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from feature_extractor import NLPFeatureExtractor
except ImportError:
    from ml_engine.feature_extractor import NLPFeatureExtractor

def load_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(base_dir, "model_weights.json")
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Chưa tìm thấy file {weights_path}. Hãy chạy python train.py trước!")
    with open(weights_path, "r", encoding="utf-8") as f:
        return json.load(f)

def predict_essay(text: str):
    model = load_model()
    extractor = NLPFeatureExtractor()
    features = extractor.extract(text)

    names = model["feature_names"]
    means = model["scaler"]["mean"]
    scales = model["scaler"]["scale"]
    coefs = model["coefficients"]
    intercept = model["intercept"]

    # Áp dụng chuẩn hóa: z = (x - mean) / scale
    # Dự đoán: y = intercept + sum(coef * z)
    score_pred = intercept
    contributions = {}

    for name, mean, scale, coef in zip(names, means, scales, coefs):
        val = features[name]
        z = (val - mean) / scale if scale != 0 else 0.0
        contrib = coef * z
        score_pred += contrib
        contributions[name] = round(contrib, 2)

    # Giới hạn điểm số từ 0 đến 100
    final_score = int(round(max(0.0, min(100.0, score_pred))))

    if final_score >= 85:
        level = "Xuất sắc"
    elif final_score >= 70:
        level = "Tốt"
    elif final_score >= 50:
        level = "Đạt"
    else:
        level = "Chưa đạt"

    return {
        "score": final_score,
        "level": level,
        "features": features,
        "feature_contributions": contributions,
    }

if __name__ == "__main__":
    sample_text = (
        "In modern society, artificial intelligence plays an indispensable role across diverse industries. "
        "Furthermore, automated technologies enhance operational productivity and facilitate data-driven decision making. "
        "However, organizations must implement robust ethical protocols to mitigate algorithmic bias and preserve human oversight."
    )
    print("[-] Đang chạy thử nghiệm chấm bài viết mẫu:")
    print(f"'{sample_text}'\n")
    res = predict_essay(sample_text)
    print("=" * 50)
    print(f"  Điểm dự đoán ML: {res['score']}/100 ({res['level']})")
    print("=" * 50)
    print("[*] Các đặc trưng ngôn ngữ trích xuất được:")
    for k, v in res["features"].items():
        print(f"  • {k:<22}: {v}")
    print("\n[*] Đóng góp điểm số của từng đặc trưng (XAI):")
    for k, v in res["feature_contributions"].items():
        sign = "+" if v >= 0 else ""
        print(f"  • {k:<22}: {sign}{v} điểm")
