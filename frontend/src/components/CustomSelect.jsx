import { useId } from "react";
function CustomSelect({ label, value, options, placeholder, onChange, disabled = false }) {
  const id = useId();
  return <div className="custom-select-field">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </div>;
}
export default CustomSelect;
