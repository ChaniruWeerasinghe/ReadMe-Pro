import { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

export default function CustomDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select an option', 
  label, 
  error,
  disabled = false,
  icon: Icon,
  btnSize = 'default'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`custom-dropdown ${disabled ? 'custom-dropdown--disabled' : ''} ${error ? 'custom-dropdown--error' : ''} custom-dropdown--${btnSize}`} ref={dropdownRef}>
      {label && <label className="form-label">{label}</label>}
      
      <div 
        className={`custom-dropdown__trigger ${isOpen ? 'custom-dropdown__trigger--open' : ''}`}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="custom-dropdown__selected">
          {Icon && <Icon className="custom-dropdown__icon" />}
          <span className={!selectedOption ? 'text-muted' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        
        <svg 
          className={`custom-dropdown__arrow ${isOpen ? 'custom-dropdown__arrow--flipped' : ''}`} 
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && (
        <ul className="custom-dropdown__menu animate-scale-in" role="listbox">
          {options.map((option) => (
            <li 
              key={option.value}
              className={`custom-dropdown__item ${option.value === value ? 'custom-dropdown__item--selected' : ''}`}
              onClick={() => handleSelect(option)}
              role="option"
              aria-selected={option.value === value}
            >
              <div className="custom-dropdown__item-content">
                {option.icon ? <option.icon className="custom-dropdown__item-icon" /> : (Icon && <Icon className="custom-dropdown__item-icon" />)}
                <span>{option.label}</span>
              </div>
              {option.value === value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
