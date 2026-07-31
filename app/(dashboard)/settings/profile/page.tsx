import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileSettingsForm from "./profile-settings-form";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // for users who arent logged in yet; just send them back to the login page

  if (!user) redirect("/auth/login");

  // avatar pfp

  const avatarPath =
    typeof user.user_metadata?.avatar_path === "string"
      ? user.user_metadata.avatar_path
      : null;
  const { data: avatar } = avatarPath
    ? await supabase.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 60 * 60)
    : { data: null };

  return (
    <section className="mx-auto w-full max-w-6xl pb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-slate-600">
          Manage your account, preferences, and privacy.
        </p>
      </div>
      <ProfileSettingsForm
        email={user.email ?? ""}
        metadata={user.user_metadata ?? {}}
        avatarUrl={avatar?.signedUrl ?? null}
      />
    </section>
  );
}
