import { useState, useEffect } from 'react';

const PWD = parseInt(process.env.REACT_APP_PASSWORD)
const STORAGE_KEY = process.env.REACT_APP_STORAGE_KEY
const MAX_ATTEMPTS = parseInt(process.env.REACT_APP_MAX_LOGIN_ATTEMPTS) || 3;
const LOCKOUT_TIME = parseInt(process.env.REACT_APP_LOCKOUT_TIME) || 30 * 60 * 1000; 

export const usePasswordProtection = () => {
  const [isPasswordValidated, setPasswordValidated] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);

  const isDevelopment = process.env.REACT_APP_NODE_ENV === 'development';


  useEffect(() => {
    if (isDevelopment) {
      if (!process.env.REACT_APP_PASSWORD) {
        console.warn('Warning: REACT_APP_PASSWORD is not set. Using fallback value.');
      }
      if (!process.env.REACT_APP_STORAGE_KEY) {
        console.warn('Warning: REACT_APP_STORAGE_KEY is not set. Using fallback value.');
      }
    }
  }, []);

  const checkLockout = () => {
    const lockedUntil = localStorage.getItem('lockoutEndTime');
    if (lockedUntil) {
      const lockoutEnd = parseInt(lockedUntil);
      if (Date.now() < lockoutEnd) {
        setIsLocked(true);
        setLockoutEndTime(lockoutEnd);
        return true;
      } else {
        localStorage.removeItem('lockoutEndTime');
        setIsLocked(false);
        setAttempts(0);
        return false;
      }
    }
    return false;
  };

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutEnd = Date.now() + LOCKOUT_TIME;
      localStorage.setItem('lockoutEndTime', lockoutEnd.toString());
      setIsLocked(true);
      setLockoutEndTime(lockoutEnd);
      alert(`Too many failed attempts. Please try again in ${LOCKOUT_TIME / 60000} minutes.`);
    } else {
      alert(`Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
    }
  };

  const formatLockoutTime = (endTime) => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000 / 60);
    return `${remaining} minute${remaining !== 1 ? 's' : ''}`;
  };

  const pwdPrompt = () => {
    if (checkLockout()) {
      alert(`Account is locked. Please try again in ${formatLockoutTime(lockoutEndTime)}.`);
      return;
    }

    const password = prompt("Enter the password");
    
    if (password === null) {
      pwdPrompt();
    } else if (parseInt(password) === PWD) {
      localStorage.setItem(STORAGE_KEY, password);
      setPasswordValidated(true);
      setAttempts(0);
      setIsLocked(false);
      localStorage.removeItem('lockoutEndTime');
    } else {
      handleFailedAttempt();
      if (!isLocked) {
        pwdPrompt();
      }
    }
  };

  useEffect(() => {
    if (!isPasswordValidated) {
      const savedPassword = localStorage.getItem(STORAGE_KEY);
      if (savedPassword && parseInt(savedPassword) === PWD) {
        setPasswordValidated(true);
        return;
      }

      if (!checkLockout()) {
        pwdPrompt();
      }
    }
  }, [isPasswordValidated, isLocked]);

  useEffect(() => {
    return () => {
      if (isLocked) {
        localStorage.setItem('lockoutEndTime', lockoutEndTime.toString());
      }
    };
  }, [isLocked, lockoutEndTime]);

  const resetPassword = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPasswordValidated(false);
    setAttempts(0);
    setIsLocked(false);
    localStorage.removeItem('lockoutEndTime');
  };

  return {
    isPasswordValidated,
    isLocked,
    resetPassword,
    attemptsRemaining: MAX_ATTEMPTS - attempts,
    lockoutTimeRemaining: lockoutEndTime ? formatLockoutTime(lockoutEndTime) : null
  };
};