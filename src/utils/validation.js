/**
 * Centralized Validation Logic for ReadMe
 * Following user-defined rules for professional SaaS UI/UX.
 */

// ── Name Validation (No numbers allowed) ──
export const validateName = (name, fieldName = 'Name') => {
  if (!name || !name.trim()) return `${fieldName} is required`;
  if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
  if (/\d/.test(name)) return `${fieldName} cannot contain numbers`;
  if (/[<>{}]/.test(name)) return 'Name contains invalid characters';
  return '';
};

// ── Email Validation ──
export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

// ── Professional Phone Number Validation (Sri Lankan and International) ──
// - 10 digits starting with 0 (e.g. 0771234567)
// - 9 digits without 0 (e.g. 771234567)
// - Starting with +94 (e.g. +94771234567)
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) return 'Phone number is required';
  
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  // Sri Lankan patterns
  const slPattern = /^(?:\+94|0)?(?:[1-9][0-9]{8})$/;
  
  if (slPattern.test(cleanPhone)) return '';
  
  // Generic international (basic) - if not matching SL, check international
  const intlPattern = /^\+?[1-9]\d{1,14}$/;
  if (intlPattern.test(cleanPhone)) return '';
  
  return 'Please enter a valid phone number';
};

// ── Content Validation ──
export const validateContent = (content, minLen = 3, maxLen = 50000) => {
  if (!content || !content.trim()) return 'Content is required';
  if (content.trim().length < minLen) return `Content must be at least ${minLen} characters`;
  if (content.length > maxLen) return `Content exceeds character limit of ${maxLen.toLocaleString()}`;
  return '';
};

// ── Title/Collection Name Validation ──
export const validateTitle = (title, fieldName = 'Title', maxLen = 100) => {
  const nameError = validateName(title, fieldName);
  if (nameError) return nameError;
  if (title.length > maxLen) return `${fieldName} exceeds limit of ${maxLen} characters`;
  return '';
};
