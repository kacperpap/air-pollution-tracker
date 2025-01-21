import { generateTestUser } from '../../support/auth-data';

describe('Authentication Flow', () => {
  it('should register and login successfully', () => {
    const user = generateTestUser();
    cy.writeFile('cypress/fixtures/user.json', user);
    cy.registerAndLogin(user);
    cy.logout();
  });
});