import {
  BedDouble,
  BookOpen,
  Briefcase,
  Camera,
  Car,
  Coffee,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Monitor,
  Moon,
  Music,
  PawPrint,
  Palette,
  Plane,
  ShoppingBag,
  Sun,
  TreePine,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"

export type SetIconOption = {
  /** key lưu vào Firestore (trường VocabSet.icon) */
  key: string
  /** nhãn tiếng Việt hiển thị khi hover */
  label: string
  icon: LucideIcon
}

/**
 * Bộ icon mẫu để người dùng chọn cho cả bộ từ vựng của mình.
 * Key được lưu dạng chuỗi — không lưu class/component để dữ liệu thuần.
 */
export const setIconOptions: SetIconOption[] = [
  { key: "home", label: "Nhà cửa", icon: Home },
  { key: "plane", label: "Du lịch", icon: Plane },
  { key: "briefcase", label: "Công việc", icon: Briefcase },
  { key: "graduation-cap", label: "Học tập", icon: GraduationCap },
  { key: "utensils", label: "Ẩm thực", icon: UtensilsCrossed },
  { key: "heart-pulse", label: "Sức khỏe", icon: HeartPulse },
  { key: "users", label: "Con người", icon: Users },
  { key: "monitor", label: "Công nghệ", icon: Monitor },
  { key: "music", label: "Âm nhạc", icon: Music },
  { key: "shopping-bag", label: "Mua sắm", icon: ShoppingBag },
  { key: "car", label: "Xe cộ", icon: Car },
  { key: "coffee", label: "Cà phê", icon: Coffee },
  { key: "paw-print", label: "Động vật", icon: PawPrint },
  { key: "tree-pine", label: "Thiên nhiên", icon: TreePine },
  { key: "sun", label: "Ban ngày", icon: Sun },
  { key: "moon", label: "Ban đêm", icon: Moon },
  { key: "bed-double", label: "Ngủ nghỉ", icon: BedDouble },
  { key: "book-open", label: "Sách vở", icon: BookOpen },
  { key: "camera", label: "Chụp ảnh", icon: Camera },
  { key: "gamepad", label: "Trò chơi", icon: Gamepad2 },
  { key: "dumbbell", label: "Thể thao", icon: Dumbbell },
  { key: "palette", label: "Nghệ thuật", icon: Palette },
]

/** Lấy component icon của bộ từ từ key đã lưu (trả về null nếu không có/không hợp lệ) */
export function getSetIcon(key?: string): LucideIcon | null {
  if (!key) return null
  return setIconOptions.find((o) => o.key === key)?.icon ?? null
}
