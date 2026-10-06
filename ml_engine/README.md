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
│   └── jfleg_dataset.json      # 1.501 câu của người học & 4.879 câu sửa chuẩn bản xứ (JHU)
│
├── models/                     # Trọng số mô hình Machine Learning xuất xưởng (JSON)
│   ├── model_weights.json      # Trọng số Ridge Regression AES (Chấm điểm bài luận)
│   ├── ged_model.joblib        # Trọng số mô hình Grammar Error Detection (GED)
│   ├── learning_path_model.json # Trọng số Adaptive Learning Path (Lộ trình học cá nhân hoá)
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
├── grammar_detector/           # [Gói 2] Phát hiện lỗi ngữ pháp (Grammar Error Detection)
│   ├── __init__.py
│   ├── feature_extractor.py    # Trích xuất đặc trưng cú pháp & quy tắc ESL
│   ├── train_ged.py            # Huấn luyện mô hình phát hiện lỗi
│   └── predict_ged.py          # Dự đoán câu có lỗi hay chuẩn ngữ pháp
│
├── learning_path/              # [Gói 3] Gợi ý lộ trình học cá nhân hoá từ câu đúng/sai (Adaptive Learning Path)
│   ├── __init__.py
│   ├── build_dataset.py        # Tạo 2.500 hồ sơ người học đa dạng (Knowledge Tracing)
│   ├── train.py                # Huấn luyện Level Classifier (99.56%), Focus Classifier (99.80%), Priority Regressor
│   └── predict.py              # CLI thử nghiệm dự đoán lộ trình cá nhân hoá
│
└── jfleg_gec/                  # [Gói 4] Sửa lỗi ngữ pháp & Chuẩn hoá bản ngữ (JFLEG GEC)
    ├── __init__.py
    ├── import_jfleg.py         # Nạp và detokenize bộ dữ liệu JFLEG từ Johns Hopkins Univ
    ├── extract_knowledge.py    # Bóc tách 3.518 cụm từ sai/sửa & TF-IDF Cosine Index
    └── train_fluency.py        # Huấn luyện mô hình phân loại câu người học vs bản ngữ
```

---

## 🛠️ Lệnh Thực Thi Tiện Ích (`npm run`)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run ml:dataset:path` | Tạo tập dữ liệu 2.500 hồ sơ người học cho Lộ trình cá nhân hoá |
| `npm run ml:train:path` | Huấn luyện mô hình Lộ trình học cá nhân hoá AI (scikit-learn) |
| `npm run ml:predict:path` | Chạy thử nghiệm dự đoán lộ trình cá nhân hoá qua dòng lệnh |
| `npm run ml:train:ged` | Huấn luyện lại mô hình Grammar Error Detection |
| `npm run ml:predict:ged` | Chạy thử nghiệm phát hiện lỗi ngữ pháp qua dòng lệnh |
| `npm run ml:train` | Huấn luyện lại mô hình Chấm điểm bài luận (AES Ridge Regression) |
| `npm run ml:predict` | Chấm thử điểm một đoạn văn tiếng Anh |
| `npm run ml:jfleg:extract` | Trích xuất lại tri thức ngữ pháp & index từ 1.501 câu JFLEG |
| `npm run ml:import:asap` | Tải và đồng bộ lại bộ dữ liệu bài luận ASAP từ Hugging Face |
