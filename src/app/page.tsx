import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-peach-100">
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <h1 className="text-4xl font-bold sm:text-6xl">
            Memory <span className="text-peach-500">Chess</span>
          </h1>
          
          <p className="max-w-2xl text-lg text-peach-200">
            Train your chess memory and visualization skills through interactive exercises
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link 
              href="/game"
              className="rounded-lg bg-peach-500 px-8 py-3 font-semibold text-black transition-all hover:bg-peach-400 hover:shadow-lg"
            >
              Start Training
            </Link>
            
            <Link
              href="/dashboard"
              className="rounded-lg border border-peach-500/30 px-8 py-3 font-semibold text-peach-100 transition-all hover:bg-peach-500/10"
            >
              View Progress
            </Link>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-light bg-gray-dark p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-peach-100">Visualization</h2>
              <p className="text-peach-200">Train your ability to see the board in your mind</p>
            </div>

            <div className="rounded-xl border border-gray-light bg-gray-dark p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-peach-100">Memory</h2>
              <p className="text-peach-200">Remember positions and sequences of moves</p>
            </div>

            <div className="rounded-xl border border-gray-light bg-gray-dark p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-peach-100">Progress</h2>
              <p className="text-peach-200">Track your improvement over time</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
