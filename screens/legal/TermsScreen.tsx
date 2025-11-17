
import React from 'react';

const TermsScreen: React.FC = () => {
    return (
        <div className="prose prose-invert prose-orange max-w-none p-4 text-gray-300">
            <h1 className="text-orange-500">Terms of Service</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2>1. Introduction</h2>
            <p>Welcome to aldeify ("Company", "we", "our", "us")! These Terms of Service ("Terms", "Terms of Service") govern your use of our mobile application (the "Service") operated by aldeify.</p>
            <p>Our Privacy Policy also governs your use of our Service and explains how we collect, safeguard and disclose information that results from your use of our web pages. Please read it here.</p>

            <h2>2. Accounts</h2>
            <p>When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on Service.</p>

            <h2>3. Prohibited Uses</h2>
            <p>You may use Service only for lawful purposes and in accordance with Terms. You agree not to use Service in any way that violates any applicable national or international law or regulation.</p>
            
            <h2>4. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of aldeify and its licensors. The Service is protected by copyright, trademark, and other laws of both foreign countries.</p>

            <h2>5. Termination</h2>
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of Terms.</p>
            
            <h2>6. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction, without regard to its conflict of law provisions.</p>
            
            <h2>7. Changes To Service</h2>
            <p>We reserve the right to withdraw or amend our Service, and any service or material we provide via Service, in our sole discretion without notice.</p>
            
            <h2>8. Contact Us</h2>
            <p>Please send your feedback, comments, requests for technical support by email: support@aldeify.com.</p>
        </div>
    );
};

export default TermsScreen;
