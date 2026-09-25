"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  updatePassword,
  sendEmailVerification,
  deleteUser,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, setDoc, updateDoc, serverTimestamp, deleteDoc, onSnapshot } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import {
  type Profile,
  type StudySettings,
  defaultProfile,
  defaultSettings,
  saveProfile,
  loadProfile,
  saveSettings,
  loadSettings,
  mergeStudySettings,
  PROFILE_UPDATED_EVENT,
  SETTINGS_UPDATED_EVENT,
} from "@/lib/profile"

export type UserProfileData = Profile & {
  uid?: string
  photoURL?: string | null
  createdAt?: any
}

type FirestoreUserData = Partial<UserProfileData> &
  Partial<StudySettings> & {
    settings?: unknown
  }

type AuthModalTab = "login" | "register" | "forgot"

type AuthContextType = {
  user: User | null
  userProfile: UserProfileData
  studySettings: StudySettings
  loading: boolean
  isAuthModalOpen: boolean
  authModalTab: AuthModalTab
  openAuthModal: (tab?: AuthModalTab) => void
  closeAuthModal: () => void
  loginWithEmail: (email: string, pass: string) => Promise<void>
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  changePassword: (newPass: string) => Promise<void>
  sendEmailVerificationLink: () => Promise<void>
  deleteUserAccount: () => Promise<void>
  updateProfileData: (data: Partial<UserProfileData>) => Promise<void>
  updateStudySettings: (settings: Partial<StudySettings>) => Promise<void>
  exportUserData: () => string
  importUserData: (jsonString: string) => Promise<{ success: boolean; message: string; count?: number }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfileData>(defaultProfile)
  const [studySettings, setStudySettings] = useState<StudySettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>("login")

  // Đồng bộ cài đặt ban đầu từ localStorage theo tài khoản đang đăng nhập.
  useEffect(() => {
    const uid = user?.uid ?? null
    setStudySettings(loadSettings(uid))
    const handleSettingsUpdate = () => setStudySettings(loadSettings(uid))
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate)
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate)
  }, [user?.uid])

  const openAuthModal = (tab: AuthModalTab = "login") => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  // Lắng nghe thay đổi trạng thái đăng nhập Firebase và dữ liệu user trong Firestore.
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      unsubscribeUserDoc?.()
      unsubscribeUserDoc = null

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid)
        const applyUserDocument = (data: FirestoreUserData, exists: boolean) => {
          if (!exists) {
            const newProfile: UserProfileData = {
              ...defaultProfile,
              name: currentUser.displayName || currentUser.email?.split("@")[0] || defaultProfile.name,
              email: currentUser.email || defaultProfile.email,
              photoURL: currentUser.photoURL || null,
              uid: currentUser.uid,
              joinedDate: new Intl.DateTimeFormat("vi-VN", { month: "2-digit", year: "numeric" }).format(new Date()),
              createdAt: serverTimestamp(),
            }
            const currentLocalSettings = loadSettings(currentUser.uid)
            void setDoc(
              userDocRef,
              {
                ...newProfile,
                settings: currentLocalSettings,
                dailyGoal: currentLocalSettings.dailyGoal,
                dailyMinutes: currentLocalSettings.dailyMinutes,
              },
              { merge: true },
            )
              .then(() => {
                setUserProfile(newProfile)
                saveProfile(newProfile)
                setStudySettings(currentLocalSettings)
                saveSettings(currentLocalSettings, currentUser.uid)
              })
              .catch((err) => {
                console.error("Lỗi khi tạo hồ sơ người dùng trên Firestore:", err)
                setLoading(false)
              })
            return
          }

          const merged: UserProfileData = {
            ...defaultProfile,
            ...data,
            name: data.name || currentUser.displayName || defaultProfile.name,
            email: currentUser.email || data.email || defaultProfile.email,
            photoURL: currentUser.photoURL || data.photoURL || null,
            uid: currentUser.uid,
          }
          // Hỗ trợ cấu trúc Firestore mới lẫn dữ liệu cũ; trường ở cấp user được ưu tiên.
          const mergedSettings = mergeStudySettings(
            loadSettings(currentUser.uid),
            data.settings as Partial<StudySettings> | undefined,
            data,
          )
          setUserProfile(merged)
          saveProfile(merged)
          setStudySettings(mergedSettings)
          saveSettings(mergedSettings, currentUser.uid)
          setLoading(false)
        }

        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (docSnap) => applyUserDocument(docSnap.data() as FirestoreUserData, docSnap.exists()),
          (err) => {
            console.error("Lỗi khi lắng nghe hồ sơ người dùng từ Firestore:", err)
            const fallback: UserProfileData = {
              ...loadProfile(),
              name: currentUser.displayName || currentUser.email?.split("@")[0] || defaultProfile.name,
              email: currentUser.email || defaultProfile.email,
              photoURL: currentUser.photoURL || null,
              uid: currentUser.uid,
            }
            setUserProfile(fallback)
            saveProfile(fallback)
            setStudySettings(loadSettings(currentUser.uid))
            setLoading(false)
          },
        )
      } else {
        // Khách chưa đăng nhập: sử dụng cấu hình local của guest.
        setUserProfile(loadProfile())
        setStudySettings(loadSettings())
        setLoading(false)
      }
    })

    return () => {
      unsubscribeUserDoc?.()
      unsubscribe()
    }
  }, [])

  // Đăng nhập bằng Email & Password
  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass)
    closeAuthModal()
  }

  // Đăng ký bằng Email & Password
  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass)
    if (name.trim() && cred.user) {
      await updateFirebaseProfile(cred.user, { displayName: name.trim() })
    }
    closeAuthModal()
  }

  // Đăng nhập nhanh bằng Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    await signInWithPopup(auth, provider)
    closeAuthModal()
  }

  // Đăng xuất
  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setUserProfile(loadProfile())
    setStudySettings(loadSettings())
  }

  // Quên mật khẩu / Gửi email đặt lại
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  // Đổi mật khẩu tài khoản hiện tại
  const changePassword = async (newPass: string) => {
    if (!user) throw new Error("Bạn chưa đăng nhập!")
    await updatePassword(user, newPass)
  }

  // Gửi link xác thực email
  const sendEmailVerificationLink = async () => {
    if (!user) throw new Error("Bạn chưa đăng nhập!")
    await sendEmailVerification(user)
  }

  // Xóa tài khoản người dùng vĩnh viễn
  const deleteUserAccount = async () => {
    if (!user) throw new Error("Bạn chưa đăng nhập!")
    const uid = user.uid
    try {
      await deleteDoc(doc(db, "users", uid))
    } catch {
      /* Bỏ qua lỗi Firestore nếu không có quyền */
    }

    // Xóa các dữ liệu cục bộ của user
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("learnenglish") || key.startsWith("afl:"))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch {
      /* bỏ qua */
    }

    await deleteUser(user)
    setUser(null)
    setUserProfile(defaultProfile)
    setStudySettings(defaultSettings)
  }

  // Cập nhật thông tin hồ sơ
  const updateProfileData = async (data: Partial<UserProfileData>) => {
    const updated = { ...userProfile, ...data }
    setUserProfile(updated)
    saveProfile(updated)

    if (user) {
      try {
        if (data.name && data.name !== user.displayName) {
          await updateFirebaseProfile(user, { displayName: data.name })
        }
        if (data.photoURL !== undefined && data.photoURL !== user.photoURL) {
          await updateFirebaseProfile(user, { photoURL: data.photoURL })
        }
        const userDocRef = doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          ...data,
          updatedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error("Lỗi khi cập nhật hồ sơ lên Firestore:", err)
      }
    }
  }

  // Cập nhật mục tiêu và cài đặt học tập
  const updateStudySettings = async (settings: Partial<StudySettings>) => {
    const merged = mergeStudySettings(studySettings, settings)
    setStudySettings(merged)
    saveSettings(merged, user?.uid)

    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid)
        await setDoc(
          userDocRef,
          {
            settings: merged,
            dailyGoal: merged.dailyGoal,
            dailyMinutes: merged.dailyMinutes,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      } catch (err) {
        console.error("Lỗi khi đồng bộ cài đặt lên Firestore:", err)
      }
    }
  }

  // Xuất dữ liệu học tập ra chuỗi JSON
  const exportUserData = (): string => {
    const localData: Record<string, any> = {}
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("learnenglish") || key.startsWith("afl:"))) {
          try {
            const raw = localStorage.getItem(key)
            localData[key] = raw ? JSON.parse(raw) : raw
          } catch {
            localData[key] = localStorage.getItem(key)
          }
        }
      }
    }

    const payload = {
      app: "LearnEnglish AFL",
      version: "2.0",
      exportDate: new Date().toISOString(),
      user: {
        email: user?.email ?? userProfile.email,
        name: userProfile.name,
      },
      profile: userProfile,
      studySettings,
      storage: localData,
    }

    return JSON.stringify(payload, null, 2)
  }

  // Khôi phục dữ liệu từ file sao lưu JSON
  const importUserData = async (jsonString: string): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      const parsed = JSON.parse(jsonString)
      let restoredCount = 0

      // Hỗ trợ cả 2 định dạng: gói đầy đủ { storage: { ... } } hoặc map key-value phẳng
      const dataMap = parsed.storage && typeof parsed.storage === "object" ? parsed.storage : parsed

      if (typeof window !== "undefined") {
        for (const [key, value] of Object.entries(dataMap)) {
          if (typeof key === "string" && (key.startsWith("learnenglish") || key.startsWith("afl:"))) {
            const stringVal = typeof value === "string" ? value : JSON.stringify(value)
            localStorage.setItem(key, stringVal)
            restoredCount++
          }
        }
      }

      // Khôi phục profile và settings nếu có
      if (parsed.profile) {
        const mergedProf = { ...userProfile, ...parsed.profile }
        setUserProfile(mergedProf)
        saveProfile(mergedProf)
      }
      if (parsed.studySettings) {
        const mergedSet = mergeStudySettings(studySettings, parsed.studySettings)
        setStudySettings(mergedSet)
        saveSettings(mergedSet, user?.uid)
      }

      // Đồng bộ lên Firestore nếu đã đăng nhập
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid)
          await setDoc(
            userDocRef,
            {
              ...(parsed.profile ? parsed.profile : {}),
              ...(parsed.studySettings
                ? {
                    settings: parsed.studySettings,
                    dailyGoal: parsed.studySettings.dailyGoal,
                    dailyMinutes: parsed.studySettings.dailyMinutes,
                  }
                : {}),
              restoredAt: serverTimestamp(),
            },
            { merge: true }
          )
        } catch (err) {
          console.warn("Không thể đồng bộ toàn bộ lên Firestore:", err)
        }
      }

      // Thông báo cho toàn bộ các trang giao diện cập nhật lại
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
        window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT))
      }

      return {
        success: true,
        count: restoredCount,
        message: `Đã khôi phục thành công ${restoredCount} mục dữ liệu học tập!`,
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Lỗi đọc file: ${err?.message || "Định dạng JSON không hợp lệ"}`,
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        studySettings,
        loading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        changePassword,
        sendEmailVerificationLink,
        deleteUserAccount,
        updateProfileData,
        updateStudySettings,
        exportUserData,
        importUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider")
  }
  return context
}
