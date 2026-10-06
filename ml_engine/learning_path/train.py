"""
Mô hình Machine Learning Huấn luyện Lộ trình Học Cá nhân hoá (Personalized Learning Path)
Sử dụng scikit-learn để huấn luyện:
1. Level Classifier (Foundation / Intermediate / Advanced)
2. Primary Focus Classifier (Nhận diện điểm yếu then chốt)
3. Priority Score Regressor (Tính điểm ưu tiên cho từng mảng kỹ năng)
Xuất trọng số sang ml_engine/models/learning_path_model.json để TypeScript suy luận trong 0ms.
"""

import json
import os
import sys
import numpy as np
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import classification_report, r2_score, mean_absolute_error

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "..", "datasets", "learning_path_dataset.json"
)
OUTPUT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "learning_path_model.json"
)

FEATURE_KEYS = [
    "total_attempted",
    "overall_accuracy",
    "tense_accuracy",
    "syntax_accuracy",
    "reading_accuracy",
    "listening_accuracy",
    "adv_grammar_accuracy",
    "vocab_accuracy",
    "tense_has_attempted",
    "syntax_has_attempted",
    "reading_has_attempted",
    "listening_has_attempted",
    "adv_grammar_has_attempted",
    "vocab_has_attempted",
    "tense_errors",
    "syntax_errors",
    "reading_errors",
    "listening_errors",
    "adv_grammar_errors",
    "vocab_errors",
    "avg_attempts",
]

PRIORITY_KEYS = [
    "priority_tense",
    "priority_syntax",
    "priority_reading",
    "priority_listening",
    "priority_adv_grammar",
    "priority_vocab",
]

# Ánh xạ lộ trình học cụ thể trên web LearnSphere
CURRICULUM_ROADMAP = {
    "tense_mastery": {
        "title": "Chinh phục 12 Thì & Ngữ pháp Nền tảng",
        "description": "Tập trung củng cố bản chất các thì cơ bản nhất, xóa bỏ nhầm lẫn giữa quá khứ, hiện tại và tương lai.",
        "stage_1": {
            "name": "Khắc phục lỗ hổng thì hiện tại & quá khứ",
            "lessons": [
                {"type": "grammar", "slug": "present-simple", "title": "Present Simple (Hiện tại đơn)", "action": "/ngu-phap/present-simple"},
                {"type": "grammar", "slug": "past-simple", "title": "Past Simple (Quá khứ đơn)", "action": "/ngu-phap/past-simple"},
                {"type": "practice", "id": "ex-01", "title": "Trắc nghiệm 12 thì cơ bản", "action": "/luyen-tap/ex-01"},
            ]
        },
        "stage_2": {
            "name": "Hoàn thiện các thì hoàn thành & tiếp diễn",
            "lessons": [
                {"type": "grammar", "slug": "present-perfect", "title": "Present Perfect (Hiện tại hoàn thành)", "action": "/ngu-phap/present-perfect"},
                {"type": "grammar", "slug": "past-continuous", "title": "Past Continuous (Quá khứ tiếp diễn)", "action": "/ngu-phap/past-continuous"},
                {"type": "practice", "id": "ex-02", "title": "Điền từ dạng động từ", "action": "/luyen-tap/ex-02"},
            ]
        },
        "stage_3": {
            "name": "Ứng dụng thì nâng cao & viết câu chuẩn",
            "lessons": [
                {"type": "grammar", "slug": "future-perfect", "title": "Future Perfect (Tương lai hoàn thành)", "action": "/ngu-phap/future-perfect"},
                {"type": "practice", "id": "ex-04", "title": "Sắp xếp câu chuẩn thì", "action": "/luyen-tap/ex-04"},
            ]
        }
    },
    "sentence_structure": {
        "title": "Làm chủ Cấu trúc Câu & Trật tự Từ",
        "description": "Tập trung giải quyết điểm yếu đặt câu sai trật tự, thiếu thành phần câu hoặc lúng túng khi ghép từ.",
        "stage_1": {
            "name": "Củng cố trật tự từ cơ bản S-V-O",
            "lessons": [
                {"type": "grammar", "slug": "gerund-infinitive", "title": "Gerund & Infinitive (V-ing / To V)", "action": "/ngu-phap/gerund-infinitive"},
                {"type": "practice", "id": "ex-04", "title": "Luyện sắp xếp câu cấp độ 1", "action": "/luyen-tap/ex-04"},
            ]
        },
        "stage_2": {
            "name": "Nâng cấp câu phức & liên từ",
            "lessons": [
                {"type": "grammar", "slug": "relative-clauses", "title": "Relative Clauses (Mệnh đề quan hệ)", "action": "/ngu-phap/relative-clauses"},
                {"type": "grammar", "slug": "comparisons", "title": "Comparisons (So sánh hơn & nhất)", "action": "/ngu-phap/comparisons"},
                {"type": "practice", "id": "ex-02", "title": "Điền từ nối câu", "action": "/luyen-tap/ex-02"},
            ]
        },
        "stage_3": {
            "name": "Viết câu chuẩn học thuật & bài luận",
            "lessons": [
                {"type": "grammar", "slug": "passive-voice", "title": "Passive Voice (Câu bị động)", "action": "/ngu-phap/passive-voice"},
                {"type": "practice", "id": "ex-writing", "title": "Chấm bài viết với AI (AES)", "action": "/luyen-tap"},
            ]
        }
    },
    "listening_comprehension": {
        "title": "Tăng cường Kỹ năng Nghe & Phản xạ Âm thanh",
        "description": "Khắc phục điểm yếu nghe bắt từ, luyện tập nhận diện trọng âm và ngữ điệu tự nhiên.",
        "stage_1": {
            "name": "Luyện nghe từ đơn & cụm từ giao tiếp",
            "lessons": [
                {"type": "practice", "id": "ex-03", "title": "Nghe - chọn đáp án cơ bản", "action": "/luyen-tap/ex-03"},
                {"type": "vocab", "slug": "daily", "title": "Từ vựng có âm thanh phát âm", "action": "/tu-vung"},
            ]
        },
        "stage_2": {
            "name": "Nghe hiểu câu hoàn chỉnh theo ngữ cảnh",
            "lessons": [
                {"type": "phrase", "slug": "mau-cau", "title": "Luyện nghe mẫu câu giao tiếp", "action": "/mau-cau"},
                {"type": "practice", "id": "ex-listen-2", "title": "Nghe chọn ý chính", "action": "/luyen-tap"},
            ]
        },
        "stage_3": {
            "name": "Thực hành phản xạ & ngữ điệu bản xứ",
            "lessons": [
                {"type": "practice", "id": "ex-listen-exam", "title": "Bài luyện nghe tổng hợp", "action": "/luyen-tap"},
            ]
        }
    },
    "advanced_grammar": {
        "title": "Làm chủ Ngữ pháp Nâng cao & Bẫy Đề thi",
        "description": "Nâng cao năng lực ngữ pháp học thuật, tập trung vào câu điều kiện hỗn hợp, câu gián tiếp và đảo ngữ.",
        "stage_1": {
            "name": "Câu điều kiện & Thể giả định",
            "lessons": [
                {"type": "grammar", "slug": "conditionals", "title": "Conditionals (Câu điều kiện loại 0-1-2-3)", "action": "/ngu-phap/conditionals"},
                {"type": "grammar", "slug": "modal-verbs", "title": "Modal Verbs (Động từ khuyết thiếu)", "action": "/ngu-phap/modal-verbs"},
            ]
        },
        "stage_2": {
            "name": "Câu gián tiếp & Câu bị động đặc biệt",
            "lessons": [
                {"type": "grammar", "slug": "reported-speech", "title": "Reported Speech (Câu tường thuật)", "action": "/ngu-phap/reported-speech"},
                {"type": "grammar", "slug": "passive-voice", "title": "Passive Voice (Bị động nâng cao)", "action": "/ngu-phap/passive-voice"},
            ]
        },
        "stage_3": {
            "name": "Đảo ngữ & Cấu trúc điểm cao",
            "lessons": [
                {"type": "grammar", "slug": "inversion", "title": "Inversion (Cấu trúc đảo ngữ)", "action": "/ngu-phap/inversion"},
                {"type": "practice", "id": "ex-01", "title": "Trắc nghiệm ngữ pháp khó", "action": "/luyen-tap/ex-01"},
            ]
        }
    },
    "vocabulary_expansion": {
        "title": "Mở rộng Vốn Từ vựng & Collocations",
        "description": "Tăng cường vốn từ vựng học thuật CEFR B1-C1 và các cụm từ tự nhiên giúp làm bài nhanh và chính xác.",
        "stage_1": {
            "name": "Củng cố từ vựng cơ bản theo chủ đề",
            "lessons": [
                {"type": "vocab", "slug": "daily", "title": "Học từ vựng theo ngày với Flashcard", "action": "/ca-nhan/tu-vung-theo-ngay"},
                {"type": "practice", "id": "ex-02", "title": "Điền từ theo ngữ cảnh", "action": "/luyen-tap/ex-02"},
            ]
        },
        "stage_2": {
            "name": "Học cụm từ cố định (Collocations & Idioms)",
            "lessons": [
                {"type": "phrase", "slug": "mau-cau", "title": "Kho mẫu câu & cụm từ ứng dụng", "action": "/mau-cau"},
                {"type": "vocab", "slug": "tu-vung", "title": "Bộ từ vựng nâng cao CEFR B2", "action": "/tu-vung"},
            ]
        },
        "stage_3": {
            "name": "Thực chiến đọc hiểu & ứng dụng từ vựng",
            "lessons": [
                {"type": "practice", "id": "ex-reading", "title": "Bài đọc hiểu tổng hợp", "action": "/luyen-tap"},
            ]
        }
    },
    "comprehensive_practice": {
        "title": "Luyện đề Tổng hợp & Bứt phá Điểm số",
        "description": "Học viên đã có nền tảng vững chắc, tập trung rèn luyện phản xạ với bài thi tổng hợp và bài viết học thuật.",
        "stage_1": {
            "name": "Luyện đề trắc nghiệm tổng hợp",
            "lessons": [
                {"type": "practice", "id": "ex-01", "title": "Đề thi trắc nghiệm tổng hợp 4 kỹ năng", "action": "/luyen-tap/ex-01"},
            ]
        },
        "stage_2": {
            "name": "Thực hành viết bài luận ngắn (50-150 từ)",
            "lessons": [
                {"type": "practice", "id": "ex-writing", "title": "Viết luận & Chấm điểm tự động AI", "action": "/luyen-tap"},
            ]
        },
        "stage_3": {
            "name": "Thử thách đạt điểm số tuyệt đối",
            "lessons": [
                {"type": "practice", "id": "all", "title": "Chinh phục huy hiệu Perfect 10", "action": "/luyen-tap"},
            ]
        }
    }
}

def train():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    print("[1/4] Dang nap tap du lieu...")
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = data["records"]
    level_classes = data["level_classes"]
    focus_classes = data["focus_classes"]

    X = np.array([[r["features"][k] for k in FEATURE_KEYS] for r in records], dtype=np.float32)
    y_level = np.array([level_classes.index(r["targets"]["learner_level"]) for r in records], dtype=np.int32)
    y_focus = np.array([focus_classes.index(r["targets"]["primary_focus"]) for r in records], dtype=np.int32)
    y_priorities = np.array([[r["targets"][k] for k in PRIORITY_KEYS] for r in records], dtype=np.float32)

    # 1. Feature Scaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 2. Level Classifier (Logistic Regression)
    print("[2/4] Huan luyen Level Classifier...")
    clf_level = LogisticRegression(max_iter=1000, C=2.0, random_state=42)
    clf_level.fit(X_scaled, y_level)
    cv_level = cross_val_score(clf_level, X_scaled, y_level, cv=5)
    print(f"   -> Do chinh xac Level Classifier (5-fold CV): {cv_level.mean() * 100:.2f}% (+/- {cv_level.std() * 100:.2f}%)")

    # 3. Focus Area Classifier (Logistic Regression Multi-class)
    print("[3/4] Huan luyen Focus Classifier...")
    clf_focus = LogisticRegression(max_iter=1000, C=3.0, random_state=42)
    clf_focus.fit(X_scaled, y_focus)
    cv_focus = cross_val_score(clf_focus, X_scaled, y_focus, cv=5)
    print(f"   -> Do chinh xac Focus Classifier (5-fold CV): {cv_focus.mean() * 100:.2f}% (+/- {cv_focus.std() * 100:.2f}%)")

    # 4. Priority Scores Regressor (Ridge Regression)
    print("[4/4] Huan luyen Priority Score Regressors...")
    reg_priorities = Ridge(alpha=1.0)
    reg_priorities.fit(X_scaled, y_priorities)
    preds_priorities = reg_priorities.predict(X_scaled)
    r2_p = r2_score(y_priorities, preds_priorities)
    mae_p = mean_absolute_error(y_priorities, preds_priorities)
    print(f"   -> Priority Regressor R2: {r2_p:.4f}, MAE: {mae_p:.2f} diem")

    # 5. Xuất model bundle sang JSON
    model_bundle = {
        "model_name": "LearnSphere_Adaptive_Learning_Path_Engine",
        "version": "1.0",
        "feature_keys": FEATURE_KEYS,
        "scaler": {
            "mean": scaler.mean_.tolist(),
            "scale": scaler.scale_.tolist(),
        },
        "level_classifier": {
            "classes": level_classes,
            "coefficients": clf_level.coef_.tolist(),
            "intercept": clf_level.intercept_.tolist(),
            "cv_accuracy": round(float(cv_level.mean()), 4),
        },
        "focus_classifier": {
            "classes": focus_classes,
            "coefficients": clf_focus.coef_.tolist(),
            "intercept": clf_focus.intercept_.tolist(),
            "cv_accuracy": round(float(cv_focus.mean()), 4),
        },
        "priority_regressor": {
            "targets": PRIORITY_KEYS,
            "coefficients": reg_priorities.coef_.tolist(),
            "intercept": reg_priorities.intercept_.tolist(),
            "r2_score": round(float(r2_p), 4),
        },
        "curriculum_roadmap": CURRICULUM_ROADMAP,
    }

    os.makedirs(os.path.dirname(OUTPUT_MODEL_PATH), exist_ok=True)
    with open(OUTPUT_MODEL_PATH, "w", encoding="utf-8") as f:
        json.dump(model_bundle, f, ensure_ascii=False, indent=2)

    print(f"[OK] Da xuat model bundle thanh cong sang: {OUTPUT_MODEL_PATH}")

if __name__ == "__main__":
    train()
