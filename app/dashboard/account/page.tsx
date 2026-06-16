"use client"

import * as React from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  User, 
  Mail, 
  Link2, 
  ShieldAlert, 
  Trash2, 
  Save, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle,
  Loader2
} from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  
  const [name, setName] = React.useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false)
  
  const [accounts, setAccounts] = React.useState<any[]>([])
  const [isFetchingAccounts, setIsFetchingAccounts] = React.useState(true)
  const [isLinking, setIsLinking] = React.useState(false)
  const [isUnlinking, setIsUnlinking] = React.useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch linked accounts
  const fetchAccounts = React.useCallback(async () => {
    try {
      setIsFetchingAccounts(true)
      const res = await authClient.listAccounts()
      if (res?.data) {
        setAccounts(res.data)
      }
    } catch (err) {
      console.error("Failed to fetch linked accounts:", err)
    } finally {
      setIsFetchingAccounts(false)
    }
  }, [])

  React.useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      fetchAccounts()
    }
  }, [session, fetchAccounts])

  if (sessionPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin size-8 text-black dark:text-white" />
        <p className="text-xs font-bold uppercase tracking-widest mt-4">Loading your credentials...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <ShieldAlert className="size-12 text-[#FF6B6B] mb-4" />
        <h2 className="text-xl font-black uppercase tracking-tighter">Access Denied</h2>
        <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-2">
          You must be logged in to access this page.
        </p>
        <button
          onClick={() => router.push("/signin")}
          className="mt-6 bg-[#FFD93D] dark:bg-[#db6802] text-black dark:text-white border-4 border-black dark:border-white px-5 py-2 font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]"
        >
          Sign In
        </button>
      </div>
    )
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name cannot be empty")
      return
    }

    try {
      setIsUpdatingProfile(true)
      const { error } = await authClient.updateUser({
        name: name,
      })

      if (error) {
        throw new Error(error.message || "Failed to update profile")
      }

      toast.success("Profile updated successfully!")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleLinkGoogle = async () => {
    try {
      setIsLinking(true)
      const { error } = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/dashboard/account",
      })

      if (error) {
        throw new Error(error.message || "Failed to link Google account")
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
      setIsLinking(false)
    }
  }

  const handleUnlinkGoogle = async () => {
    if (accounts.length <= 1) {
      toast.error("Cannot unlink Google. This is your only login method.")
      return
    }

    if (!confirm("Are you sure you want to unlink your Google account?")) {
      return
    }

    try {
      setIsUnlinking(true)
      const { error } = await authClient.unlinkAccount({
        providerId: "google",
      })

      if (error) {
        throw new Error(error.message || "Failed to unlink Google account")
      }

      toast.success("Google account unlinked successfully!")
      await fetchAccounts()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsUnlinking(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== session.user.email) {
      toast.error("Email address does not match your current email.")
      return
    }

    try {
      setIsDeleting(true)
      const { error } = await authClient.deleteUser()

      if (error) {
        if (error.code === "SESSION_EXPIRED_REAUTHENTICATE_TO_PERFORM_THIS_ACTION") {
          toast.error("For security reasons, you must log out and log back in, then try again immediately.")
        } else {
          throw new Error(error.message || "Failed to delete account")
        }
        return
      }

      toast.success("Your account and all associated data have been permanently deleted.")
      router.push("/signin")
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsDeleting(false)
    }
  }

  const isGoogleLinked = accounts.some(a => a.providerId === "google")

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="border-b-4 border-black dark:border-white pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white flex items-center gap-3">
          🧑‍💻 Account Settings
        </h1>
        <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-2 leading-relaxed">
          Manage your personal details, connected social providers, and privacy rights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - User Details */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleUpdateProfile} className="border-4 border-black dark:border-white p-6 bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
            <h2 className="text-lg font-black uppercase tracking-tight border-b-2 border-black dark:border-white pb-3 mb-4 flex items-center gap-2">
              <User className="size-5" /> Profile Details
            </h2>
            
            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FFFDF5] dark:bg-[#1C1C1F] border-4 border-black dark:border-white p-3 font-bold text-sm outline-none focus:bg-[#FFD93D] dark:focus:bg-[#db6802] transition-colors focus:text-black dark:focus:text-white rounded-none"
                  placeholder="Your full name"
                  required
                />
              </div>

              {/* Email Field (Read Only) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60">
                    Email Address
                  </label>
                  <span className="text-[9px] font-black uppercase tracking-wide bg-black/10 dark:bg-white/10 px-1.5 py-0.5 border border-black dark:border-white flex items-center gap-1">
                    <Lock className="size-2.5" /> Locked
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={session.user.email}
                    disabled
                    className="w-full bg-black/5 dark:bg-white/5 border-4 border-black/30 dark:border-white/30 p-3 font-bold text-sm outline-none rounded-none cursor-not-allowed opacity-60 flex items-center"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-[#FFD93D] dark:bg-[#db6802] text-black dark:text-white border-4 border-black dark:border-white px-5 py-2 font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#fff] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="animate-spin size-3.5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Connected Accounts Card */}
          <div className="border-4 border-black dark:border-white p-6 bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
            <h2 className="text-lg font-black uppercase tracking-tight border-b-2 border-black dark:border-white pb-3 mb-4 flex items-center gap-2">
              <Link2 className="size-5" /> Social Logins
            </h2>

            {isFetchingAccounts ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="animate-spin size-6 text-black dark:text-white" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-4 border-black dark:border-white p-4 bg-[#FFFDF5] dark:bg-[#1C1C1F]">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FFD93D] dark:bg-[#db6802] p-2 border-2 border-black dark:border-white">
                      <svg className="size-5 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-xs uppercase">Google Integration</h3>
                      <p className="text-[10px] font-bold text-black/60 dark:text-white/60 uppercase">
                        {isGoogleLinked ? "Connected & Active" : "Not Linked"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 sm:mt-0">
                    {isGoogleLinked ? (
                      <button
                        type="button"
                        onClick={handleUnlinkGoogle}
                        disabled={isUnlinking || accounts.length <= 1}
                        className="bg-[#FF6B6B] dark:bg-red-700 hover:bg-red-600 text-white border-2 border-black dark:border-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                      >
                        {isUnlinking ? "Unlinking..." : "Unlink Google"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLinkGoogle}
                        disabled={isLinking}
                        className="bg-[#FFD93D] dark:bg-[#db6802] text-black dark:text-white border-2 border-black dark:border-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
                      >
                        <PlusCircle className="size-3.5" />
                        {isLinking ? "Connecting..." : "Link Google"}
                      </button>
                    )}
                  </div>
                </div>

                {accounts.length <= 1 && isGoogleLinked && (
                  <p className="text-[9px] font-bold uppercase text-[#FF6B6B] flex items-center gap-1 leading-relaxed">
                    <AlertTriangle className="size-3 shrink-0" />
                    Warning: You cannot unlink Google because it is your only login provider.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Overview & Danger Zone */}
        <div className="space-y-6">
          {/* Avatar Overview Card */}
          <div className="border-4 border-black dark:border-white p-6 bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] text-center">
            <div className="inline-flex border-4 border-black dark:border-white p-1 bg-white mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={session.user.image || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${session.user.name}`} 
                alt={session.user.name} 
                className="size-24 object-cover rounded-none grayscale"
              />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight">{session.user.name}</h3>
            <p className="text-[10px] font-bold text-black/60 dark:text-white/60 lowercase mt-1">{session.user.email}</p>
            <div className="mt-4 border-t-2 border-dashed border-black dark:border-white pt-4">
              <span className="text-[9px] font-black uppercase bg-[#FFD93D] text-black border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Alpha Tester
              </span>
            </div>
          </div>

          {/* Danger Zone (GDPR) */}
          <div className="border-4 border-[#FF6B6B] p-6 bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
            <h2 className="text-sm font-black uppercase tracking-tight text-[#FF6B6B] border-b-2 border-[#FF6B6B] pb-3 mb-4 flex items-center gap-2">
              <Trash2 className="size-4" /> GDPR Danger Zone
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-wide text-black/70 dark:text-white/70 leading-relaxed">
              Permanently erase your account under the Right to be Forgotten (GDPR Art. 17). This erases all data, including your schedules, workflows, and integrations. This action is final.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 w-full bg-[#FF6B6B] hover:bg-red-600 text-white border-2 border-black dark:border-white px-4 py-2 font-black uppercase tracking-wider text-[10px] shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] active:translate-y-px transition-all rounded-none cursor-pointer text-center"
              >
                Delete Account
              </button>
            ) : (
              <div className="mt-4 border-2 border-dashed border-[#FF6B6B] p-3 space-y-3">
                <p className="text-[9px] font-black uppercase text-[#FF6B6B]">
                  Type your current email <span className="underline select-all">{session.user.email}</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  className="w-full bg-[#FFFDF5] dark:bg-[#1C1C1F] border-2 border-black dark:border-white p-2 font-bold text-xs outline-none focus:bg-[#FFD93D] dark:focus:bg-[#db6802] focus:text-black rounded-none"
                  placeholder="Type email to verify"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmEmail("")
                    }}
                    className="flex-1 bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black dark:border-white p-1 text-[9px] font-black uppercase rounded-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmEmail !== session.user.email}
                    className="flex-1 bg-[#FF6B6B] hover:bg-red-600 text-white border border-black p-1 text-[9px] font-black uppercase rounded-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1"
                  >
                    {isDeleting && <Loader2 className="animate-spin size-2.5" />}
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
