"""
Automated Essay Scoring (AES) Model Training Script
Huấn luyện mô hình Machine Learning dự đoán điểm số bài viết dựa trên đặc trưng NLP:
- Chia tập dữ liệu Train / Test (80 / 20)
- Chuẩn hóa đặc trưng (StandardScaler)
- Huấn luyện Ridge Regression & Random Forest
- Đánh giá bằng R2 Score, RMSE, MAE, Pearson Correlation
- Xuất trọng số mô hình ra file model_weights.json để tích hợp vào ứng dụng
"""

import json
import os
import sys
import numpy as np

# Đảm bảo in tiếng Việt không bị lỗi encoding trên Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Đảm bảo Python luôn tìm thấy các file trong thư mục ml_engine dù chạy từ đâu
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from feature_extractor import NLPFeatureExtractor
except ImportError:
    from ml_engine.feature_extractor import NLPFeatureExtractor

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

FEATURE_NAMES = [
    "word_count",
    "avg_sentence_length",
    "lexical_diversity",
    "advanced_vocab_ratio",
    "flesch_reading_ease",
    "cohesive_density",
]

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, "dataset.json")

    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"[*] Đã tải {len(data)} bài viết từ dataset.json")

    extractor = NLPFeatureExtractor()

    X_list = []
    y_list = []
    ids = []

    for item in data:
        feats = extractor.extract(item["text"])
        row = [feats[name] for name in FEATURE_NAMES]
        X_list.append(row)
        y_list.append(float(item["score"]))
        ids.append(item["id"])

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)

    # Chia train / test (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"[*] Số mẫu tập Train: {len(X_train)} | Tập Test: {len(X_test)}")

    # Chuẩn hóa đặc trưng (Z-score normalization)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Huấn luyện mô hình Ridge Regression (Explainable Linear Model)
    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train_scaled, y_train)

    y_pred_ridge = ridge.predict(X_test_scaled)
    rmse_ridge = np.sqrt(mean_squared_error(y_test, y_pred_ridge))
    mae_ridge = mean_absolute_error(y_test, y_pred_ridge)
    r2_ridge = r2_score(y_test, y_pred_ridge)
    pearson_ridge = np.corrcoef(y_test, y_pred_ridge)[0, 1]

    # 2. Huấn luyện mô hình Random Forest Regressor (Non-linear Ensemble)
    rf = RandomForestRegressor(n_estimators=100, max_depth=4, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    rmse_rf = np.sqrt(mean_squared_error(y_test, y_pred_rf))
    mae_rf = mean_absolute_error(y_test, y_pred_rf)
    r2_rf = r2_score(y_test, y_pred_rf)
    pearson_rf = np.corrcoef(y_test, y_pred_rf)[0, 1]

    # 3. Huấn luyện mô hình Gradient Boosting Regressor (State-of-the-Art Tree Boosting)
    gbr = GradientBoostingRegressor(n_estimators=120, max_depth=3, learning_rate=0.08, random_state=42)
    gbr.fit(X_train, y_train)
    y_pred_gbr = gbr.predict(X_test)
    rmse_gbr = np.sqrt(mean_squared_error(y_test, y_pred_gbr))
    mae_gbr = mean_absolute_error(y_test, y_pred_gbr)
    r2_gbr = r2_score(y_test, y_pred_gbr)
    pearson_gbr = np.corrcoef(y_test, y_pred_gbr)[0, 1]

    print("\n" + "=" * 68)
    print("           KẾT QUẢ ĐÁNH GIÁ THỰC NGHIỆM MÔ HÌNH ML")
    print("=" * 68)
    print(f"{'Mô hình':<28} | {'R2 Score':<10} | {'RMSE':<8} | {'MAE':<8} | {'Pearson (r)':<10}")
    print("-" * 68)
    print(f"{'Ridge Regression (XAI)':<28} | {r2_ridge:<10.4f} | {rmse_ridge:<8.2f} | {mae_ridge:<8.2f} | {pearson_ridge:<10.4f}")
    print(f"{'Random Forest Regressor':<28} | {r2_rf:<10.4f} | {rmse_rf:<8.2f} | {mae_rf:<8.2f} | {pearson_rf:<10.4f}")
    print(f"{'Gradient Boosting (GBDT)':<28} | {r2_gbr:<10.4f} | {rmse_gbr:<8.2f} | {mae_gbr:<8.2f} | {pearson_gbr:<10.4f}")
    print("=" * 68)


    print("\n[*] ĐÓNG GÓP CỦA TỪNG ĐẶC TRƯNG NGÔN NGỮ (Feature Weights in Ridge):")
    for name, coef in zip(FEATURE_NAMES, ridge.coef_):
        sign = "+" if coef >= 0 else "-"
        print(f"  • {name:<22}: {sign} {abs(coef):.3f} điểm ảnh hưởng / độ lệch chuẩn")

    # Xuất trọng số và scaler ra file JSON để tích hợp trực tiếp vào web app (Inference engine)
    model_export = {
        "model_type": "RidgeRegression_AES",
        "feature_names": FEATURE_NAMES,
        "scaler": {
            "mean": scaler.mean_.tolist(),
            "scale": scaler.scale_.tolist(),
        },
        "intercept": float(ridge.intercept_),
        "coefficients": ridge.coef_.tolist(),
        "metrics": {
            "r2_score": float(r2_ridge),
            "rmse": float(rmse_ridge),
            "mae": float(mae_ridge),
            "pearson_r": float(pearson_ridge),
        }
    }

    out_weights_path = os.path.join(base_dir, "model_weights.json")
    with open(out_weights_path, "w", encoding="utf-8") as f:
        json.dump(model_export, f, indent=2, ensure_ascii=False)

    print(f"\n[+] Đã xuất mô hình trọng số thành công: {out_weights_path}")

if __name__ == "__main__":
    main()
