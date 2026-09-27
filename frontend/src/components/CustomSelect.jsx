import { useEffect, useRef, useState } from "react";

function CustomSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className="custom-select-field" ref={containerRef}>
      <label>{label}</label>

      <button
        type="button"
        className={`custom-select-trigger ${
          open ? "custom-select-trigger-open" : ""
        }`}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}>
        <span
          className={
            selectedOption ? "custom-select-value" : "custom-select-placeholder"
          }>
          {selectedOption?.label || placeholder}
        </span>

        <span className={`select-chevron ${open ? "rotate" : ""}`}>↓</span>
      </button>

      {open && (
        <div className="custom-select-menu" role="listbox">
          {options.map((option) => {
            const selected = String(option.value) === String(value);

            return (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={`custom-select-option ${selected ? "selected" : ""}`}
                key={option.value}
                onClick={() => handleSelect(option)}>
                <span>{option.label}</span>

                {selected && <span className="select-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
