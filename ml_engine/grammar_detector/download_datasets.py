"""
Tải và Hợp nhất Dataset cho Grammar Error Detection (GED)
Nguồn:
  1. CoLA (Corpus of Linguistic Acceptability) — 10,657 câu, label 0/1
     https://nyu-mll.github.io/CoLA/
     Raw: https://raw.githubusercontent.com/nyu-mll/CoLa/master/data/
  2. agentlans/grammar-classification (từ C4_200M) — 600K câu, label 0/1
     Tải sample đại diện 20,000 câu từ HuggingFace raw JSONL
  3. JFLEG (đã có sẵn trong datasets/) — 6,000 cặp câu

Output: ml_engine/datasets/ged_combined_dataset.json
Format:
  [{ "text": "...", "label": 0|1, "source": "cola|c4m|jfleg" }, ...]
  label=1 → grammatically correct
  label=0 → has error
"""

import json
import os
import sys
import random

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import requests
except ImportError:
    print("[!] Cần cài requests: python -m pip install requests")
    sys.exit(1)

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(CURRENT_DIR, "..", "datasets")
OUTPUT_PATH = os.path.join(DATASETS_DIR, "ged_combined_dataset.json")
JFLEG_PATH = os.path.join(DATASETS_DIR, "jfleg_dataset.json")

os.makedirs(DATASETS_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────
# 1. CoLA Dataset (Corpus of Linguistic Acceptability)
# ─────────────────────────────────────────────────────────
COLA_URLS = {
    "train": "https://raw.githubusercontent.com/nyu-mll/CoLA/master/data/tokenized/en_train_tokenized.txt",
    "dev":   "https://raw.githubusercontent.com/nyu-mll/CoLA/master/data/tokenized/en_dev_tokenized.txt",
}
# Correct repo: nyu-mll/CoLA-baselines, path: acceptability_corpus/raw/
COLA_URLS_IN_DOMAIN = {
    "train": "https://raw.githubusercontent.com/nyu-mll/CoLA-baselines/master/acceptability_corpus/raw/in_domain_train.tsv",
    "dev":   "https://raw.githubusercontent.com/nyu-mll/CoLA-baselines/master/acceptability_corpus/raw/in_domain_dev.tsv",
    "out_of_domain_dev": "https://raw.githubusercontent.com/nyu-mll/CoLA-baselines/master/acceptability_corpus/raw/out_of_domain_dev.tsv",
}

def load_cola() -> list[dict]:
    """Tải CoLA dataset từ GitHub (in-domain TSV format)."""
    records = []
    for split, url in COLA_URLS_IN_DOMAIN.items():
        print(f"  ↓ Đang tải CoLA {split}: {url}")
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
        except Exception as e:
            print(f"  [!] Lỗi tải CoLA {split}: {e}")
            continue

        for line in r.text.strip().split("\n"):
            parts = line.split("\t")
            # format: source \t acceptable \t original_acceptability \t sentence
            if len(parts) < 4:
                continue
            label = int(parts[1].strip())  # 0 hoặc 1
            sentence = parts[3].strip()
            if len(sentence) < 5:
                continue
            records.append({
                "text": sentence,
                "label": label,
                "source": "cola",
                "split": split,
            })

    print(f"  ✅ CoLA: {len(records)} câu")
    return records


# ─────────────────────────────────────────────────────────
# 2. agentlans/grammar-classification (C4_200M subset)
#    Tải từ HuggingFace data files (parquet → JSONL)
# ─────────────────────────────────────────────────────────
# HuggingFace raw parquet URL (public repo)
C4M_HF_URL = "https://huggingface.co/datasets/agentlans/grammar-classification/resolve/main/data/train-00000-of-00012.parquet"
C4M_JSONL_FALLBACK = "https://huggingface.co/datasets/agentlans/grammar-classification/resolve/main/train.jsonl"

# Số câu C4M tối đa được lấy. Mặc định 150K để vượt mốc 100K dòng sau dedup.
# Ghi đè bằng biến môi trường:  set GED_C4M_SAMPLE=200000
C4M_SAMPLE_SIZE = int(os.environ.get("GED_C4M_SAMPLE", "150000"))

def load_c4m_grammar() -> list[dict]:
    """Tải grammar-classification dataset từ HuggingFace."""
    records = []
    
    # Thử tải file JSONL trực tiếp
    for url in [C4M_JSONL_FALLBACK, C4M_HF_URL]:
        print(f"  ↓ Thử tải C4M grammar dataset từ: {url}")
        try:
            r = requests.get(url, timeout=60, stream=True)
            r.raise_for_status()
            content_type = r.headers.get("content-type", "")
            
            if "json" in content_type or url.endswith(".jsonl"):
                # Đọc JSONL line-by-line
                lines = r.iter_lines()
                count = 0
                for line_bytes in lines:
                    if count >= C4M_SAMPLE_SIZE:
                        break
                    if not line_bytes:
                        continue
                    try:
                        obj = json.loads(line_bytes)
                        text = obj.get("text", "").strip()
                        label = int(obj.get("grammar", obj.get("label", -1)))
                        if len(text) < 5 or label not in (0, 1):
                            continue
                        records.append({
                            "text": text,
                            "label": label,
                            "source": "c4m",
                        })
                        count += 1
                    except Exception:
                        continue
                print(f"  ✅ C4M grammar: {len(records)} câu (JSONL)")
                return records
        except Exception as e:
            print(f"  [!] Lỗi tải C4M: {e}")
            continue
    
    # Fallback: thử tải từ raw HF dataset viewer API
    print("  ↓ Thử HuggingFace Datasets API (viewer)...")
    try:
        api_url = "https://datasets-server.huggingface.co/rows?dataset=agentlans%2Fgrammar-classification&config=default&split=train&offset=0&length=100"
        r = requests.get(api_url, timeout=30)
        r.raise_for_status()
        data = r.json()
        rows = data.get("rows", [])
        
        # Fetch nhiều batch
        batch_size = 100
        max_rows = C4M_SAMPLE_SIZE
        for offset in range(0, max_rows, batch_size):
            api_url = f"https://datasets-server.huggingface.co/rows?dataset=agentlans%2Fgrammar-classification&config=default&split=train&offset={offset}&length={batch_size}"
            try:
                r = requests.get(api_url, timeout=30)
                r.raise_for_status()
                data = r.json()
                rows = data.get("rows", [])
                if not rows:
                    break
                for row in rows:
                    row_data = row.get("row", {})
                    text = row_data.get("text", "").strip()
                    label = int(row_data.get("grammar", row_data.get("label", -1)))
                    if len(text) < 5 or label not in (0, 1):
                        continue
                    records.append({
                        "text": text,
                        "label": label,
                        "source": "c4m",
                    })
                if len(records) >= max_rows:
                    break
                print(f"    ...đã tải {len(records)}/{max_rows} câu", end="\r")
            except Exception as e:
                print(f"\n  [!] Lỗi batch offset={offset}: {e}")
                break
    except Exception as e:
        print(f"  [!] Lỗi API HuggingFace: {e}")

    print(f"  ✅ C4M grammar (API): {len(records)} câu")
    return records


# ─────────────────────────────────────────────────────────
# 3. JFLEG (đã có trong datasets/)
# ─────────────────────────────────────────────────────────
def load_jfleg() -> list[dict]:
    """Chuyển JFLEG sang format binary GED label."""
    if not os.path.exists(JFLEG_PATH):
        print(f"  [!] Không tìm thấy JFLEG tại {JFLEG_PATH}")
        return []

    with open(JFLEG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    for item in data:
        orig = item.get("original", "").strip()
        corrections = item.get("corrections", [])

        if not orig:
            continue

        # Nếu original == tất cả corrections → câu đúng (label=1)
        num_corrections = len(corrections)
        if num_corrections == 0:
            continue

        all_same = all(c.strip() == orig for c in corrections if c.strip())
        label = 1 if all_same else 0

        records.append({
            "text": orig,
            "label": label,
            "source": "jfleg",
        })

        # Thêm câu đúng (corrections) làm dữ liệu label=1
        for corr in corrections:
            corr = corr.strip()
            if corr and corr != orig and len(corr) > 5:
                records.append({
                    "text": corr,
                    "label": 1,
                    "source": "jfleg_corrected",
                })

    print(f"  ✅ JFLEG: {len(records)} câu")
    return records


# ─────────────────────────────────────────────────────────
# Hợp nhất & Lưu
# ─────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("🔍 TẢI DATASET CHO GRAMMAR ERROR DETECTION")
    print("=" * 60)

    all_records = []

    print("\n[1/3] CoLA Dataset (Linguistic Acceptability)")
    cola = load_cola()
    all_records.extend(cola)

    print("\n[2/3] JFLEG Dataset (đã có sẵn)")
    jfleg = load_jfleg()
    all_records.extend(jfleg)

    print("\n[3/3] C4_200M Grammar Classification (HuggingFace)")
    c4m = load_c4m_grammar()
    all_records.extend(c4m)

    # Dedup + loại bỏ xung đột nhãn bằng hàm dùng chung
    sys.path.insert(0, CURRENT_DIR)
    from data_utils import dedupe_records

    unique_records, dedup_stats = dedupe_records(all_records)

    print(f"\n  - Bỏ rỗng/quá ngắn: {dedup_stats['dropped_empty']:,}")
    print(f"  - Bỏ trùng lặp   : {dedup_stats['dropped_duplicate']:,}")
    print(f"  - Bỏ xung đột nhãn: {dedup_stats['dropped_conflict']:,}")

    random.shuffle(unique_records)

    # Thống kê
    label_0 = sum(1 for r in unique_records if r["label"] == 0)
    label_1 = sum(1 for r in unique_records if r["label"] == 1)
    sources = {}
    for r in unique_records:
        src = r["source"]
        sources[src] = sources.get(src, 0) + 1

    print("\n" + "=" * 60)
    print(f"📊 TỔNG KẾT DATASET HỢP NHẤT")
    print("=" * 60)
    print(f"  Tổng câu (unique): {len(unique_records):,}")
    print(f"  Label=1 (Đúng)   : {label_1:,} ({label_1/len(unique_records)*100:.1f}%)")
    print(f"  Label=0 (Có lỗi) : {label_0:,} ({label_0/len(unique_records)*100:.1f}%)")
    print(f"  Theo nguồn:")
    for src, cnt in sorted(sources.items()):
        print(f"    - {src}: {cnt:,}")

    print(f"\n💾 Đang lưu vào: {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(unique_records, f, ensure_ascii=False, indent=2)

    print(f"✅ Xong! {len(unique_records):,} câu đã lưu vào ged_combined_dataset.json")


if __name__ == "__main__":
    main()
