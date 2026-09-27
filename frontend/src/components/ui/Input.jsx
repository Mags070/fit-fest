import React from 'react'

export const Input = React.forwardRef(function Input(
  { className = '', type = 'text', error, ...props },
  ref
) {
  return (
    <input
      type={type}
      ref={ref}
      className={`ui-input ${error ? 'ui-input-error' : ''} ${className}`.trim()}
      {...props}
    />
  )
})

export default Input
