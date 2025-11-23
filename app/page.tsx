import Link from 'next/link';
import { BookOpen, Sword, Shield, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-navy to-primary-900">
      {/* Hero Section */}
      <main className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-4xl">
          {/* Logo/Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl"></div>
            <div className="relative p-6 bg-gradient-to-br from-primary-500/30 to-accent/30 rounded-full border-2 border-primary-500/50 shadow-2xl">
              <BookOpen className="w-16 h-16 text-primary-400" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-300 to-accent">
              Study Quest
            </h1>
            <div className="flex items-center justify-center gap-2 text-primary-400">
              <Sparkles className="w-5 h-5" />
              <p className="text-xl sm:text-2xl font-semibold text-light/90">
                Your Academic Adventure Awaits
              </p>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Description */}
          <p className="max-w-2xl text-lg sm:text-xl leading-8 text-light/80">
            Transform your studies into an epic quest. Manage courses, track assignments, and level up your academic journey with our gamified study planning platform.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 w-full max-w-3xl">
            <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6 hover:border-primary-500/50 transition-all transform hover:scale-105">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary-500/20 rounded-xl">
                  <Sword className="w-8 h-8 text-primary-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-light mb-2">Browse Quests</h3>
              <p className="text-sm text-light/70">
                Discover and enroll in courses that match your learning goals
              </p>
            </div>

            <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-accent/20 rounded-2xl p-6 hover:border-accent/50 transition-all transform hover:scale-105">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-accent/20 rounded-xl">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-light mb-2">Track Progress</h3>
              <p className="text-sm text-light/70">
                Monitor assignments, deadlines, and your academic achievements
              </p>
            </div>

            <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-green-500/20 rounded-2xl p-6 hover:border-green-500/50 transition-all transform hover:scale-105">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-light mb-2">Level Up</h3>
              <p className="text-sm text-light/70">
                Visualize your progress and celebrate your learning milestones
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
            <Link
              href="/auth"
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-lg"
            >
              <span>Begin Your Quest</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/courses"
              className="px-8 py-4 bg-dark-navy/80 backdrop-blur-sm border-2 border-primary-500/30 text-primary-400 font-semibold rounded-xl hover:border-primary-500/50 hover:bg-primary-500/10 transition-all"
            >
              Explore Courses
            </Link>
          </div>

          {/* Stats or Additional Info */}
          <div className="mt-12 pt-8 border-t border-primary-500/20">
            <p className="text-sm text-light/60">
              Join students and administrators on their academic journey
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-10 left-10 w-20 h-20 bg-primary-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl"></div>
      </main>
    </div>
  );
}

