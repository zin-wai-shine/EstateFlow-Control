import React, { useMemo } from 'react';
import Dropdown, { type Option } from 'react-dropdown';
import 'react-dropdown/style.css';
import { FiChevronDown } from 'react-icons/fi';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface AppDropdownProps {
  options: (DropdownOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  controlClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  prefix?: React.ReactNode;
  id?: string;
  name?: string;
}

export const AppDropdown: React.FC<AppDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  controlClassName = '',
  menuClassName = '',
  disabled = false,
  prefix,
  id,
  name,
}) => {
  const normalizedOptions: Option[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return { value: opt.value, label: opt.label };
    });
  }, [options]);

  return (
    <div className={`app-dropdown-wrapper relative ${className}`}>
      {prefix && (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center text-neutral-400">
          {prefix}
        </div>
      )}
      <Dropdown
        id={id}
        name={name}
        options={normalizedOptions}
        value={value}
        onChange={(opt: Option) => onChange(String(opt.value))}
        placeholder={placeholder}
        disabled={disabled}
        controlClassName={`${controlClassName} ${prefix ? '!pl-8' : ''}`}
        menuClassName={menuClassName}
        arrowClosed={
          <FiChevronDown className="w-3.5 h-3.5 text-neutral-400 transition-transform duration-200" />
        }
        arrowOpen={
          <FiChevronDown className="w-3.5 h-3.5 text-rose-500 rotate-180 transition-transform duration-200" />
        }
      />
    </div>
  );
};

export default AppDropdown;
