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
      <div className="mb-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Settings
        </p>
        <h1 className="mt-0.5 text-[28px] font-black tracking-tight text-slate-900">
          Profile & account
        </h1>
      </div>
      <ProfileSettingsForm
        email={user.email ?? ""}
        metadata={user.user_metadata ?? {}}
        avatarUrl={avatar?.signedUrl ?? null}
      />
    </section>
  );
}
