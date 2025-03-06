import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <h1 className="text-4xl font-bold sm:text-6xl">
            Memory Chess
          </h1>
          
          <p className="max-w-2xl text-lg text-gray-300">
            Train your chess memory and visualization skills through interactive exercises
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link 
              href="/game"
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Start Training
            </Link>
            
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/20 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              View Progress
            </Link>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h2 className="mb-2 text-xl font-semibold">Visualization</h2>
              <p className="text-gray-400">Train your ability to see the board in your mind</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h2 className="mb-2 text-xl font-semibold">Memory</h2>
              <p className="text-gray-400">Remember positions and sequences of moves</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h2 className="mb-2 text-xl font-semibold">Progress</h2>
              <p className="text-gray-400">Track your improvement over time</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
