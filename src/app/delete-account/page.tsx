'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // In a real app, this would send a deletion request email
    // For now, we show a confirmation message
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Insta
          </Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Back to App
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Delete My Account & Data</h1>
          <p className="text-sm text-white/40 mb-8">Last updated: September 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Your Right to Delete</h2>
              <p>
                You have the right to request deletion of your personal data and account at any time. 
                This includes your profile information, video imports, generated clips, and any connected third-party accounts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">What Gets Deleted</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your account profile (name, email, authentication data)</li>
                <li>All imported YouTube videos and their metadata</li>
                <li>All generated video clips and associated files</li>
                <li>Connected Instagram account tokens and OAuth data</li>
                <li>Job history and processing logs</li>
                <li>Schedules and batch records</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">How to Request Deletion</h2>
              <p>You can request data deletion in two ways:</p>
              
              <div className="mt-4 space-y-4">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-base font-semibold text-white mb-2">Option 1: From Within the App</h3>
                  <p className="text-sm">
                    Log in to your Insta account and delete your account from the dashboard settings. 
                    This will immediately remove all your data.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-base font-semibold text-white mb-2">Option 2: Submit a Request</h3>
                  <p className="text-sm mb-4">
                    Enter your email address below and we will process your deletion request within 30 days.
                  </p>
                  
                  {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      {error && <p className="text-xs text-red-400">{error}</p>}
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-red-500/20 text-red-300 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-colors border border-red-500/20"
                      >
                        Request Data Deletion
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <p className="text-sm text-green-300">
                        Your deletion request has been received. We will process it within 30 days and confirm via email.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Third-Party Data</h2>
              <p>
                If you connected your Instagram account, we recommend you also revoke app access from your Instagram settings:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Go to Instagram → Settings → Apps and Websites</li>
                <li>Find "Insta" and click "Remove"</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Questions?</h2>
              <p>
                For questions about data deletion, please refer to our{' '}
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </Link>{' '}
                or contact us through the support channels available in the application.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-white/40">
            © 2026 Insta. All rights reserved. | 
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300 ml-2">Privacy Policy</Link> | 
            <Link href="/terms" className="text-purple-400 hover:text-purple-300 ml-2">Terms of Service</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
