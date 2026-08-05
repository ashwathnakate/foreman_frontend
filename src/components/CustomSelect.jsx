import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select option',
  disabled = false,
  className = '',
  style = {},
  size = 'md', // 'sm' | 'md'
  iconMap = {} // Optional custom icon map: { [val]: JSX }
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  const getOptionIcon = (opt) => {
    if (opt.icon) return opt.icon;
    if (iconMap[opt.value]) return iconMap[opt.value];
    return null;
  };

  return (
    <div
      ref={dropdownRef}
      className={`custom-select-container ${disabled ? 'disabled' : ''} ${className}`}
      style={{ position: 'relative', width: size === 'sm' ? 'auto' : '100%', ...style }}
    >
      <button
        type="button"
        className={`custom-select-trigger ${size === 'sm' ? 'custom-select-sm' : ''} ${isOpen ? 'is-open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          {selectedOption && getOptionIcon(selectedOption) && (
            <span className="custom-select-option-icon">{getOptionIcon(selectedOption)}</span>
          )}
          <span className="custom-select-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={size === 'sm' ? 14 : 16}
          className={`custom-select-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown-menu">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            const icon = getOptionIcon(opt);
            return (
              <div
                key={opt.value}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {icon && <span className="custom-select-option-icon">{icon}</span>}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={14} className="custom-select-check-icon" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
