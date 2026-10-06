"""
Bộ sinh tập dữ liệu huấn luyện Lộ trình Học Cá nhân hoá (Personalized Learning Path Dataset) v2.0
Hỗ trợ cả hồ sơ đầy đủ lẫn hồ sơ thưa (Sparse/Cold-Start Profiles khi người học mới làm 1-2 kỹ năng).
"""

import json
import os
import random
import sys
import numpy as np

OUTPUT_DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "..", "datasets", "learning_path_dataset.json"
)

FOCUS_CLASSES = [
    "tense_mastery",             # Củng cố 12 thì căn bản
    "sentence_structure",        # Cấu trúc câu & trật tự từ
    "listening_comprehension",   # Kỹ năng nghe & phản xạ
    "advanced_grammar",          # Ngữ pháp mở rộng (bị động, điều kiện, quan hệ)
    "vocabulary_expansion",      # Mở rộng vốn từ vựng học thuật
    "comprehensive_practice",    # Luyện đề tổng hợp & hoàn thiện kỹ năng
]

LEVEL_CLASSES = ["Foundation", "Intermediate", "Advanced"]

def generate_profile(rng: random.Random) -> dict:
    mode = rng.choice(["full", "sparse", "single_weakness"])
    
    # 6 mảng kỹ năng
    skills = ["tense", "syntax", "reading", "listening", "adv_grammar", "vocab"]
    
    attempts = {}
    corrects = {}
    
    if mode == "sparse":
        # Học viên mới làm 1-3 mảng kỹ năng
        active_skills = rng.sample(skills, k=rng.randint(1, 3))
        weak_skill = rng.choice(active_skills)
        for s in skills:
            if s in active_skills:
                total_s = rng.randint(4, 25)
                attempts[s] = total_s
                if s == weak_skill:
                    acc = rng.uniform(0.0, 0.40) # Rất yếu kỹ năng này
                else:
                    acc = rng.uniform(0.65, 1.0)
                corrects[s] = int(round(total_s * acc))
            else:
                attempts[s] = 0
                corrects[s] = 0
                
    elif mode == "single_weakness":
        # Làm nhiều kỹ năng nhưng có 1 kỹ năng bị sai nổi bật
        weak_skill = rng.choice(skills)
        for s in skills:
            total_s = rng.randint(8, 40)
            attempts[s] = total_s
            if s == weak_skill:
                acc = rng.uniform(0.10, 0.45)
            else:
                acc = rng.uniform(0.60, 0.95)
            corrects[s] = int(round(total_s * acc))
            
    else: # full
        # Học viên làm đều các kỹ năng
        weak_skill = rng.choice(skills + ["none"])
        for s in skills:
            total_s = rng.randint(15, 50)
            attempts[s] = total_s
            if s == weak_skill:
                acc = rng.uniform(0.15, 0.45)
            elif weak_skill == "none":
                acc = rng.uniform(0.75, 0.98) # Học viên giỏi
            else:
                acc = rng.uniform(0.55, 0.90)
            corrects[s] = int(round(total_s * acc))

    total_attempted = sum(attempts.values())
    total_correct = sum(corrects.values())
    total_incorrect = total_attempted - total_correct
    overall_acc = total_correct / total_attempted if total_attempted > 0 else 0.5

    # Tính độ chính xác & số lỗi từng mảng
    accs = {}
    errs = {}
    has_attempted = {}
    for s in skills:
        t = attempts[s]
        c = corrects[s]
        has_attempted[s] = 1.0 if t > 0 else 0.0
        accs[s] = c / t if t > 0 else 0.0
        errs[s] = t - c

    # Xác định Primary Focus dựa trên số lỗi THỰC TẾ và tỷ lệ sai
    skill_penalty = {}
    for s in skills:
        if attempts[s] > 0:
            # Ưu tiên kỹ năng có câu sai thật sự
            err_ratio = (attempts[s] - corrects[s]) / attempts[s]
            skill_penalty[s] = err_ratio * 70.0 + min(errs[s], 15) * 2.0
        else:
            # Chưa làm thì penalty thấp (chỉ là cần làm test, không phải lỗ hổng khẩn cấp)
            skill_penalty[s] = 15.0

    # Tìm kỹ năng cần cải thiện nhất
    focus_map = {
        "tense": "tense_mastery",
        "syntax": "sentence_structure",
        "reading": "comprehensive_practice",
        "listening": "listening_comprehension",
        "adv_grammar": "advanced_grammar",
        "vocab": "vocabulary_expansion",
    }
    
    worst_skill = max(skill_penalty, key=skill_penalty.get)
    if overall_acc >= 0.85 and total_attempted >= 30:
        primary_focus = "comprehensive_practice"
        level = "Advanced"
    elif overall_acc >= 0.65:
        primary_focus = focus_map[worst_skill]
        level = "Intermediate"
    else:
        primary_focus = focus_map[worst_skill]
        level = "Foundation"

    # Tính điểm ưu tiên từng mảng (Priority Scores: 0 -> 100)
    # QUY TẮC CỐT LÕI: Kỹ năng có câu sai nhiều -> Điểm cao. Kỹ năng chưa làm -> Điểm trung tính thấp (25-35).
    priorities = {}
    for s in skills:
        if attempts[s] > 0:
            err_rate = (attempts[s] - corrects[s]) / attempts[s]
            prio = err_rate * 85.0 + min(errs[s], 10) * 1.5
            priorities[f"priority_{s}"] = round(float(np.clip(prio, 10.0, 100.0)), 1)
        else:
            priorities[f"priority_{s}"] = round(float(rng.uniform(20.0, 35.0)), 1)

    avg_attempts = round(rng.uniform(1.1, 2.5), 2)

    return {
        "features": {
            "total_attempted": total_attempted,
            "overall_accuracy": round(overall_acc, 4),
            "tense_accuracy": round(accs["tense"], 4),
            "syntax_accuracy": round(accs["syntax"], 4),
            "reading_accuracy": round(accs["reading"], 4),
            "listening_accuracy": round(accs["listening"], 4),
            "adv_grammar_accuracy": round(accs["adv_grammar"], 4),
            "vocab_accuracy": round(accs["vocab"], 4),
            "tense_has_attempted": has_attempted["tense"],
            "syntax_has_attempted": has_attempted["syntax"],
            "reading_has_attempted": has_attempted["reading"],
            "listening_has_attempted": has_attempted["listening"],
            "adv_grammar_has_attempted": has_attempted["adv_grammar"],
            "vocab_has_attempted": has_attempted["vocab"],
            "tense_errors": errs["tense"],
            "syntax_errors": errs["syntax"],
            "reading_errors": errs["reading"],
            "listening_errors": errs["listening"],
            "adv_grammar_errors": errs["adv_grammar"],
            "vocab_errors": errs["vocab"],
            "avg_attempts": avg_attempts,
        },
        "targets": {
            "learner_level": level,
            "primary_focus": primary_focus,
            "priority_tense": priorities["priority_tense"],
            "priority_syntax": priorities["priority_syntax"],
            "priority_reading": priorities["priority_reading"],
            "priority_listening": priorities["priority_listening"],
            "priority_adv_grammar": priorities["priority_adv_grammar"],
            "priority_vocab": priorities["priority_vocab"],
        }
    }

def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    rng = random.Random(42)
    records = []
    for _ in range(3000):
        records.append(generate_profile(rng))

    os.makedirs(os.path.dirname(OUTPUT_DATASET_PATH), exist_ok=True)
    with open(OUTPUT_DATASET_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "version": "2.0",
            "total_samples": len(records),
            "level_classes": LEVEL_CLASSES,
            "focus_classes": FOCUS_CLASSES,
            "records": records,
        }, f, ensure_ascii=False, indent=2)

    print(f"[OK] Da tao thanh cong {len(records)} mau du lieu chuan hoa v2.0 tai: {OUTPUT_DATASET_PATH}")

if __name__ == "__main__":
    main()
