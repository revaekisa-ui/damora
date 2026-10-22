import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  filterConfigs: Array<{
    key: string;
    label: string;
    type: 'select' | 'date' | 'text';
    options?: FilterOption[];
    placeholder?: string;
  }>;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  filterConfigs,
  className = ''
}) => {
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <div className={`bg-brand-surface p-3 sm:p-4 rounded-xl border border-brand-border shadow-sm ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2.5 sm:gap-4 items-end">
        {filterConfigs.map((config) => (
          <div key={config.key} className="flex flex-col w-full lg:w-auto lg:min-w-[140px]">
            <label className="text-xs sm:text-sm font-medium text-brand-text-secondary mb-1">
              {config.label}
            </label>
            
            {config.type === 'select' && (
              <select
                value={filters[config.key] || ''}
                onChange={(e) => onFilterChange(config.key, e.target.value || undefined)}
                className="w-full min-w-0 px-3 py-2 text-base sm:text-sm border border-brand-accent/40 bg-brand-accent/5 text-brand-text-primary rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent min-h-[38px] sm:min-h-[44px]"
              >
                <option value="">Semua</option>
                {config.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {config.type === 'date' && (
              <input
                type="date"
                value={filters[config.key] || ''}
                onChange={(e) => onFilterChange(config.key, e.target.value || undefined)}
                className="w-full min-w-0 px-3 py-2 text-base sm:text-sm border border-brand-accent/40 bg-brand-accent/5 text-brand-text-primary rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent min-h-[38px] sm:min-h-[44px]"
              />
            )}
            
            {config.type === 'text' && (
              <input
                type="text"
                value={filters[config.key] || ''}
                onChange={(e) => onFilterChange(config.key, e.target.value || undefined)}
                placeholder={config.placeholder}
                className="w-full min-w-0 px-3 py-2 text-base sm:text-sm border border-brand-accent/40 bg-brand-accent/5 text-brand-text-primary rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent min-h-[38px] sm:min-h-[44px]"
              />
            )}
          </div>
        ))}
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm text-brand-danger hover:bg-brand-danger/10 border border-brand-danger/30 rounded-lg min-h-[38px] sm:min-h-[44px] flex items-center justify-center font-bold transition-colors flex-shrink-0"
          >
            Reset Filter
          </button>
        )}
      </div>
      
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-brand-border/60 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            const config = filterConfigs.find(c => c.key === key);
            if (!config) return null;
            
            let displayValue = value;
            if (config.type === 'select' && config.options) {
              const option = config.options.find(o => o.value === value);
              displayValue = option?.label || value;
            }
            
            return (
              <span
                key={key}
                className="inline-flex items-center pl-2.5 pr-1 py-1 rounded-full text-xs font-medium bg-brand-accent text-white border border-brand-accent"
              >
                <span>{config.label}: {displayValue}</span>
                <button
                  onClick={() => onFilterChange(key, undefined)}
                  className="w-6 h-6 sm:w-8 sm:h-8 ml-1 inline-flex items-center justify-center rounded-full hover:bg-white/20 text-white active:scale-95 transition-transform"
                  aria-label={`Hapus filter ${config.label}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};