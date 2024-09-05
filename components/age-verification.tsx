"use client";
import { useState, useEffect } from 'react';

export const AgeVerification = () => {
    const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);

    useEffect(() => {
        // Load the state from local storage when the component mounts
        const savedState = localStorage.getItem('age-verification-state');
        if (savedState === null) {
            // Initialize as false if it's missing
            localStorage.setItem('age-verification-state', 'false');
            setIsConfirmed(false);
        } else if (savedState === 'false') {
            setIsConfirmed(false);
        } else {
            setIsConfirmed(true);
        }
    }, []);

    const handleConfirmation = (confirmation: boolean) => {
        if (confirmation) {
            setIsConfirmed(true);
            localStorage.setItem('age-verification-state', 'true');
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } else {
            setIsConfirmed(null); // Change this line
            localStorage.setItem('age-verification-state', 'false');
        }
    };

    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: isConfirmed === false ? 'rgba(0, 0, 0, 0.8)' : 'none', // Semi-transparent black background for the blur
        backdropFilter: isConfirmed === false ? 'blur(9px)' : 'none', // Apply a blur effect conditionally
        zIndex: isConfirmed === false ? 999 : -999, // Set z-index conditionally
    };

    const contentStyle: React.CSSProperties = {
        backgroundColor: 'rgb(38, 38, 38)', // Grey background for the age verification box
        color: '#fff', // White text color
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: '#1c941c', // Green button background
        color: '#fff', // White button text color
        padding: '10px 20px',
        margin: '10px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    };
    const closeButtonStyle: React.CSSProperties = {
        backgroundColor: '#6a6a6a', // Green button background
        color: '#fff', // White button text color
        padding: '10px 20px',
        margin: '10px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    };
    return (
        <div style={containerStyle}>
            {isConfirmed === false && (
                <div style={contentStyle}>
                    <h2>Are you over 18 years old?</h2>
                    <button style={buttonStyle} onClick={() => handleConfirmation(true)}>
                        Yes, I am over 18.
                    </button>
                    <button style={closeButtonStyle} onClick={() => handleConfirmation(false)}>
                        No, I am not
                    </button>
                </div>
            )}
        </div>
    );
};

export default AgeVerification;
