"""
Tự động kết hợp dữ liệu hội thoại tiếng Anh với 1.501 câu của người học từ bộ JFLEG
để mở rộng tập huấn luyện chatbot_dataset.json lên quy mô lớn.
"""

import json
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    datasets_dir = os.path.join(base_dir, "..", "datasets")
    os.makedirs(datasets_dir, exist_ok=True)
    chatbot_dataset_path = os.path.join(datasets_dir, "chatbot_dataset.json")
    jfleg_path = os.path.join(datasets_dir, "jfleg_dataset.json")

    with open(chatbot_dataset_path, "r", encoding="utf-8") as f:
        chatbot_data = json.load(f)

    print(f"[*] Dữ liệu chatbot ban đầu: {len(chatbot_data)} mẫu.")

    # 1. Bổ sung các biến thể chào hỏi thực tế & từ gõ dở
    new_greetings = [
        {"text": "xin ch", "intent": "greeting"},
        {"text": "chao", "intent": "greeting"},
        {"text": "xin chao bạn", "intent": "greeting"},
        {"text": "alo bot oi", "intent": "greeting"},
        {"text": "chào trợ lý ai", "intent": "greeting"},
        {"text": "hello trợ lý", "intent": "greeting"},
        {"text": "chào buổi tối", "intent": "greeting"},
        {"text": "hi em", "intent": "greeting"},
        {"text": "chào ad đẹp trai", "intent": "greeting"},
    ]

    # 2. Bổ sung các câu hỏi tiếp nối ngữ cảnh (Follow-up)
    new_followups = [
        {"text": "cho tôi ví dụ về thì này", "intent": "follow_up_examples"},
        {"text": "cho ví dụ về thì này", "intent": "follow_up_examples"},
        {"text": "cho thêm ví dụ", "intent": "follow_up_examples"},
        {"text": "ví dụ về thì này", "intent": "follow_up_examples"},
        {"text": "cho tôi vài câu ví dụ", "intent": "follow_up_examples"},
        {"text": "cho bài tập về thì này", "intent": "follow_up_quiz"},
        {"text": "luyện tập thì này", "intent": "follow_up_quiz"},
        {"text": "cho tôi bài tập", "intent": "follow_up_quiz"},
        {"text": "làm bài tập trắc nghiệm", "intent": "follow_up_quiz"},
        {"text": "công thức thì này là gì", "intent": "follow_up_formula"},
        {"text": "dấu hiệu nhận biết thì này", "intent": "follow_up_formula"},
    ]

    # 3. Nạp các câu lỗi thực tế từ 1.501 câu của bộ dữ liệu JFLEG vào nhãn error_correction
    existing_texts = {item["text"].strip().lower() for item in chatbot_data}
    added_count = 0

    # 3. Thêm các biến thể hỏi ngữ pháp phổ biến & từ vựng
    extra_grammar_samples = [
        {"text": "cách dùng thì hiện tại đơn", "intent": "grammar_present_simple"},
        {"text": "khi nào dùng hiện tại đơn", "intent": "grammar_present_simple"},
        {"text": "giải thích hiện tại tiếp diễn", "intent": "grammar_present_continuous"},
        {"text": "phân biệt hiện tại đơn và hiện tại tiếp diễn", "intent": "grammar_present_continuous"},
        {"text": "quá khứ đơn dùng khi nào", "intent": "grammar_past_simple"},
        {"text": "cách dùng thì quá khứ đơn", "intent": "grammar_past_simple"},
        {"text": "thì hiện tại hoàn thành", "intent": "grammar_present_perfect"},
        {"text": "cách dùng hiện tại hoàn thành", "intent": "grammar_present_perfect"},
        {"text": "câu điều kiện loại 1 2 3", "intent": "grammar_conditional"},
        {"text": "cách chia câu điều kiện", "intent": "grammar_conditional"},
        {"text": "câu bị động passive voice", "intent": "grammar_passive"},
        {"text": "công thức câu bị động", "intent": "grammar_passive"},
        {"text": "mệnh đề quan hệ who whom which that", "intent": "grammar_relative_clauses"},
        {"text": "cách dùng mệnh đề quan hệ", "intent": "grammar_relative_clauses"},
        {"text": "cách so sánh hơn và so sánh nhất", "intent": "grammar_comparison"},
        {"text": "so sánh trong tiếng anh", "intent": "grammar_comparison"},
        {"text": "khi nào dùng to V khi nào dùng Ving", "intent": "grammar_gerund_infinitive"},
        {"text": "danh động từ gerund", "intent": "grammar_gerund_infinitive"},
        {"text": "đảo ngữ trong tiếng anh", "intent": "grammar_inversion"},
        {"text": "động từ khuyết thiếu can could should must", "intent": "grammar_modal_verbs"},
        {"text": "mạo từ a an the dùng khi nào", "intent": "grammar_articles"},
        {"text": "chấm điểm bài viết tiếng anh này", "intent": "essay_scoring"},
        {"text": "đánh giá essay ielts này", "intent": "essay_scoring"},
        {"text": "score this essay", "intent": "essay_scoring"},
        {"text": "sửa lỗi câu này giúp tôi", "intent": "error_correction"},
        {"text": "câu này có sai ngữ pháp không", "intent": "error_correction"},
        {"text": "check my grammar please", "intent": "error_correction"},
        {"text": "is this sentence grammatically correct", "intent": "error_correction"},
    ]

    for item in new_greetings + new_followups + extra_grammar_samples:
        t = item["text"].strip().lower()
        if t not in existing_texts:
            chatbot_data.append(item)
            existing_texts.add(t)
            added_count += 1

    if os.path.exists(jfleg_path):
        with open(jfleg_path, "r", encoding="utf-8") as f:
            jfleg_data = json.load(f)

        print(f"[*] Đang tích hợp câu lỗi từ toàn bộ {len(jfleg_data)} mẫu JFLEG vào nhãn error_correction...")
        jfleg_added = 0
        for entry in jfleg_data:
            orig = entry.get("original", "").strip()
            words = orig.split()
            if 3 <= len(words) <= 40:
                low = orig.lower()
                if low not in existing_texts:
                    chatbot_data.append({
                        "text": orig,
                        "intent": "error_correction"
                    })
                    existing_texts.add(low)
                    added_count += 1
                    jfleg_added += 1

        print(f"[*] Đã nạp thành công {jfleg_added} câu thực tế từ bộ dữ liệu JFLEG.")

    print(f"[✓] Đã bổ sung tổng cộng: {added_count} mẫu mới!")
    print(f"[✓] Tổng quy mô tập huấn luyện mới: {len(chatbot_data)} mẫu.")

    # Lưu đè vào chatbot_dataset.json
    with open(chatbot_dataset_path, "w", encoding="utf-8") as f:
        json.dump(chatbot_data, f, ensure_ascii=False, indent=2)

    print(f"[✓] Đã lưu thành công vào: {chatbot_dataset_path}")

if __name__ == "__main__":
    main()
