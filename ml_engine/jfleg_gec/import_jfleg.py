"""
Tải và xử lý bộ dữ liệu JFLEG (~1.500 câu gốc của người học + 6.000 câu sửa của người bản xứ)
Nguồn: Johns Hopkins University (JHU) FLuency-Extended GUG Dataset
"""

import urllib.request
import re
import json
import os
import sys

# Đảm bảo in UTF-8 trên Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "https://raw.githubusercontent.com/keisks/jfleg/master"

FILES = [
    ("dev/dev.src", "dev.src"),
    ("dev/dev.ref0", "dev.ref0"),
    ("dev/dev.ref1", "dev.ref1"),
    ("dev/dev.ref2", "dev.ref2"),
    ("dev/dev.ref3", "dev.ref3"),
    ("test/test.src", "test.src"),
    ("test/test.ref0", "test.ref0"),
    ("test/test.ref1", "test.ref1"),
    ("test/test.ref2", "test.ref2"),
    ("test/test.ref3", "test.ref3"),
]

def detokenize(text: str) -> str:
    """Khôi phục khoảng trắng và dấu câu tiếng Anh tự nhiên từ định dạng tokenized của JFLEG"""
    s = text.strip()
    # Dấu nháy đơn rút gọn
    s = re.sub(r"\s+([’'])\s*(s|m|d|ll|re|ve|t)\b", r"'\2", s, flags=re.IGNORECASE)
    s = re.sub(r"\bn\s+['’]\s*t\b", "n't", s, flags=re.IGNORECASE)
    s = re.sub(r"\bca\s+n't\b", "can't", s, flags=re.IGNORECASE)
    s = re.sub(r"\bwo\s+n't\b", "won't", s, flags=re.IGNORECASE)
    # Dấu câu liền trước
    s = re.sub(r"\s+([.,!?;:)\]}])", r"\1", s)
    s = re.sub(r"([(\[{])\s+", r"\1", s)
    s = re.sub(r"\s+-\s+", "-", s)
    s = re.sub(r"\s+/\s+", "/", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def download_file(rel_path: str) -> str:
    url = f"{BASE_URL}/{rel_path}"
    print(f"-> Đang tải {rel_path} từ GitHub...")
    req = urllib.request.Request(url, headers={"User-Agent": "AFL-Downloader/1.0"})
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8")

def process_split(split_name: str):
    src_text = download_file(f"{split_name}/{split_name}.src")
    src_lines = [line.strip() for line in src_text.splitlines() if line.strip()]

    refs = []
    for r in range(4):
        ref_text = download_file(f"{split_name}/{split_name}.ref{r}")
        ref_lines = [line.strip() for line in ref_text.splitlines() if line.strip()]
        refs.append(ref_lines)

    results = []
    for i, orig in enumerate(src_lines):
        corrections = []
        for r in range(4):
            if i < len(refs[r]) and refs[r][i]:
                clean_corr = detokenize(refs[r][i])
                if clean_corr and clean_corr not in corrections:
                    corrections.append(clean_corr)

        clean_orig = detokenize(orig)
        results.append({
            "id": f"{split_name}-{i+1}",
            "original": clean_orig,
            "corrections": corrections,
            "split": split_name
        })
    return results

def main():
    print("=== BẮT ĐẦU TẢI & XỬ LÝ BỘ DATASET JFLEG (~1.500 CẶP CÂU) ===")
    dev_data = process_split("dev")
    test_data = process_split("test")

    all_data = dev_data + test_data
    print(f"\n✓ Đã tải và xử lý thành công: {len(all_data)} câu của người học!")
    total_corrections = sum(len(item["corrections"]) for item in all_data)
    print(f"✓ Tổng số câu sửa chữa từ người bản ngữ: {total_corrections} câu")

    datasets_dir = os.path.join(os.path.dirname(__file__), "..", "datasets")
    os.makedirs(datasets_dir, exist_ok=True)
    out_path = os.path.join(datasets_dir, "jfleg_dataset.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Đã lưu dataset vào: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")

if __name__ == "__main__":
    main()
