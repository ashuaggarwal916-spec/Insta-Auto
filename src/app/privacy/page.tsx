import Link from 'next/link';

export default function PrivacyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-white/40 mb-8">Last updated: September 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>
                Insta ("we", "our", or "us") operates the Insta video automation platform. 
                This Privacy Policy explains how we collect, use, and protect your information 
                when you use our web application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, and authentication credentials when you register.</li>
                <li><strong>Video Content:</strong> YouTube URLs you provide for processing, and generated video clips.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our application.</li>
                <li><strong>OAuth Tokens:</strong> Access tokens from third-party services (Meta/Instagram) when you connect your accounts.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our video automation services</li>
                <li>Process video imports, clipping, and publishing</li>
                <li>Authenticate your identity and secure your account</li>
                <li>Communicate with you about service updates</li>
                <li>Improve our application and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
              <p>
                Our application integrates with third-party services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Meta/Instagram:</strong> When you connect your Instagram account, Meta Platforms, Inc. processes your data according to their own privacy policy. We recommend reviewing Meta's Privacy Policy at https://www.facebook.com/privacy/policy/</li>
                <li><strong>YouTube:</strong> We access YouTube content based on the URLs you provide, subject to YouTube's Terms of Service.</li>
              </ul>
              <p className="mt-3">
                These third-party services may collect, store, and process data independently. 
                We are not responsible for the privacy practices of third-party platforms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
                over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
              <p>
                We retain your personal information only for as long as necessary to fulfill the purposes 
                described in this policy. You may request deletion of your account and associated data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Disconnect third-party accounts at any time</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
              <p>
                We use essential cookies for authentication and session management. 
                We do not use tracking cookies for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any 
                material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
              <p>
                For questions about this Privacy Policy or your data, please contact us through 
                the support channels available in the application.
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
