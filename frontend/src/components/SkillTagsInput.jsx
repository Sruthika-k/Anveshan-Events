import { useState, useRef } from 'react';

function SkillTagsInput({ value = [], onChange }) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    const handleAddSkill = (skillToAdd) => {
        const trimmedSkill = skillToAdd.trim();

        // Prevent empty or duplicate skills
        if (!trimmedSkill) return;
        if (value.includes(trimmedSkill)) {
            setInputValue('');
            return;
        }

        // Add skill to array
        onChange([...value, trimmedSkill]);
        setInputValue('');
    };

    const handleKeyDown = (e) => {
        const trimmedValue = inputValue.trim();

        // Enter or Comma: Add skill
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddSkill(inputValue);
        }

        // Backspace on empty input: Remove last skill
        if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            const newSkills = [...value];
            newSkills.pop();
            onChange(newSkills);
        }
    };

    const handleRemoveSkill = (indexToRemove) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    const handleInputChange = (e) => {
        // Remove commas from input (they trigger add)
        const newValue = e.target.value.replace(/,/g, '');
        setInputValue(newValue);
    };

    return (
        <div className="w-full">
            {/* Tags Container */}
            <div
                onClick={() => inputRef.current?.focus()}
                className="min-h-[120px] w-full px-4 py-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition cursor-text"
            >
                {/* Display Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                    {value.map((skill, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full group hover:bg-indigo-200 transition-colors"
                        >
                            <span>{skill}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSkill(index);
                                }}
                                className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-300 transition-colors"
                                aria-label={`Remove ${skill}`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>

                {/* Input Field */}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? "Add a skill and press Enter" : "Add another..."}
                    className="w-full outline-none bg-transparent text-gray-900 placeholder-gray-400"
                />
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500 mt-2">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> or
                type <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">,</kbd> to add a skill.
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Backspace</kbd> to remove the last one.
            </p>
        </div>
    );
}

export default SkillTagsInput;
