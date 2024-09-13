"use client";

import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load the consent state from local storage when the component mounts
    const savedConsent = localStorage.getItem('cookie-consent');
    if (savedConsent === 'true') {
      setConsent(true);
    } else {
      // Initialize as false if it's missing or false
      localStorage.setItem('cookie-consent', 'false');
      setConsent(false);
    }
    setIsLoaded(true);
  }, []);

  const handleConsent = (agreed: boolean) => {
    setConsent(agreed);
    localStorage.setItem('cookie-consent', agreed.toString());
    if (agreed && typeof window !== 'undefined') {
      //window.location.reload();
    }
  };

  if (!isLoaded || consent === true) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 transition-opacity duration-300 ease-in-out opacity-100 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <p className="text-sm">This website uses cookies to enhance the user experience.</p>
        <div>
          <button
            onClick={() => handleConsent(true)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mr-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;