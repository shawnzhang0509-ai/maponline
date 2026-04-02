import React from 'react';

interface BadgeFilterDropdownProps {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

const BadgeFilterDropdown: React.FC<BadgeFilterDropdownProps> = ({
  allTags,
  selectedTags,
  onToggleTag,
  onClearAll,
}) => {
  const [open, setOpen] = React.useState(false);

  const summaryText =
    selectedTags.length === 0
      ? 'All badges'
      : `${selectedTags.length} selected`;

  return (
    <div className="relative pointer-events-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        <span>Badges</span>
        <span className="text-gray-500">{summaryText}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl z-[10002]">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">Select badges</span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          </div>
          <div className="p-2 space-y-1">
            {allTags.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-2">No badges</p>
            ) : (
              allTags.map((tag) => {
                const checked = selectedTags.includes(tag);
                return (
                  <label
                    key={tag}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleTag(tag)}
                      className="accent-rose-500"
                    />
                    <span className={checked ? 'font-semibold text-gray-800' : 'text-gray-700'}>
                      {tag}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeFilterDropdown;
