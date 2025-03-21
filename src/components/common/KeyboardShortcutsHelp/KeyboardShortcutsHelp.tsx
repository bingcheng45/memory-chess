'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../Button/Button';

interface KeyboardShortcutsHelpProps {
  className?: string;
}

export function KeyboardShortcutsHelp({ className }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const shortcuts = [
    { key: 'Ctrl/Cmd + N', description: 'Start a new game' },
    { key: 'Space', description: 'Pause/Resume game' },
    { key: 'Ctrl/Cmd + R', description: 'Reset the current game' }
  ];

  return (
    <div className={cn(className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleOpen}
        className="text-gray-300 hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Keyboard Shortcuts
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg p-4 z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-medium">Keyboard Shortcuts</h3>
            <button
              onClick={toggleOpen}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="border-t border-gray-700 pt-2">
            <ul className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <li key={index} className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-sm">{shortcut.key}</kbd>
                  <span className="text-gray-300">{shortcut.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 