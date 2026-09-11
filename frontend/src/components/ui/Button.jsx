import Spinner from './Spinner';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  accent: 'btn-accent',
  cyan: 'btn-cyan',
};

export default function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  return (
    <button
      className={`${variants[variant] || 'btn-primary'} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
