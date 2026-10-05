"""
Comprehensive Chatbot Dataset Expansion & Training Pipeline
Huấn luyện mô hình Intent NLP với tập dữ liệu mở rộng chuẩn xác cho toàn bộ 12 thì,
sửa lỗi câu, phân biệt từ, cho ví dụ, bài tập trắc nghiệm và chấm điểm bài viết.
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

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

NEW_INTENT_DATA = {
    # 1. Tra cứu 12 thì - Tổng quan & Từng thì chi tiết
    "grammar_lookup_all_tenses": [
        "12 thì trong tiếng anh", "tra cứu 12 thì", "bảng 12 thì", "tổng hợp 12 thì",
        "công thức 12 thì", "các thì trong tiếng anh", "danh sách 12 thì", "cách dùng 12 thì",
        "hướng dẫn 12 thì tiếng anh", "tra cuu 12 thi", "bang 12 thi", "cong thuc 12 thi",
        "12 tenses in english", "english tenses summary", "all 12 tenses guide",
        "tổng quan các thì", "các thì tiếng anh cơ bản", "ôn tập 12 thì"
    ],
    "grammar_present_simple": [
        "thì hiện tại đơn", "hiện tại đơn", "công thức hiện tại đơn", "present simple",
        "cách dùng hiện tại đơn", "dấu hiệu nhận biết hiện tại đơn", "thì hiện tại đơn là gì",
        "present simple tense", "hien tai don", "cong thuc hien tai don", "ví dụ thì hiện tại đơn",
        "khi nào dùng hiện tại đơn", "chia động từ hiện tại đơn", "bài học hiện tại đơn"
    ],
    "grammar_present_continuous": [
        "thì hiện tại tiếp diễn", "hiện tại tiếp diễn", "present continuous", "present progressive",
        "công thức hiện tại tiếp diễn", "cách dùng hiện tại tiếp diễn", "hien tai tiep dien",
        "dấu hiệu nhận biết hiện tại tiếp diễn", "am is are ving", "khi nào dùng hiện tại tiếp diễn",
        "ví dụ hiện tại tiếp diễn", "thì tiếp diễn trong tiếng anh"
    ],
    "grammar_present_perfect": [
        "thì hiện tại hoàn thành", "hiện tại hoàn thành", "present perfect", "công thức hiện tại hoàn thành",
        "cách dùng hiện tại hoàn thành", "dấu hiệu hiện tại hoàn thành", "hien tai hoan thanh",
        "have has v3 là thì gì", "since và for trong hiện tại hoàn thành", "ví dụ hiện tại hoàn thành",
        "khi nào dùng hiện tại hoàn thành", "bài tập hiện tại hoàn thành"
    ],
    "grammar_present_perfect_continuous": [
        "thì hiện tại hoàn thành tiếp diễn", "hiện tại hoàn thành tiếp diễn", "present perfect continuous",
        "present perfect progressive", "công thức hiện tại hoàn thành tiếp diễn", "hien tai hoan thanh tiep dien",
        "have been ving là thì gì", "has been ving", "cách dùng hiện tại hoàn thành tiếp diễn",
        "dấu hiệu hiện tại hoàn thành tiếp diễn", "phân biệt hiện tại hoàn thành và hiện tại hoàn thành tiếp diễn",
        "ví dụ thì hiện tại hoàn thành tiếp diễn", "have been studying là thì gì", "has been working là thì gì",
        "tra cứu thì hiện tại hoàn thành tiếp diễn"
    ],
    "grammar_past_simple": [
        "thì quá khứ đơn", "quá khứ đơn", "past simple", "past simple tense",
        "công thức quá khứ đơn", "cách dùng quá khứ đơn", "qua khu don",
        "dấu hiệu quá khứ đơn", "động từ quá khứ đơn", "bảng động từ bất quy tắc v2",
        "khi nào dùng quá khứ đơn", "did v bare", "ví dụ quá khứ đơn"
    ],
    "grammar_past_continuous": [
        "thì quá khứ tiếp diễn", "quá khứ tiếp diễn", "past continuous", "past progressive",
        "công thức quá khứ tiếp diễn", "qua khu tiep dien", "was were ving",
        "cách dùng quá khứ tiếp diễn", "dấu hiệu quá khứ tiếp diễn", "when và while trong quá khứ tiếp diễn",
        "hành động đang xảy ra trong quá khứ", "ví dụ quá khứ tiếp diễn"
    ],
    "grammar_past_perfect": [
        "thì quá khứ hoàn thành", "quá khứ hoàn thành", "past perfect", "past perfect tense",
        "công thức quá khứ hoàn thành", "qua khu hoan thanh", "had v3 là thì gì",
        "cách dùng quá khứ hoàn thành", "dấu hiệu quá khứ hoàn thành", "by the time quá khứ hoàn thành",
        "hành động xảy ra trước một hành động quá khứ", "ví dụ quá khứ hoàn thành"
    ],
    "grammar_past_perfect_continuous": [
        "thì quá khứ hoàn thành tiếp diễn", "quá khứ hoàn thành tiếp diễn", "past perfect continuous",
        "past perfect progressive", "công thức quá khứ hoàn thành tiếp diễn", "qua khu hoan thanh tiep dien",
        "had been ving là thì gì", "cách dùng quá khứ hoàn thành tiếp diễn", "dấu hiệu quá khứ hoàn thành tiếp diễn",
        "ví dụ quá khứ hoàn thành tiếp diễn", "tra cứu quá khứ hoàn thành tiếp diễn"
    ],
    "grammar_future_simple": [
        "thì tương lai đơn", "tương lai đơn", "future simple", "future simple tense",
        "công thức tương lai đơn", "tuong lai don", "will v là thì gì",
        "cách dùng tương lai đơn", "dấu hiệu tương lai đơn", "dự đoán tương lai",
        "phân biệt will và be going to", "ví dụ tương lai đơn"
    ],
    "grammar_future_continuous": [
        "thì tương lai tiếp diễn", "tương lai tiếp diễn", "future continuous", "future progressive",
        "công thức tương lai tiếp diễn", "tuong lai tiep dien", "will be ving",
        "cách dùng tương lai tiếp diễn", "dấu hiệu tương lai tiếp diễn", "ví dụ tương lai tiếp diễn"
    ],
    "grammar_future_perfect": [
        "thì tương lai hoàn thành", "tương lai hoàn thành", "future perfect", "future perfect tense",
        "công thức tương lai hoàn thành", "tuong lai hoan thanh", "will have v3",
        "cách dùng tương lai hoàn thành", "dấu hiệu tương lai hoàn thành", "by tomorrow will have",
        "ví dụ tương lai hoàn thành"
    ],
    "grammar_future_perfect_continuous": [
        "thì tương lai hoàn thành tiếp diễn", "tương lai hoàn thành tiếp diễn", "future perfect continuous",
        "future perfect progressive", "công thức tương lai hoàn thành tiếp diễn", "tuong lai hoan thanh tiep dien",
        "will have been ving là thì gì", "cách dùng tương lai hoàn thành tiếp diễn",
        "dấu hiệu tương lai hoàn thành tiếp diễn", "ví dụ tương lai hoàn thành tiếp diễn"
    ],

    # 2. Các chủ điểm ngữ pháp trọng điểm
    "grammar_conditional": [
        "câu điều kiện", "cau dieu kien", "conditionals", "if câu điều kiện",
        "điều kiện loại 1", "điều kiện loại 2", "điều kiện loại 3", "điều kiện hỗn hợp",
        "công thức câu điều kiện", "cách dùng câu điều kiện", "ví dụ câu điều kiện"
    ],
    "grammar_passive": [
        "câu bị động", "cau bi dong", "passive voice", "bị động trong tiếng anh",
        "công thức câu bị động", "chuyển câu chủ động sang bị động", "cách dùng câu bị động",
        "ví dụ câu bị động", "be v3 ed"
    ],
    "grammar_reported_speech": [
        "câu gián tiếp", "câu tường thuật", "reported speech", "indirect speech",
        "lùi thì trong câu gián tiếp", "công thức câu tường thuật", "chuyển câu trực tiếp sang gián tiếp",
        "cách đổi đại từ câu tường thuật", "ví dụ câu tường thuật"
    ],
    "grammar_relative_clauses": [
        "mệnh đề quan hệ", "menh de quan he", "relative clauses", "who whom which that whose",
        "mệnh đề quan hệ xác định", "mệnh đề quan hệ không xác định", "rút gọn mệnh đề quan hệ",
        "cách dùng đại từ quan hệ", "ví dụ mệnh đề quan hệ"
    ],
    "grammar_gerund_infinitive": [
        "danh động từ", "danh dong tu", "gerund", "infinitive", "to v và ving",
        "động từ theo sau bởi to v", "động từ theo sau bởi ving", "gerund and infinitive",
        "cách dùng to v và ving", "ví dụ danh động từ"
    ],
    "grammar_comparison": [
        "so sánh trong tiếng anh", "so sánh hơn", "so sánh nhất", "so sánh bằng",
        "comparisons", "comparative and superlative", "tính từ ngắn tính từ dài so sánh",
        "công thức so sánh", "ví dụ so sánh hơn nhất"
    ],
    "grammar_inversion": [
        "đảo ngữ", "dao ngu", "inversion", "đảo ngữ trong tiếng anh",
        "đảo ngữ với no sooner", "đảo ngữ với rarely seldom never", "công thức đảo ngữ",
        "cách dùng đảo ngữ", "ví dụ đảo ngữ"
    ],
    "grammar_articles": [
        "mạo từ", "mao tu", "articles", "a an the", "cách dùng a an the",
        "khi nào dùng a", "khi nào dùng the", "mạo từ xác định và không xác định",
        "ví dụ mạo từ tiếng anh", "zero article"
    ],
    "grammar_modal_verbs": [
        "động từ khuyết thiếu", "modal verbs", "can could may might must should",
        "cách dùng modal verbs", "công thức động từ khuyết thiếu", "khi nào dùng should must",
        "modal verbs trong tiếng anh", "ví dụ động từ khuyết thiếu"
    ],

    # 3. Phân biệt từ vựng dễ nhầm lẫn (Vocabulary Differentiation)
    "vocab_diff_affect_effect": [
        "phân biệt affect và effect", "affect vs effect", "khác nhau giữa affect và effect",
        "affect effect", "cách dùng affect và effect", "khi nào dùng affect khi nào dùng effect"
    ],
    "vocab_diff_look_see_watch": [
        "phân biệt look see watch", "look vs see vs watch", "khác nhau look see watch",
        "khi nào dùng look see watch", "look see và watch", "cách dùng look see watch"
    ],
    "vocab_diff_make_do": [
        "phân biệt make và do", "make vs do", "khác nhau giữa make và do",
        "khi nào dùng make khi nào dùng do", "cụm từ đi với make và do", "make do collocations"
    ],
    "vocab_diff_borrow_lend": [
        "phân biệt borrow và lend", "borrow vs lend", "khác nhau giữa borrow và lend",
        "vay và cho vay tiếng anh", "borrow lend", "khi nào dùng borrow khi nào dùng lend"
    ],
    "vocab_diff_say_tell_speak_talk": [
        "phân biệt say tell speak talk", "say vs tell vs speak vs talk", "khác nhau giữa say và tell",
        "khi nào dùng say tell speak talk", "cách dùng say tell", "nói tiếng anh say tell speak talk"
    ],
    "vocab_diff_listen_hear": [
        "phân biệt listen và hear", "listen vs hear", "khác nhau giữa listen và hear",
        "nghe trong tiếng anh listen hear", "khi nào dùng listen khi nào dùng hear"
    ],
    "vocab_diff_advise_advice": [
        "phân biệt advise và advice", "advise vs advice", "khác nhau giữa advise và advice",
        "lời khuyên advice advise", "danh từ và động từ advice advise"
    ],
    "vocab_diff_house_home": [
        "phân biệt house và home", "house vs home", "khác nhau giữa house và home",
        "ngôi nhà house home", "khi nào dùng house khi nào dùng home"
    ],
    "vocab_diff_win_beat": [
        "phân biệt win và beat", "win vs beat", "khác nhau giữa win và beat",
        "chiến thắng win và beat", "khi nào dùng win khi nào dùng beat"
    ],
    "vocab_diff_hi_hello": [
        "phân biệt hi và hello", "hi vs hello", "khác nhau giữa hi và hello",
        "chào hỏi hi và hello", "hi và hello khác gì nhau"
    ],
    "vocab_diff_job_work": [
        "phân biệt job và work", "job vs work", "khác nhau giữa job và work",
        "công việc job work", "danh từ đếm được job work"
    ],
    "vocab_diff_bring_take": [
        "phân biệt bring và take", "bring vs take", "khác nhau giữa bring và take",
        "mang đi mang lại bring take", "khi nào dùng bring khi nào dùng take"
    ],
    "vocab_diff_remember_remind": [
        "phân biệt remember và remind", "remember vs remind", "khác nhau giữa remember và remind",
        "nhớ và nhắc nhở tiếng anh", "cách dùng remember remind"
    ],
    "vocab_diff_since_for": [
        "phân biệt since và for", "since vs for", "khác nhau giữa since và for",
        "dấu hiệu since for", "khi nào dùng since khi nào dùng for"
    ],
    "vocab_diff_general": [
        "phân biệt từ vựng", "từ vựng dễ nhầm lẫn", "so sánh hai từ", "khác nhau giữa 2 từ",
        "từ đồng nghĩa khác nghĩa", "từ vựng hay sai", "tra cứu phân biệt từ", "cặp từ dễ nhầm"
    ],

    # 4. Yêu cầu ví dụ minh họa (Examples)
    "follow_up_examples": [
        "cho ví dụ", "cho tôi ví dụ", "thêm ví dụ", "cho thêm ví dụ minh họa",
        "ví dụ câu này", "cho câu ví dụ tương tự", "give me examples", "thêm câu ví dụ",
        "cho vài câu mẫu", "ví dụ thực tế", "cho ví dụ về thì này", "cần thêm ví dụ"
    ],

    # 5. Yêu cầu bài tập trắc nghiệm (Quiz / Exercises)
    "follow_up_quiz": [
        "cho bài tập", "làm bài tập", "cho bài tập trắc nghiệm", "luyện tập trắc nghiệm",
        "tạo câu hỏi luyện tập", "quiz me", "bài tập ngữ pháp", "cho câu hỏi ôn tập",
        "luyện tập câu này", "kiểm tra kiến thức", "cho bài trắc nghiệm về câu này"
    ],

    # 6. Chấm điểm bài viết / Luận (Essay Scoring)
    "essay_scoring": [
        "chấm bài viết", "chấm điểm essay", "đánh giá bài viết tiếng anh", "chấm bài ielts writing",
        "score this essay", "nhận xét bài essay", "chấm bài luận", "độ dễ đọc của bài viết",
        "chấm điểm writing task 2", "đánh giá bài luận này", "bài viết này được mấy điểm"
    ],

    # 7. Sửa lỗi câu & Kiểm tra ngữ pháp (Error Correction query forms)
    "error_correction_query": [
        "sửa lỗi câu này", "kiểm tra ngữ pháp câu", "câu này sai ở đâu", "check grammar câu này",
        "sửa ngữ pháp giúp tôi", "bóc tách lỗi câu", "câu tiếng anh này đúng chưa",
        "tìm lỗi sai trong câu", "phân tích ngữ pháp câu này", "sửa lỗi tiếng anh"
    ],

    # 8. Chào hỏi, cảm ơn, trợ giúp
    "greeting": [
        "xin chào", "hello", "hi bạn", "chào trợ lý", "alo ad", "good morning", "good evening",
        "bắt đầu học thôi", "chào bạn nhé", "chào cô giáo ai"
    ],
    "thanks_bye": [
        "cảm ơn bạn", "cảm ơn trợ lý", "thanks so much", "tạm biệt", "bye bye",
        "hẹn gặp lại", "bài học rất hay cảm ơn", "ok cảm ơn"
    ],
    "bot_info": [
        "bạn là ai", "hướng dẫn sử dụng", "bạn có tính năng gì", "trợ lý học tiếng anh ai",
        "giới thiệu về hệ thống", "cách dùng chatbot", "bạn có thể làm gì"
    ],
    "study_tips": [
        "bí quyết học tiếng anh", "mẹo học ngữ pháp", "cách học từ vựng hiệu quả",
        "làm sao để nhớ thì", "phương pháp học ielts", "kinh nghiệm học tiếng anh"
    ]
}

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, "..", "datasets", "chatbot_dataset.json")

    print("=" * 60)
    print("🚀 BẮT ĐẦU MỞ RỘNG DATASET & HUẤN LUYỆN MÔ HÌNH CHATBOT INTENT NLP")
    print("=" * 60)

    # 1. Tải dataset hiện có
    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    existing_count = len(dataset)
    print(f"[*] Đã tải {existing_count} mẫu câu ban đầu từ chatbot_dataset.json")

    # 2. Bổ sung các mẫu mới
    added_count = 0
    existing_texts = {item["text"].strip().lower() for item in dataset}

    for intent, samples in NEW_INTENT_DATA.items():
        for s in samples:
            clean_s = s.strip().lower()
            if clean_s not in existing_texts:
                dataset.append({"text": clean_s, "intent": intent})
                existing_texts.add(clean_s)
                added_count += 1

    print(f"[✓] Đã bổ sung thành công {added_count} mẫu câu chất lượng cao cho toàn bộ danh mục!")
    print(f"[*] Tổng kích thước dataset sau mở rộng: {len(dataset)} mẫu câu.")

    # Lưu lại dataset mở rộng
    with open(dataset_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    # 3. Huấn luyện mô hình TF-IDF + Logistic Regression
    texts = [item["text"].strip().lower() for item in dataset]
    intents = [item["intent"].strip() for item in dataset]

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=3500,
        min_df=1,
        sublinear_tf=True,
        norm="l2"
    )
    X = vectorizer.fit_transform(texts)
    y = np.array(intents)

    clf = LogisticRegression(
        C=6.0,
        max_iter=1200,
        class_weight="balanced",
        random_state=42
    )
    clf.fit(X, y)

    y_pred = clf.predict(X)
    acc = accuracy_score(y, y_pred)
    classes = list(clf.classes_)

    print("-" * 60)
    print(f"[✓] Tổng số lớp ý định (Classes): {len(classes)}")
    print(f"[✓] Kích thước từ điển TF-IDF: {len(vectorizer.vocabulary_)} đặc trưng (Unigrams + Bigrams)")
    print(f"[✓] Độ chính xác huấn luyện (Training Accuracy): {acc * 100:.2f}%")
    print("-" * 60)

    # 4. Xuất trọng số mô hình sang JSON cho TypeScript inference (0ms)
    vocab_dict = {k: int(v) for k, v in vectorizer.vocabulary_.items()}
    idf_list = [round(float(v), 5) for v in vectorizer.idf_]
    coef_list = [[round(float(w), 5) for w in row] for row in clf.coef_]
    intercept_list = [round(float(b), 5) for b in clf.intercept_]

    model_data = {
        "model_type": "TF-IDF + Logistic Regression Intent Classifier (Enhanced)",
        "classes": classes,
        "vocabulary": vocab_dict,
        "idf": idf_list,
        "coefficients": coef_list,
        "intercept": intercept_list,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "num_samples": len(dataset),
            "num_classes": len(classes),
            "num_features": len(vocab_dict),
        }
    }

    models_dir = os.path.join(base_dir, "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    output_path = os.path.join(models_dir, "chatbot_model.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(model_data, f, ensure_ascii=False)

    print(f"[🎉] ĐÃ XUẤT TRỌNG SỐ MÔ HÌNH THÀNH CÔNG VÀO:\n     ➡️ {output_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
