import { PrototypeStateGallery } from "@/components/PrototypeStates";

export default function DevUiStatesPage() {
  return (
    <main className="atlas-shell py-8">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Internal preview</p>
        <h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924]">UI States</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6256]">
          Internal development preview only. This page is intentionally not linked from user navigation.
        </p>
      </section>
      <PrototypeStateGallery pageName="Atlas views" />
    </main>
  );
}
