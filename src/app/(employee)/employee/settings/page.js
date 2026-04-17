"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import Avatar from "@/components/Avatar";
import { updateMe, uploadProfilePic } from "@/services/userService";

export default function EmployeeSettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPreview(user.profilePic?.url || null);
    }
  }, [user]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateMe({ name });
      let finalUser = updated;
      if (file) {
        finalUser = await uploadProfilePic(user._id, file);
      }
      if (setUser)
        setUser({ ...finalUser, role: finalUser.globalRole || finalUser.role });
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <div>Not signed in.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">My Profile</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={name} src={preview} size={12} />
          <div className="flex flex-col">
            <label className="text-sm text-foreground-muted">
              Profile Photo
            </label>
            <input type="file" accept="image/*" onChange={handleFile} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground-muted">
            Full Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-outline rounded bg-surface"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-on-primary rounded"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
