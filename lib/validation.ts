/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Password strength validation
 * Requirements:
 * - At least 6 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password minimal 6 karakter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password harus mengandung huruf besar");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password harus mengandung huruf kecil");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password harus mengandung angka");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Name validation
 */
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.length >= 3 &&
    trimmed.length <= 100 &&
    /^[a-zA-Z\s'-]+$/.test(trimmed)
  );
}

/**
 * Validate all registration inputs
 */
export function validateRegistrationInput(
  name: string,
  email: string,
  password: string,
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!isValidName(name)) {
    errors.name = "Nama harus 3-100 karakter, hanya huruf/spasi/tanda baca";
  }

  if (!isValidEmail(email)) {
    errors.email = "Format email tidak valid";
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors[0];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login inputs
 */
export function validateLoginInput(
  email: string,
  password: string,
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!isValidEmail(email)) {
    errors.email = "Format email tidak valid";
  }

  if (!password || password.length < 1) {
    errors.password = "Password tidak boleh kosong";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
