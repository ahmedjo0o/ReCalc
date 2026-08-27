import { forwardRef } from 'react';

let uid = 0;

export function Field({ label, highlight = false, error, children }) {
  const id = children?.props?.id;
  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className={`field__label${highlight ? ' field__label--highlight' : ''}`}>
          {label}
        </label>
      )}
      {children}
      <span className="error-text">{error || ''}</span>
    </div>
  );
}

export const TextInput = forwardRef(function TextInput({ id, className = '', ...rest }, ref) {
  const autoId = id || `field-${++uid}`;
  return <input ref={ref} id={autoId} className={`input ${className}`.trim()} {...rest} />;
});

export function Select({ id, className = '', children, ...rest }) {
  const autoId = id || `field-${++uid}`;
  return (
    <select id={autoId} className={`select ${className}`.trim()} {...rest}>
      {children}
    </select>
  );
}
