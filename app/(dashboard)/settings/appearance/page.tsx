import AppearanceSettings from "./appearance-settings";

export default function AppearanceSettingsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl pb-8">
      <div className="mb-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Settings
        </p>
        <h1 className="mt-0.5 text-[28px] font-black tracking-tight text-slate-900">
          Appearance
        </h1>
      </div>
      <AppearanceSettings />
    </section>
  );
}
