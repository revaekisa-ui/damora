import React from 'react';

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: () => void;
    id?: string;
    disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, id, disabled }) => (
    <button
        type="button"
        id={id}
        disabled={disabled}
        className={`${enabled ? 'bg-brand-accent' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-surface ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        onClick={disabled ? undefined : onChange}
    >
        <span
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

export default ToggleSwitch;
