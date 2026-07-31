import AppearanceSettings from "./appearance-settings";

export default function AppearanceSettingsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl pb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-600">Manage your account, preferences, and privacy.</p>
      </div>
      <AppearanceSettings />
    </section>
  );
}
