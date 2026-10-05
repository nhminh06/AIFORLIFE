# 🧠 AFL Machine Learning Engine (`ml_engine`)

Hệ thống Machine Learning & Xử lý Ngôn ngữ Tự nhiên (NLP) nội bộ phục vụ nền tảng học tiếng Anh.
Hoạt động **100% Offline trên máy cục bộ**, không phụ thuộc và không gọi bất kỳ API bên ngoài nào.

---

## 📁 Cấu Trúc Các Gói (Packages) & Thư Mục

```
ml_engine/
├── .venv/                      # Python virtual environment
├── datasets/                   # Dữ liệu chuẩn hoá và bộ nhớ đệm
│   ├── asap_cache.parquet      # Cache bộ dữ liệu chấm bài luận quốc tế ASAP-AES (Kaggle/Hewlett)
│   ├── cefr_vocab.json         # Danh mục từ vựng học thuật CEFR (A1, B1, C1) & liên từ
│   ├── dataset.json            # 3.000 bài luận tiếng Anh chuẩn hoá cho mô hình AES
│   ├── chatbot_dataset.json    # 1.698 mẫu câu hỏi, 12 thì ngữ pháp và ý định hội thoại
│   └── jfleg_dataset.json      # 1.501 câu của người học & 4.879 câu sửa chuẩn bản xứ (JHU)
│
├── models/                     # Trọng số mô hình Machine Learning xuất xưởng (JSON)
│   ├── model_weights.json      # Trọng số Ridge Regression AES (Chấm điểm bài luận)
│   ├── chatbot_model.json      # Trọng số TF-IDF + Logistic Regression (Phân loại ý định)
│   ├── jfleg_knowledge.json    # 3.518 phrasal edits & index tìm kiếm câu tương đồng GEC
│   └── fluency_model.json      # Trọng số đánh giá độ tự nhiên/trôi chảy của câu
│
├── essay_scorer/               # [Gói 1] Chấm điểm bài luận tự động (AES)
│   ├── __init__.py
│   ├── feature_extractor.py    # Trích xuất 6 đặc trưng ngôn ngữ: Flesch, TTR, CEFR, Cohesive...
│   ├── import_asap.py          # Nạp và khử trùng lặp 3.500+ bài viết từ dataset ASAP
│   ├── train.py                # Huấn luyện mô hình Ridge Regression (R2 = 0.72)
│   └── predict.py              # CLI thử nghiệm chấm điểm bài viết kèm giải thích (XAI)
│
├── chatbot_intent/             # [Gói 2] Phân loại ý định hội thoại & ngữ pháp (Chatbot NLP)
│   ├── __init__.py
│   ├── build_dataset.py        # Mở rộng & tổng hợp ngân hàng mẫu câu hỏi hội thoại
│   ├── train.py                # Huấn luyện TF-IDF + Logistic Regression Softmax (37 Intents)
│   └── predict.py              # CLI kiểm tra nhận diện ý định và xác suất
│
└── jfleg_gec/                  # [Gói 3] Sửa lỗi ngữ pháp & Chuẩn hoá bản ngữ (JFLEG GEC)
    ├── __init__.py
    ├── import_jfleg.py         # Nạp và detokenize bộ dữ liệu JFLEG từ Johns Hopkins Univ
    ├── extract_knowledge.py    # Bóc tách 3.518 cụm từ sai/sửa & TF-IDF Cosine Index
    └── train_fluency.py        # Huấn luyện mô hình phân loại câu người học vs bản ngữ
```

---

## 🛠️ Lệnh Thực Thi Tiện Ích (`npm run`)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run ml:train:chatbot` | Huấn luyện lại mô hình Phân loại Ý định Chatbot |
| `npm run ml:predict:chatbot` | Chạy thử nghiệm dự đoán ý định qua dòng lệnh |
| `npm run ml:train` | Huấn luyện lại mô hình Chấm điểm bài luận (AES Ridge Regression) |
| `npm run ml:predict` | Chấm thử điểm một đoạn văn tiếng Anh |
| `npm run ml:jfleg:extract` | Trích xuất lại tri thức ngữ pháp & index từ 1.501 câu JFLEG |
| `npm run ml:import:asap` | Tải và đồng bộ lại bộ dữ liệu bài luận ASAP từ Hugging Face |
