import React from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  MapPin,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-white text-xl mb-6">Muscle & Power</h3>
            <p className="text-sm leading-relaxed">
              Your trusted source for premium protein powders
              and fitness supplements. Quality products for your
              fitness journey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">Home Landing</Link>
              </li>
              <li>
                <Link to="/products" className="text-sm hover:text-white transition-colors">Shop All Products</Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-white transition-colors">Browse Categories</Link>
              </li>
              <li>
                <a href="/#deals-section" className="text-sm text-yellow-500 font-semibold hover:text-yellow-400 transition-colors uppercase tracking-tighter">
                  🔥 Hot Deals
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
              Customer Support
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-sm hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link to="/account/orders" className="text-sm hover:text-white transition-colors">Track Your Orders</Link>
              </li>
              <li>
                <Link to="/account/profile" className="text-sm hover:text-white transition-colors">My Profile</Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-white transition-colors underline decoration-neutral-700 underline-offset-4">Need Help?</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Get In Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 group">
                <MapPin className="w-5 h-5 mt-1 text-teal-500 flex-shrink-0" />
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=No+52+Old+Ashok+Talkies+Compound+Ambedkar+Road+Dehu+Road+Pune+412101" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition-colors leading-relaxed"
                >
                  No 52, Old Ashok Talkies Compound, Ambedkar Road, Dehu Road. Pune 412101
                </a>
              </li>
              <li className="flex items-center gap-4 group">
                <Phone className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <a 
                  href="tel:+918421785660" 
                  className="text-sm hover:text-white transition-colors font-semibold"
                >
                  +91 8421785660
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-6 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Muscle & Power. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};