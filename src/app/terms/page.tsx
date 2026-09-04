import Link from 'next/link';

export default function TermsPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-white/40 mb-8">Last updated: September 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Insta ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>
                Insta is a video automation platform that allows users to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Import YouTube videos (including private and unlisted videos)</li>
                <li>Generate video clips using automated processing</li>
                <li>Schedule and publish content to Instagram</li>
                <li>Manage social media automation workflows</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the security of your account credentials. 
                You must provide accurate and complete information when creating an account. 
                You are solely responsible for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any local, state, national, or international law</li>
                <li>Infringe upon the intellectual property rights of others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Transmit any malicious code or harmful data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Third-Party Services</h2>
              <p>
                Our Service integrates with third-party platforms including Meta/Instagram and YouTube. 
                Your use of these third-party services is subject to their respective terms of service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Meta/Instagram:</strong> https://www.facebook.com/terms.php</li>
                <li><strong>YouTube:</strong> https://www.youtube.com/t/terms</li>
              </ul>
              <p className="mt-3">
                We are not responsible for the availability, accuracy, or practices of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by Insta 
                and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Content Responsibility</h2>
              <p>
                You retain ownership of the content you upload or process through our Service. 
                You are solely responsible for ensuring that you have the right to use any content 
                you upload and that such use does not violate any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Service Availability</h2>
              <p>
                We strive to provide uninterrupted service but do not guarantee that the Service 
                will be available at all times. We may experience downtime due to maintenance, 
                updates, or circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
              <p>
                In no event shall Insta be liable for any indirect, incidental, special, consequential, 
                or punitive damages arising out of or related to your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
              <p>
                We may terminate or suspend your account at any time for violations of these terms. 
                You may terminate your account at any time by contacting us or using the account 
                deletion feature in the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of 
                material changes by posting the updated terms on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us through the support 
                channels available in the application.
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
