"""
CLI Dự đoán Lộ trình Học Cá nhân hoá từ Mô hình Machine Learning
"""

import json
import os
import sys
import argparse
import numpy as np

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "learning_path_model.json"
)

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=0)

def predict_learning_path(features_dict: dict):
    with open(MODEL_PATH, "r", encoding="utf-8") as f:
        model = json.load(f)

    feature_keys = model["feature_keys"]
    scaler_mean = np.array(model["scaler"]["mean"], dtype=np.float32)
    scaler_scale = np.array(model["scaler"]["scale"], dtype=np.float32)

    # Lấy vector đặc trưng
    raw_vec = np.array([features_dict.get(k, 0.0) for k in feature_keys], dtype=np.float32)
    scaled_vec = (raw_vec - scaler_mean) / scaler_scale

    # 1. Dự đoán Cấp độ (Level)
    lvl_coef = np.array(model["level_classifier"]["coefficients"], dtype=np.float32)
    lvl_intercept = np.array(model["level_classifier"]["intercept"], dtype=np.float32)
    lvl_scores = np.dot(lvl_coef, scaled_vec) + lvl_intercept
    lvl_probs = softmax(lvl_scores)
    lvl_idx = int(np.argmax(lvl_probs))
    pred_level = model["level_classifier"]["classes"][lvl_idx]
    pred_level_conf = float(lvl_probs[lvl_idx])

    # 2. Dự đoán Trọng tâm then chốt (Primary Focus)
    focus_coef = np.array(model["focus_classifier"]["coefficients"], dtype=np.float32)
    focus_intercept = np.array(model["focus_classifier"]["intercept"], dtype=np.float32)
    focus_scores = np.dot(focus_coef, scaled_vec) + focus_intercept
    focus_probs = softmax(focus_scores)
    focus_idx = int(np.argmax(focus_probs))
    pred_focus = model["focus_classifier"]["classes"][focus_idx]
    pred_focus_conf = float(focus_probs[focus_idx])

    # 3. Dự đoán Điểm ưu tiên kỹ năng (Priority Scores)
    prio_coef = np.array(model["priority_regressor"]["coefficients"], dtype=np.float32)
    prio_intercept = np.array(model["priority_regressor"]["intercept"], dtype=np.float32)
    prio_scores = np.dot(prio_coef, scaled_vec) + prio_intercept
    priorities = {}
    for i, target in enumerate(model["priority_regressor"]["targets"]):
        priorities[target] = round(float(np.clip(prio_scores[i], 0.0, 100.0)), 1)

    # 4. Lộ trình đề xuất từ Curriculum
    roadmap = model["curriculum_roadmap"].get(pred_focus, {})

    return {
        "level": pred_level,
        "level_confidence": round(pred_level_conf * 100, 1),
        "primary_focus": pred_focus,
        "focus_confidence": round(pred_focus_conf * 100, 1),
        "priorities": priorities,
        "roadmap": roadmap,
    }

def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    # Ví dụ một học viên làm 12 câu: 4 câu đọc đúng (100%), 8 câu sắp xếp sai (0%)
    sample_student = {
        "total_attempted": 12,
        "overall_accuracy": 0.3333,
        "tense_accuracy": 0.0,
        "syntax_accuracy": 0.0,
        "reading_accuracy": 1.0,
        "listening_accuracy": 0.0,
        "adv_grammar_accuracy": 0.0,
        "vocab_accuracy": 0.0,
        "tense_has_attempted": 0.0,
        "syntax_has_attempted": 1.0,
        "reading_has_attempted": 1.0,
        "listening_has_attempted": 0.0,
        "adv_grammar_has_attempted": 0.0,
        "vocab_has_attempted": 0.0,
        "tense_errors": 0,
        "syntax_errors": 8,
        "reading_errors": 0,
        "listening_errors": 0,
        "adv_grammar_errors": 0,
        "vocab_errors": 0,
        "avg_attempts": 1.5,
    }

    result = predict_learning_path(sample_student)
    print("=" * 60)
    print("KẾT QUẢ DỰ ĐOÁN LỘ TRÌNH HỌC CÁ NHÂN HOÁ (AI LEARNING PATH)")
    print("=" * 60)
    print(f"Trình độ ước tính: {result['level']} ({result['level_confidence']}%)")
    print(f"Trọng tâm cần cải thiện nhất: {result['primary_focus']} ({result['focus_confidence']}%)")
    print("Điểm cấp thiết ưu tiên từng mảng kỹ năng:")
    for k, v in result['priorities'].items():
        print(f"  - {k}: {v}/100")
    print("\nLộ trình đề xuất:")
    print(f"  Tiêu đề: {result['roadmap'].get('title')}")
    print(f"  Mô tả: {result['roadmap'].get('description')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
