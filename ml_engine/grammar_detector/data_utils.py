"""
Data utilities dùng chung cho pipeline Grammar Error Detection (GED).

Mục tiêu: đảm bảo MỖI LẦN chạy `npm run ml:train:ged` đều dùng tập dữ liệu
sạch (không trùng lặp) và KHÁC NHAU so với lần chạy trước.

Các chức năng chính:
  - normalize_text()     : chuẩn hoá câu để so khớp trùng lặp mạnh hơn
  - dedupe_records()     : loại trùng lặp + giải quyết xung đột nhãn
  - get_run_seed()       : sinh seed KHÁC NHAU cho mỗi lần chạy
  - stratified_sample()  : lấy mẫu cân bằng theo nhãn
  - fingerprint()        : hash tập dữ liệu để chứng minh 2 lần chạy khác nhau
"""

import hashlib
import os
import random
import re
import time

# Nhãn trong GED: 0 = câu có lỗi, 1 = câu chuẩn bản xứ
LABEL_ERROR = 0
LABEL_CORRECT = 1

# Độ ưu tiên nguồn dữ liệu (số càng cao càng đáng tin cậy)
SOURCE_PRIORITY = {
    "jfleg": 3,
    "jfleg_corrected": 3,
    "cola": 2,
    "c4m": 1,
}

_WS_RE = re.compile(r"\s+")
_NON_ALNUM_RE = re.compile(r"[^a-z0-9 ]")


def normalize_text(text: str) -> str:
    """Chuẩn hoá câu để dùng làm khoá so khớp trùng lặp.

    Hạ chữ thường, gộp khoảng trắng, chuẩn hoá dấu nháy unicode.
    """
    if not isinstance(text, str):
        return ""
    lowered = text.lower().strip()
    for src, dst in (
        ("\u2019", "'"),
        ("\u2018", "'"),
        ("\u201c", '"'),
        ("\u201d", '"'),
    ):
        lowered = lowered.replace(src, dst)
    return _WS_RE.sub(" ", lowered).strip()


def dedupe_key(text: str) -> str:
    """Khoá dedup chuẩn hoá chữ thường & khoảng trắng, giữ dấu câu để tránh xoá oan cặp câu tương phản."""
    return normalize_text(text)


def dedupe_records(records: list[dict]) -> tuple[list[dict], dict]:
    """Loại trùng lặp và giải quyết xung đột nhãn.

    Args:
        records: list[{"text": str, "label": 0|1, "source": str}, ...]

    Returns:
        (unique_records, stats)

    Quy tắc:
      1. Bỏ bản ghi có text rỗng hoặc quá ngắn (< 5 ký tự sau chuẩn hoá).
      2. Trùng khoá + TRÙNG nhãn   -> giữ 1 bản, ưu tiên nguồn chất lượng cao.
      3. Trùng khoá + KHÁC nhãn  -> xung đột, huỷ cả nhóm (không thể huấn luyện).
    """
    stats = {
        "input_rows": len(records),
        "dropped_empty": 0,
        "dropped_duplicate": 0,
        "dropped_conflict": 0,
    }

    groups: dict[str, list[dict]] = {}

    for rec in records:
        text = rec.get("text")
        if not isinstance(text, str):
            stats["dropped_empty"] += 1
            continue

        key = dedupe_key(text)
        if len(key) < 5:
            stats["dropped_empty"] += 1
            continue

        groups.setdefault(key, []).append({
            "text": text.strip(),
            "label": int(rec.get("label", LABEL_ERROR)),
            "source": rec.get("source", "unknown"),
        })

    unique_records: list[dict] = []

    for group in groups.values():
        labels = {r["label"] for r in group}

        if len(labels) > 1:
            # Cùng một câu vừa "có lỗi" vừa "chuẩn" -> nhãn mâu thuẫn, loại bỏ
            stats["dropped_conflict"] += len(group)
            continue

        if len(group) > 1:
            stats["dropped_duplicate"] += len(group) - 1

        best = max(
            group,
            key=lambda r: (SOURCE_PRIORITY.get(r["source"], 1), -len(r["text"])),
        )
        unique_records.append(best)

    stats["output_rows"] = len(unique_records)
    return unique_records, stats


def get_run_seed(explicit=None) -> tuple[int, bool]:
    """Sinh seed cho lần chạy hiện tại.

    Thứ tự ưu tiên:
      1. Tham số truyền vào.
      2. Biến môi trường GED_RUN_SEED (ép cứng để tái lập kết quả).
      3. Fallback: random -> MỖI LẦN CHẠY RA KHÁC NHAU.

    Returns:
        (seed, is_fixed) — is_fixed=True nghĩa là bị ép cứng, các lần chạy
        sẽ cho kết quả giống hệt nhau.
    """
    raw = explicit if explicit is not None else os.environ.get("GED_RUN_SEED")

    if raw is not None and str(raw).strip() != "":
        raw = str(raw).strip()
        if raw.lower() not in ("random", "auto", "none"):
            try:
                return int(raw) & 0x7FFFFFFF, True
            except ValueError:
                print(f"  [!] GED_RUN_SEED khong hop le ({raw!r}), dung seed ngau nhien.")

    return random.randrange(1, 2**31 - 1) & 0x7FFFFFFF, False


def stratified_sample(
    records: list[dict],
    seed: int,
    max_samples: int | None = None,
    min_ratio: float = 0.9,
) -> tuple[list[dict], dict]:
    """Lấy mẫu cân bằng theo nhãn, dùng `seed` để xáo trộn.

    Vì seed khác nhau mỗi lần chạy, hàm này chọn ra tập mẫu KHÁC NHAU ->
    dữ liệu train không lặp lại giữa 2 lần chạy.

    Cơ chế đảm bảo KHÁC NHAU (quan trọng):
        Nếu chỉ xáo trộn rồi lấy `[:n]`, khi tập dữ liệu vừa khít với `n` thì
        mọi lần chạy đều chọn đúng những dòng đó (chỉ khác thứ tự).
        Vì vậy ở đây ta dùng "cửa sổ trượt": offset bắt đầu lấy mẫu cũng được
        xáo trộn theo seed, cộng với kích thước mẫu ngẫu nhiên trong
        [min_ratio, 1.0] × số lớn nhỏ nhất.

    Args:
        records: danh sách record đã dedupe.
        seed: seed xáo trộn.
        max_samples: số mẫu tối đa. None = tự cân bằng 1:1 theo lớp nhỏ nhất.
        min_ratio: tỉ lệ số mẫu tối thiểu so với mức tối đa (0.9 = lấy 90-100%).

    Returns:
        (sampled_records, stats)
    """
    rng = random.Random(seed)

    by_label: dict[int, list[dict]] = {LABEL_ERROR: [], LABEL_CORRECT: []}
    for rec in records:
        by_label.setdefault(int(rec.get("label", LABEL_ERROR)), []).append(rec)

    for bucket in by_label.values():
        rng.shuffle(bucket)

    total_available = len(records)
    n_error_avail = len(by_label[LABEL_ERROR])
    n_correct_avail = len(by_label[LABEL_CORRECT])
    smaller_avail = min(n_error_avail, n_correct_avail)

    # Kích thước mẫu mong muốn (đã cân bằng 1:1)
    if max_samples is None:
        want = smaller_avail
    else:
        want = min(smaller_avail, max_samples // 2)

    # Kích thước thực tế: ngẫu nhiên trong [min_ratio, 1.0] × want
    ratio = min_ratio + (1.0 - min_ratio) * rng.random()
    size = max(1, min(want, int(want * ratio)))

    # Cửa sổ trượt: offset ngẫu nhiên để không bao giờ chọn lại đúng vị trí cũ
    def _window(bucket: list[dict], n: int) -> list[dict]:
        if len(bucket) <= n:
            return list(bucket)
        offset = rng.randrange(len(bucket) - n + 1)
        return bucket[offset:offset + n]

    sampled = _window(by_label[LABEL_ERROR], size) + _window(by_label[LABEL_CORRECT], size)
    rng.shuffle(sampled)

    stats = {
        "total_available": total_available,
        "total_selected": len(sampled),
        "error_count": sum(1 for r in sampled if int(r["label"]) == LABEL_ERROR),
        "correct_count": sum(1 for r in sampled if int(r["label"]) == LABEL_CORRECT),
        "balanced_capacity": smaller_avail,
        "available_by_label": {str(k): len(v) for k, v in by_label.items()},
        "available_by_source": _count_by(records, "source"),
        "selected_by_source": _count_by(sampled, "source"),
    }
    return sampled, stats



def _count_by(records: list[dict], field: str) -> dict:
    counts: dict = {}
    for rec in records:
        key = rec.get(field, "unknown")
        counts[key] = counts.get(key, 0) + 1
    return dict(sorted(counts.items()))


def fingerprint(texts) -> str:
    """Hash của tập câu đã train — chứng minh 2 lần chạy khác nhau."""
    digest = hashlib.sha256()
    for text in sorted(texts):
        digest.update(text.encode("utf-8", "ignore"))
        digest.update(b"\n")
    return digest.hexdigest()[:16]


def run_timestamp() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S")
