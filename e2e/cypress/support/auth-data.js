import { v4 as uuidv4 } from 'uuid';

export const generateTestUser = () => {
  const unique = uuidv4();
  return {
    email: `test${unique}@example.com`,
    password: 'Test123!',
    name: `tester${unique}`
  };
};