// Assuming this is the missing dialog-input component

import React from 'react';

interface DialogInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const DialogInput: React.FC<DialogInputProps> = (props) => {
  return (
    <input
      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      {...props}
    />
  );
};
