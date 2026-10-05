"""
Chatbot Intent Prediction Script
Dự đoán ý định câu hỏi bằng mô hình chatbot_model.json đã huấn luyện
Cách dùng:
  python predict_chatbot.py "câu hỏi của bạn"
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

def load_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidate = os.path.join(base_dir, "..", "models", "chatbot_model.json")
    model_path = candidate if os.path.exists(candidate) else os.path.join(base_dir, "chatbot_model.json")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Chưa tìm thấy file {model_path}. Hãy chạy `python train.py` trước!")
    with open(model_path, "r", encoding="utf-8") as f:
        return json.load(f)

def predict_intent(text: str):
    model = load_model()
    vocab = model["vocabulary"]
    idf = model["idf"]
    coefs = model["coefficients"]
    intercepts = model["intercept"]
    classes = model["classes"]

    # Tiền xử lý text & sinh unigrams + bigrams
    words = text.lower().strip().split()
    tokens = list(words)
    for i in range(len(words) - 1):
        tokens.append(f"{words[i]} {words[i+1]}")

    # Tính vector TF-IDF
    num_features = len(vocab)
    tf_vector = np.zeros(num_features, dtype=np.float32)
    for t in tokens:
        if t in vocab:
            tf_vector[vocab[t]] += 1.0

    # Sublinear TF: 1 + log(tf) if tf > 0
    tf_sublinear = np.where(tf_vector > 0, 1.0 + np.log(np.maximum(tf_vector, 1.0)), 0.0)
    tfidf = tf_sublinear * np.array(idf, dtype=np.float32)

    # Chuẩn hóa L2 norm
    norm = np.linalg.norm(tfidf)
    if norm > 0:
        tfidf = tfidf / norm

    # Tính điểm số cho từng lớp: z = intercept + coef . tfidf
    scores = np.array(intercepts, dtype=np.float32) + np.dot(np.array(coefs, dtype=np.float32), tfidf)

    # Softmax để lấy xác suất
    exp_scores = np.exp(scores - np.max(scores))
    probs = exp_scores / np.sum(exp_scores)

    best_idx = int(np.argmax(probs))
    return {
        "text": text,
        "predicted_intent": classes[best_idx],
        "confidence": round(float(probs[best_idx]), 4),
        "all_probs": {cls: round(float(p), 4) for cls, p in zip(classes, probs) if p > 0.05}
    }

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "I has been waiting here since two hours"
    res = predict_intent(query)
    print(json.dumps(res, ensure_ascii=False, indent=2))
