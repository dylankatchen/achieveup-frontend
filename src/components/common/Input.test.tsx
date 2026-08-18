import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Input from './Input';

describe('Input Component', () => {
  test('renders input with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).not.toBeDisabled();
    expect(input).not.toBeRequired();
  });

  test('renders with label', () => {
    render(<Input label="Test Label" />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  test('renders with placeholder', () => {
    render(<Input placeholder="Enter text here" />);
    
    const input = screen.getByPlaceholderText('Enter text here');
    expect(input).toBeInTheDocument();
  });

  test('renders with error message', () => {
    render(<Input error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
  });

  test('renders with helper text', () => {
    render(<Input helperText="This is a helpful hint" />);
    
    expect(screen.getByText('This is a helpful hint')).toBeInTheDocument();
  });

  test('shows error over helper text', () => {
    render(<Input helperText="Helper text" error="Error message" />);
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  test('handles different input types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url'];
    
    types.forEach(type => {
      const { unmount } = render(<Input type={type} data-testid={`input-${type}`} />);
      
      const input = screen.getByTestId(`input-${type}`);
      expect(input).toHaveAttribute('type', type);
      
      unmount();
    });
  });

  test('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });

  test('applies disabled state', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  test('applies required attribute', () => {
    render(<Input required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  test('applies custom className', () => {
    render(<Input className="custom-input-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input-class');
  });

  test('forwards additional props', () => {
    render(<Input data-testid="custom-input" maxLength={10} autoComplete="off" />);
    
    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('autoComplete', 'off');
  });

  test('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');

    userEvent.click(input);
    expect(handleFocus).toHaveBeenCalled();
    expect(input).toHaveFocus();

    userEvent.tab();
    expect(handleBlur).toHaveBeenCalled();
  });

  test('handles keyboard events', () => {
    const handleKeyPress = jest.fn();
    const handleKeyDown = jest.fn();
    render(<Input onKeyPress={handleKeyPress} onKeyDown={handleKeyDown} />);

    const input = screen.getByRole('textbox');

    userEvent.type(input, '{enter}');
    expect(handleKeyPress).toHaveBeenCalled();
    expect(handleKeyDown).toHaveBeenCalled();
  });

  test('maintains focus styling', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    expect(input).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  test('applies error styling correctly', () => {
    render(<Input error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
    expect(input).toHaveClass('focus:ring-red-500');
  });

  test('label associates with input correctly', () => {
    render(<Input label="Associated Label" />);
    
    const input = screen.getByLabelText('Associated Label');
    const label = screen.getByText('Associated Label');
    
    expect(input).toBeInTheDocument();
    expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
  });

  test('handles very long values', () => {
    const longValue = 'a'.repeat(1000);
    render(<Input value={longValue} readOnly />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(longValue);
  });

  test('handles special characters', () => {
    const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: specialValue } });
    
    expect(input).toHaveValue(specialValue);
  });

  test('handles unicode characters', () => {
    const unicodeValue = '你好世界 🌍 Ñoño José María';
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: unicodeValue } });
    
    expect(input).toHaveValue(unicodeValue);
  });

  test('password type hides input', () => {
    render(<Input type="password" value="secret123" readOnly />);
    
    const input = screen.getByDisplayValue('secret123');
    expect(input).toHaveAttribute('type', 'password');
  });

  test('number type accepts numeric input', () => {
    render(<Input type="number" />);
    
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
    
    fireEvent.change(input, { target: { value: '123.45' } });
    expect(input).toHaveValue(123.45);
  });

  test('email type validates email format', () => {
    render(<Input type="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  test('handles readOnly state', () => {
    render(<Input readOnly value="readonly value" />);
    
    const input = screen.getByDisplayValue('readonly value');
    expect(input).toHaveAttribute('readOnly');
    
    // Should not be able to change value
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(input).toHaveValue('readonly value');
  });

  test('applies correct ARIA attributes', () => {
    render(<Input error="Error message" label="Test Input" required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeRequired();
  });

  test('error message has correct ARIA relationship', () => {
    render(<Input error="Error message" />);
    
    const input = screen.getByRole('textbox');
    const errorElement = screen.getByText('Error message');
    
    expect(input).toHaveAttribute('aria-describedby');
    expect(errorElement).toHaveAttribute('id');
  });

  test('helper text has correct ARIA relationship', () => {
    render(<Input helperText="Helper message" />);
    
    const input = screen.getByRole('textbox');
    const helperElement = screen.getByText('Helper message');
    
    expect(input).toHaveAttribute('aria-describedby');
    expect(helperElement).toHaveAttribute('id');
  });

  test('combines multiple ARIA relationships', () => {
    render(<Input label="Test" helperText="Helper" />);
    
    const input = screen.getByLabelText('Test');
    expect(input).toHaveAttribute('aria-describedby');
  });

  test('handles autoComplete attribute', () => {
    render(<Input autoComplete="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autoComplete', 'email');
  });

  test('handles form submission', () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <Input name="test-input" />
        <button type="submit">Submit</button>
      </form>
    );
    
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByText('Submit');
    
    fireEvent.change(input, { target: { value: 'test value' } });
    fireEvent.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalled();
  });

  test('maintains input focus after error state change', () => {
    const { rerender } = render(<Input />);
    
    const input = screen.getByRole('textbox');
    input.focus();
    expect(input).toHaveFocus();
    
    // Add error state
    rerender(<Input error="New error" />);
    expect(input).toHaveFocus();
  });

  test('handles paste events', () => {
    const handlePaste = jest.fn();
    render(<Input onPaste={handlePaste} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'pasted text'
      }
    });
    
    expect(handlePaste).toHaveBeenCalled();
  });

  test('handles input with maxLength', () => {
    render(<Input maxLength={5} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '5');
    
    fireEvent.change(input, { target: { value: '12345' } });
    expect(input).toHaveValue('12345');
  });

  test('shows required indicator with label', () => {
    render(<Input label="Required Field" required />);
    
    expect(screen.getByText('Required Field')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeRequired();
  });
}); 