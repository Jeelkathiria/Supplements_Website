import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  ArrowLeft,
  Dumbbell,
  FlaskConical,
} from "lucide-react";

const icons = [Dumbbell, FlaskConical];

export const ContactUs: React.FC = () => {
  const navigate = useNavigate();

  // Generate random background icons ONCE
  const backgroundIcons = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => {
      const Icon = icons[i % icons.length];
      return {
        Icon,
        size: Math.floor(Math.random() * 20) + 24, // 24–44px
        top: Math.random() * 100,
        left: Math.random() * 100,
        rotate: Math.random() * 360,
      };
    });
  }, []);

  return (
    <div className="relative min-h-screen bg-neutral-100 overflow-hidden">
      {/* RANDOM BACKGROUND ICONS */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {backgroundIcons.map((item, i) => (
          <item.Icon
            key={i}
            style={{
              width: item.size,
              height: item.size,
              top: `${item.top}%`,
              left: `${item.left}%`,
              transform: `rotate(${item.rotate}deg)`,
            }}
            className="absolute text-neutral-400 opacity-30"
          />
        ))}
      </div>

      {/* CONTENT */}
      <div className="relative z-20 flex justify-center px-4 pt-12">
        <div className="w-full max-w-lg">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-teal-700 hover:text-teal-800 font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* CARD */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-6 text-center">
              Contact Us
            </h1>

            {/* Address */}
            <div className="flex gap-4 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-100">
                <MapPin className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Address
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  No 52, Old Ashok Talkies Compound,
                  <br />
                  Ambedkar Road, Dehu Road,
                  <br />
                  Pune – 412101
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-100">
                <Phone className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Phone
                </h3>
                <a
                  href="tel:+918421785660"
                  className="text-sm text-teal-700 font-medium hover:underline"
                >
                  +91 84217 85660
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
