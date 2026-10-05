"""
Script tự động tải và chuyển đổi bộ dữ liệu chuẩn quốc tế ASAP-AES (The Hewlett Foundation / Kaggle)
- Tải từ Hugging Face mirror: llm-aes/asappp-1-2-original (3,583 bài viết chuẩn)
- Làm sạch triệt để các tag ẩn danh (@PERSON, @LOCATION, @ORGANIZATION, @MONTH, @CAPS...)
- Khử trùng lặp 100% bằng ID và nội dung văn bản
- Chuẩn hóa thang điểm bài viết về chuẩn 0 - 100
- Xuất ra file dataset.json kết hợp hài hòa giữa 140 bài ban đầu và các bài thi chuẩn ASAP
"""

import os
import sys
import json
import re
import urllib.request
import pyarrow.parquet as pq

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ASAP_URL = "https://huggingface.co/datasets/llm-aes/asappp-1-2-original/resolve/main/data/train-00000-of-00001.parquet"

PROMPT_TEXTS = {
    1: "More and more people use computers to write and communicate. Discuss whether this change is positive or negative for society.",
    2: "Censorship in libraries: Should certain books or controversial materials be removed from school or public libraries?",
}

SCORE_RANGES = {
    1: (2.0, 12.0),
    2: (1.0, 6.0),
}

def clean_asap_text(text: str) -> str:
    """Loại bỏ triệt để các thẻ ẩn danh @PERSON, @LOCATION, @MONTH... thành từ ngữ tự nhiên"""
    t = text
    t = re.sub(r'@PERSON\d*', 'someone', t)
    t = re.sub(r'@LOCATION\d*', 'somewhere', t)
    t = re.sub(r'@ORGANIZATION\d*', 'organization', t)
    t = re.sub(r'@MONTH\d*', 'may', t) # @MONTH thường là từ 'may' bị tag nhầm thành tháng 5
    t = re.sub(r'@DATE\d*', 'recently', t)
    t = re.sub(r'@TIME\d*', 'then', t)
    t = re.sub(r'@MONEY\d*', '$100', t)
    t = re.sub(r'@PERCENT\d*', '50%', t)
    t = re.sub(r'@NUM\d*', 'many', t)
    t = re.sub(r'@CAPS\d*', '', t)
    t = re.sub(r'@[A-Z]+\d*', '', t) # Bắt sạch tất cả các @TAG còn sót lại
    t = re.sub(r'&lt;.*?&gt;', '', t) # Bỏ html escape tags
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def get_level(score: int) -> str:
    if score >= 85: return "Xuất sắc"
    if score >= 70: return "Tốt"
    if score >= 50: return "Đạt"
    return "Chưa đạt"

def download_and_convert(target_total: int = 1000):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    datasets_dir = os.path.join(base_dir, "..", "datasets")
    os.makedirs(datasets_dir, exist_ok=True)
    cache_path = os.path.join(datasets_dir, "asap_cache.parquet")
    dataset_path = os.path.join(datasets_dir, "dataset.json")
    backup_path = os.path.join(datasets_dir, "dataset_backup_140.json")

    # 1. Tải file Parquet nếu chưa có sẵn
    if not os.path.exists(cache_path):
        print(f"[*] Đang tải bộ dữ liệu ASAP-AES (~1.3 MB) từ Hugging Face...")
        urllib.request.urlretrieve(ASAP_URL, cache_path)
        print(f"[+] Đã tải xong: {cache_path}")
    else:
        print(f"[*] Đã tìm thấy file bộ nhớ đệm: {cache_path}")

    # 2. Đọc dữ liệu từ Parquet
    table = pq.read_table(cache_path)
    total_rows = table.num_rows
    print(f"[*] Tổng số bài viết trong kho ASAP (Set 1 & 2): {total_rows} bài")

    # 3. Luôn lấy gốc từ dataset_backup_140.json để giữ 140 bài ban đầu chuẩn mực không bị trùng
    final_dataset = []
    seen_ids = set()
    seen_texts = set()

    source_seed_path = backup_path if os.path.exists(backup_path) else dataset_path
    if os.path.exists(source_seed_path):
        with open(source_seed_path, "r", encoding="utf-8") as f:
            try:
                seed_data = json.load(f)
                for item in seed_data:
                    # Chỉ lấy các bài viết gốc (không phải bài asap_ cũ bị lặp)
                    if not str(item.get("id", "")).startswith("asap_"):
                        if item["id"] not in seen_ids:
                            seen_ids.add(item["id"])
                            seen_texts.add(item["text"][:60].lower())
                            final_dataset.append(item)
                print(f"[*] Đã nạp {len(final_dataset)} bài viết ban đầu (không bị trùng lặp).")
            except Exception as e:
                print(f"[!] Lỗi đọc file seed: {e}")

    # 4. Trích xuất và chuẩn hóa bài viết từ ASAP (lấy mẫu trải đều)
    needed_asap = max(0, target_total - len(final_dataset))
    print(f"[*] Mục tiêu: {target_total} bài (cần lấy thêm {needed_asap} bài từ ASAP)")

    p_set = table['essay_set'].to_pylist()
    p_essay = table['essay'].to_pylist()
    p_score = table['domain1_score'].to_pylist()
    p_id = table['__index_level_0__'].to_pylist() if '__index_level_0__' in table.column_names else list(range(total_rows))

    added_asap = 0
    stride = max(1, total_rows // needed_asap) if needed_asap > 0 else 1

    for i in range(0, total_rows, stride):
        if added_asap >= needed_asap:
            break
        es_set = p_set[i]
        if es_set not in SCORE_RANGES:
            continue

        raw_score = float(p_score[i])
        min_s, max_s = SCORE_RANGES[es_set]
        # Chuẩn hóa về 0 - 100
        norm_score = int(round(((raw_score - min_s) / (max_s - min_s)) * 100))
        norm_score = max(0, min(100, norm_score))

        text_clean = clean_asap_text(str(p_essay[i]))
        if len(text_clean.split()) < 35:
            continue

        item_id = f"asap_{es_set}_{p_id[i]}"
        text_signature = text_clean[:60].lower()

        # Khử trùng lặp tuyệt đối
        if item_id in seen_ids or text_signature in seen_texts:
            continue

        seen_ids.add(item_id)
        seen_texts.add(text_signature)

        item = {
            "id": item_id,
            "prompt": PROMPT_TEXTS.get(es_set, "English Argumentative Writing Prompt"),
            "text": text_clean,
            "score": norm_score,
            "level": get_level(norm_score),
            "notes": f"ASAP-AES official benchmark (Set {es_set}, raw score: {raw_score}/{max_s})"
        }
        final_dataset.append(item)
        added_asap += 1

    # Nếu sau bước nhảy stride mà vẫn còn thiếu do lọc bỏ bài ngắn, quét tiếp bài chưa lấy
    if added_asap < needed_asap:
        for i in range(total_rows):
            if added_asap >= needed_asap:
                break
            es_set = p_set[i]
            if es_set not in SCORE_RANGES:
                continue
            item_id = f"asap_{es_set}_{p_id[i]}"
            if item_id in seen_ids:
                continue
            text_clean = clean_asap_text(str(p_essay[i]))
            if len(text_clean.split()) < 35:
                continue
            text_signature = text_clean[:60].lower()
            if text_signature in seen_texts:
                continue

            raw_score = float(p_score[i])
            min_s, max_s = SCORE_RANGES[es_set]
            norm_score = int(round(((raw_score - min_s) / (max_s - min_s)) * 100))
            norm_score = max(0, min(100, norm_score))

            seen_ids.add(item_id)
            seen_texts.add(text_signature)
            final_dataset.append({
                "id": item_id,
                "prompt": PROMPT_TEXTS.get(es_set, "English Argumentative Writing Prompt"),
                "text": text_clean,
                "score": norm_score,
                "level": get_level(norm_score),
                "notes": f"ASAP-AES official benchmark (Set {es_set}, raw score: {raw_score}/{max_s})"
            })
            added_asap += 1

    print(f"[+] Đã chọn lọc sạch {added_asap} bài thi chuẩn từ ASAP-AES.")
    print(f"[*] Tổng số bài viết sạch trong dataset: {len(final_dataset)} bài (100% không trùng lặp).")

    with open(dataset_path, "w", encoding="utf-8") as f:
        json.dump(final_dataset, f, indent=2, ensure_ascii=False)

    print(f"[+] Đã lưu dataset sạch vào: {dataset_path}")

if __name__ == "__main__":
    target = 1000
    if len(sys.argv) > 1:
        try:
            target = int(sys.argv[1])
        except ValueError:
            pass
    download_and_convert(target_total=target)

