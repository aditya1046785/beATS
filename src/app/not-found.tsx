import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0a0a0f] px-6 text-center text-white">
      <div>
        <p className="font-code text-7xl font-bold text-indigo-300">404</p>
        <h1 className="mt-5 text-3xl font-bold">This page doesn&apos;t exist.</h1>
        <p className="mt-3 text-zinc-500">But your next job opportunity does.</p>
        <Link href="/dashboard" className="mt-8 inline-flex rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400">← Go to Dashboard</Link>
      </div>
    </main>
  );
}
