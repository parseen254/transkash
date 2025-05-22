
import type { NextPage } from 'next';
import Head from 'next/head';
import { AppLogo } from '@/components/shared/app-logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditionsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Terms and Conditions - PesiX</title>
      </Head>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
            <AppLogo />
            <Link href="/" passHref legacyBehavior>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-center md:text-4xl">
            Terms and Conditions
          </h1>
          <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert mx-auto space-y-6 text-foreground">
            <p className="text-muted-foreground">Last updated: July 28, 2024</p>

            <p>
              Welcome to PesiX! These Terms and Conditions (&quot;Terms&quot;) govern your use of the PesiX
              payment processing services, website, and any related applications (collectively, the &quot;Service&quot;)
              provided by PesiX (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using our Service, you agree
              to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
            </p>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using the Service, you represent that you have read,
                understood, and agree to be bound by these Terms, including our Privacy Policy, which is
                incorporated herein by reference. If you are using the Service on behalf of an entity, you
                represent and warrant that you have the authority to bind that entity to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">2. Description of Service</h2>
              <p>
                PesiX provides a platform for individuals and businesses to make and receive payments through
                various methods, including but not limited to mobile money, card payments, and bank transfers.
                The Service may include features such as payment link generation, transaction management, and
                payout processing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">3. User Registration and Account</h2>
              <p>
                To use certain features of the Service, you may be required to register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate, current, and complete information during the registration process.</li>
                <li>Maintain and promptly update your account information to keep it accurate, current, and complete.</li>
                <li>Maintain the security of your account credentials and not disclose them to any third party.</li>
                <li>Notify us immediately of any unauthorized use of your account or any other breach of security.</li>
              </ul>
              <p>
                You are responsible for all activities that occur under your account, whether or not you authorized them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">4. Payment Transactions</h2>
              <p>
                You agree that all payment transactions processed through the Service are subject to the rules and
                regulations of the respective payment networks (e.g., M-Pesa, Visa, Mastercard). We are not a bank
                and do not offer banking services. PesiX facilitates the processing of payments.
              </p>
              <p>
                You are responsible for ensuring that you have sufficient funds or credit available to complete
                any transactions you initiate. We reserve the right to refuse to process any transaction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">5. Fees and Charges</h2>
              <p>
                You agree to pay all applicable fees and charges associated with your use of the Service as disclosed
                to you on our pricing page or otherwise communicated. We reserve the right to change our fees at any
                time, with notice to you if required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">6. Security</h2>
              <p>
                We implement and maintain reasonable security measures to protect your information and transactions.
                However, you acknowledge that no system is completely secure, and we cannot guarantee the absolute
                security of your data. You are responsible for maintaining the security of your devices and account
                credentials.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">7. Intellectual Property</h2>
              <p>
                The Service, including its content, features, and functionality (including but not limited to all
                information, software, text, displays, images, video, and audio, and the design, selection, and
                arrangement thereof), are owned by PesiX, its licensors, or other providers of such material and are
                protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary
                rights laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">8. Privacy Policy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy, which can be found at [Link to Your Privacy Policy].
                Please review our Privacy Policy to understand our practices regarding the collection, use, and disclosure of your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">9. Termination</h2>
              <p>
                We may terminate or suspend your access to the Service, without prior notice or liability, for any reason
                whatsoever, including, without limitation, if you breach these Terms. Upon termination, your right to use
                the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">10. Disclaimer of Warranties</h2>
              <p>
                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We expressly disclaim all warranties
                of any kind, whether express or implied, including, but not limited to, the implied warranties of
                merchantability, fitness for a particular purpose, and non-infringement. We make no warranty that the
                Service will be uninterrupted, timely, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">11. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by applicable law, in no event shall PesiX, its affiliates, directors,
                employees, or licensors be liable for any indirect, incidental, special, consequential, or punitive
                damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses,
                resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct
                or content of any third party on the Service; (iii) any content obtained from the Service; and (iv)
                unauthorized access, use, or alteration of your transmissions or content, whether based on warranty,
                contract, tort (including negligence), or any other legal theory, whether or not we have been informed
                of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">12. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless PesiX and its licensee and licensors, and their
                employees, contractors, agents, officers, and directors, from and against any and all claims, damages,
                obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's
                fees), resulting from or arising out of a) your use and access of the Service, by you or any person
                using your account and password, or b) a breach of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">13. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction, e.g., Kenya],
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">14. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
                revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                What constitutes a material change will be determined at our sole discretion. By continuing to access
                or use our Service after any revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">15. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at: [Your Contact Email or Link to Contact Page].
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default TermsAndConditionsPage;

    