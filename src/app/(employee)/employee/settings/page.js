"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import Avatar from "@/components/Avatar";
import { updateMe, uploadProfilePic } from "@/services/userService";
import {
  Camera,
  Mail,
  Building2,
  Crown,
  Edit3,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

// ─── Profile Section Component ─────────────────────────────────
function ProfileSection({ user, setUser }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPreview(user.profilePic?.url || null);
    }
  }, [user]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }
    setError(null);
    setFile(f);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setIsEditing(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please drop an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }
    setError(null);
    setFile(f);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateMe({ name });
      let finalUser = updated;
      if (file) {
        finalUser = await uploadProfilePic(user._id, file);
      }
      if (setUser) {
        setUser({ ...finalUser, role: finalUser.globalRole || finalUser.role });
      }
      setSaved(true);
      setIsEditing(false);
      setFile(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setPreview(user?.profilePic?.url || null);
    setFile(null);
    setError(null);
    setIsEditing(false);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  };

  const roleLabel = user?.globalRole || user?.role;
  const roleDisplay = roleLabel
    ?.replace(/_/g, " ")
    ?.replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="border border-outline bg-surface-low overflow-hidden">
      {/* Header Banner */}
      <div className="relative h-24 bg-linear-to-r from-primary/20 via-primary/10 to-surface-container">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] animate-pulse" />
      </div>

      <div className="px-6 pb-6 -mt-12">
        {/* Avatar and Main Info Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Avatar with Upload */}
          <div
            className={`relative group cursor-pointer transition-all duration-300 ${
              isDragging ? "scale-105" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className={`relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface-low transition-all duration-300 ${
                isDragging
                  ? "ring-primary ring-offset-2 ring-offset-primary/20"
                  : "hover:ring-primary/50"
              }`}
            >
              <Avatar name={name} src={preview} size={24} />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {/* Drag Overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">Drop Image</span>
                </div>
              )}
            </div>
            {/* Edit Badge */}
            <button
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* User Info */}
          <div className="flex-1 pt-14 sm:pt-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h2 className="text-xl font-bold text-foreground truncate">
                {user?.name || "User"}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full w-fit">
                <Crown className="w-3 h-3" />
                {roleDisplay}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-2 text-sm text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email || "No email"}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {user?.companyId?.companyName || "Your Company"}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
              isEditing
                ? "bg-surface-container text-foreground-muted hover:text-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? "Close" : "Edit Profile"}
          </button>
        </div>

        {/* Expanded Edit Form */}
        <div
          className={`mt-6 transition-all duration-300 overflow-hidden ${
            isEditing ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-outline pt-4 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Success Message */}
            {saved && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
                <Check className="w-3.5 h-3.5 shrink-0" />
                Profile updated successfully
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors rounded"
                placeholder="Enter your full name"
              />
            </div>

            {/* Photo Upload Hint */}
            <div className="flex items-start gap-2 text-xs text-foreground-muted">
              <Camera className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Click on your avatar or drag and drop an image to upload a new profile photo.
                Supports JPG, PNG up to 5MB.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 border border-outline text-foreground-muted text-xs font-bold uppercase tracking-wider rounded hover:border-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeSettingsPage() {
  const { user, setUser } = useAuth();

  if (!user) return <div>Not signed in.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <ProfileSection user={user} setUser={setUser} />
    </div>
  );
}
