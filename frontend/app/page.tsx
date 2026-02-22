import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Vanilla Trace</h1>
        <p className="text-gray-600">
          La traçabilité de la vanille, certifiée et vérifiable.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="rounded bg-emerald-600 px-5 py-2.5 text-white font-medium hover:bg-emerald-700"
          >
            Mon espace
          </Link>
          <Link
            href="/scan"
            className="rounded border border-gray-300 bg-white px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-50"
          >
            Vérifier un lot
          </Link>
        </div>
      </div>
    </main>
  );
}
