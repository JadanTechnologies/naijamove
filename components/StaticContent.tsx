
import React from 'react';
import { X } from 'lucide-react';

interface StaticContentProps {
    page: string;
    onClose: () => void;
}

export const StaticContent: React.FC<StaticContentProps> = ({ page, onClose }) => {
    const getContent = () => {
        switch(page) {
            case 'about':
                return {
                    title: "About NaijaMove",
                    content: `
                        <p class="mb-4">NaijaMove is Nigeria's premier logistics and ride-hailing platform, designed to solve the unique transportation challenges of Sokoto and beyond.</p>
                        <p class="mb-4">Founded in 2024, we bridge the gap between informal transport sectors (Okada, Keke Napep) and modern technology. Our mission is to provide safe, reliable, and affordable movement for people and goods.</p>
                        <h3 class="font-bold text-lg mt-4 mb-2">Our Vision</h3>
                        <p>To digitize 100% of intra-city logistics in Northern Nigeria by 2030, ensuring every Driver has dignity of labor and every passenger has peace of mind.</p>
                    `
                };
            case 'privacy':
                return {
                    title: "Privacy Policy",
                    content: `
                        <p class="mb-4"><strong>Effective Date:</strong> October 2024</p>
                        <p class="mb-4">At NaijaMove, we take your privacy seriously. This policy outlines how we collect, use, and protect your data.</p>
                        <h3 class="font-bold text-lg mt-4 mb-2">1. Data Collection</h3>
                        <p class="mb-2">We collect:</p>
                        <ul class="list-disc pl-5 mb-4">
                            <li>Personal Identification (Name, NIN, Phone)</li>
                            <li>Location Data (GPS coordinates for ride matching)</li>
                            <li>Transaction History</li>
                        </ul>
                        <h3 class="font-bold text-lg mt-4 mb-2">2. Data Usage</h3>
                        <p>Your data is used solely to facilitate rides, process payments, and ensure safety via our tracking systems.</p>
                    `
                };
            case 'terms':
                return {
                    title: "Terms of Service",
                    content: `
                        <p class="mb-4">By using NaijaMove, you agree to the following terms:</p>
                        <h3 class="font-bold text-lg mt-4 mb-2">1. User Conduct</h3>
                        <p class="mb-2">Users must maintain respectful behavior towards drivers. Any abuse will result in an immediate ban.</p>
                        <h3 class="font-bold text-lg mt-4 mb-2">2. Payments</h3>
                        <p class="mb-2">All payments made through the app are final. Refunds are processed according to our Refund Policy.</p>
                        <h3 class="font-bold text-lg mt-4 mb-2">3. Safety</h3>
                        <p>We utilize weight sensors and GPS tracking. Tampering with these devices is a violation of our terms.</p>
                    `
                };
            case 'refund':
                return {
                    title: "Refund Policy",
                    content: `
                        <p class="mb-4">We understand things happen. Here is how we handle refunds:</p>
                        <ul class="list-disc pl-5 mb-4">
                            <li><strong>Driver No-Show:</strong> Full refund to wallet.</li>
                            <li><strong>Trip Cancelled by Driver:</strong> Full refund.</li>
                            <li><strong>Trip Cancelled by Passenger (after 5 mins):</strong> Cancellation fee applies.</li>
                        </ul>
                        <p>Refunds are processed within 24 hours to your NaijaMove wallet.</p>
                    `
                };
            case 'faq':
                return {
                    title: "Frequently Asked Questions",
                    content: `
                        <div class="space-y-4">
                            <div>
                                <p class="font-bold text-emerald-700">Q: How do I fund my wallet?</p>
                                <p>A: You can transfer to your dedicated Wema Bank account number displayed in the app.</p>
                            </div>
                            <div>
                                <p class="font-bold text-emerald-700">Q: Is my cargo insured?</p>
                                <p>A: Yes, goods transported via our 'Truck' option are insured up to ₦100,000.</p>
                            </div>
                            <div>
                                <p class="font-bold text-emerald-700">Q: What if the driver overcharges?</p>
                                <p>A: All prices are fixed in the app. Do not pay extra cash. Report any issues immediately.</p>
                            </div>
                        </div>
                    `
                };
            default:
                return { title: "Page Not Found", content: "Content not available." };
        }
    };

    const data = getContent();

    return (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-900">{data.title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto prose max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: data.content }}>
                </div>
                <div className="p-4 border-t bg-gray-50 text-right">
                    <button onClick={onClose} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
