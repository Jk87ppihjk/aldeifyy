
import React from 'react';

const PrivacyScreen: React.FC = () => {
    return (
        <div className="prose prose-invert prose-teal max-w-none p-4 text-gray-300">
            <h1 className="text-teal-400">Privacy Policy</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Introduction</h2>
            <p>aldeify ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by aldeify.</p>
            <p>This Privacy Policy applies to our application, and its associated subdomains (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy and our Terms of Service.</p>

            <h2>2. Information We Collect</h2>
            <p>We collect information from you when you visit our service, register, place an order, subscribe to our newsletter, respond to a survey or fill out a form.</p>
            <ul>
                <li>Name / Username</li>
                <li>Email Addresses</li>
                <li>Mailing Addresses</li>
                <li>Phone Numbers</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>Any of the information we collect from you may be used in one of the following ways:</p>
            <ul>
                <li>To personalize your experience</li>
                <li>To improve our service</li>
                <li>To improve customer service</li>
                <li>To process transactions</li>
                <li>To administer a contest, promotion, survey or other site feature</li>
                <li>To send periodic emails</li>
            </ul>

            <h2>4. How We Protect Your Information</h2>
            <p>We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. We offer the use of a secure server.</p>

            <h2>5. Your Consent</h2>
            <p>By using our service, registering an account, or making a purchase, you consent to this Privacy Policy.</p>
            
            <h2>6. Changes To Our Privacy Policy</h2>
            <p>If we decide to change our privacy policy, we will post those changes on this page, and/or update the Privacy Policy modification date below.</p>
            
            <h2>7. Contact Us</h2>
            <p>Don't hesitate to contact us if you have any questions. Via Email: privacy@aldeify.com</p>
        </div>
    );
};

export default PrivacyScreen;
