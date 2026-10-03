export function validateCheckout(details) {
  const errors = {};
  if (!details.name.trim() || details.name.length > 100) errors.name = 'Enter your full name (up to 100 characters).';
  if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(details.email.trim()) || details.email.length > 254) errors.email = 'Enter a valid email address, such as name@example.com.';
  const digits = details.phone.replace(/\D/g, '');
  if (!/^\+?[\d\s().-]+$/.test(details.phone.trim()) || digits.length < 7 || digits.length > 15 || details.phone.length > 30) errors.phone = 'Enter a phone number with 7–15 digits; an international prefix is allowed.';
  if (details.address.trim().length < 10 || details.address.length > 500) errors.address = 'Enter a delivery address of 10–500 characters, including street and city.';
  return errors;
}
