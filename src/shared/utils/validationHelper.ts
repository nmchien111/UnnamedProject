export const isValidEmail = (email: string): boolean => {
  if (!email) return false;

  // Biểu thức Regex cơ bản để check định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
