import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * UserMenu component with dropdown for user actions
 */
const UserMenu = ({ user, onLogout, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);
  
  const handleLogout = async () => {
    setIsOpen(false);
    if (onLogout) {
      await onLogout();
    }
  };
  
  const handleSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };
  
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };
  
  const getUserRole = () => {
    if (!user?.roles || user.roles.length === 0) return 'User';
    return user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1);
  };
  
  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
            {getUserInitials()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getUserRole()}
            </p>
          </div>
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-gray-500 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getUserRole()}
            </p>
          </div>
          
          <button
            onClick={handleSettings}
            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
