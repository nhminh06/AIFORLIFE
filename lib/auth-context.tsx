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
  onAuthStateChanged,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { type Profile, defaultProfile, saveProfile, loadProfile } from "@/lib/profile"

export type UserProfileData = Profile & {
  uid?: string
  photoURL?: string | null
  createdAt?: any
}

type AuthModalTab = "login" | "register" | "forgot"

type AuthContextType = {
  user: User | null
  userProfile: UserProfileData
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
  updateProfileData: (data: Partial<UserProfileData>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfileData>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>("login")

  const openAuthModal = (tab: AuthModalTab = "login") => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  // Lắng nghe thay đổi trạng thái đăng nhập Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid)
          const docSnap = await getDoc(userDocRef)

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfileData
            const merged: UserProfileData = {
              ...defaultProfile,
              ...data,
              name: data.name || currentUser.displayName || defaultProfile.name,
              email: currentUser.email || data.email || defaultProfile.email,
              photoURL: currentUser.photoURL || data.photoURL || null,
              uid: currentUser.uid,
            }
            setUserProfile(merged)
            saveProfile(merged)
          } else {
            // Tạo hồ sơ mới trên Firestore cho tài khoản lần đầu đăng nhập
            const newProfile: UserProfileData = {
              ...defaultProfile,
              name: currentUser.displayName || currentUser.email?.split("@")[0] || defaultProfile.name,
              email: currentUser.email || defaultProfile.email,
              photoURL: currentUser.photoURL || null,
              uid: currentUser.uid,
              joinedDate: new Intl.DateTimeFormat("vi-VN", { month: "2-digit", year: "numeric" }).format(new Date()),
              createdAt: serverTimestamp(),
            }
            await setDoc(userDocRef, newProfile, { merge: true })
            setUserProfile(newProfile)
            saveProfile(newProfile)
          }
        } catch (err) {
          console.error("Lỗi khi tải hồ sơ người dùng từ Firestore:", err)
          // Fallback sang thông tin từ Firebase User Auth
          const fallback: UserProfileData = {
            ...loadProfile(),
            name: currentUser.displayName || currentUser.email?.split("@")[0] || defaultProfile.name,
            email: currentUser.email || defaultProfile.email,
            photoURL: currentUser.photoURL || null,
            uid: currentUser.uid,
          }
          setUserProfile(fallback)
          saveProfile(fallback)
        }
      } else {
        // Khách chưa đăng nhập: Sử dụng profile cục bộ (localStorage)
        setUserProfile(loadProfile())
      }
      setLoading(false)
    })

    return () => unsubscribe()
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
  }

  // Quên mật khẩu / Gửi email đặt lại
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
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

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
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
        updateProfileData,
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
