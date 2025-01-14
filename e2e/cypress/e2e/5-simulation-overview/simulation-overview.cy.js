describe('Simulation Overview', () => {
    let authCookies = {};
    let testSimulation;
  
    before(() => {
      cy.fixture('user').then((user) => {
        cy.fixture('simulation').then((simulation) => {
          testSimulation = simulation;
  
          cy.login(user.email, user.password);
  
          cy.getCookie('access-token').then((cookie) => {
            if (cookie) authCookies['access-token'] = cookie.value;
          });
          cy.getCookie('is-logged').then((cookie) => {
            if (cookie) authCookies['is-logged'] = cookie.value;
          });
        });
      });
    });
  
    it('should display performed simulation with success status', () => {
      const cookieString = Object.entries(authCookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
  
      cy.log('Cookie string to be used:', cookieString);
  
      cy.intercept('GET', `${Cypress.env('API_BASE_URL')}/api/simulation-pollution-spread/light`, (req) => {
        req.headers['Cookie'] = cookieString;
        req.headers['Content-Type'] = 'application/json';
        return req;
      }).as('simulations');
  
      cy.get('button').contains('Features').click();
      cy.contains('Simulation overview', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true });
  
      cy.url().should('include', '/simulation-overview');
  
      cy.wait('@simulations').its('response.statusCode').should('eq', 200);
  
      cy.contains(`Simulation #${testSimulation.id}`, { timeout: 10000 })
        .should('be.visible')
        .closest('li')
        .should('exist')
        .and('be.visible')
        .within(() => {
          cy.get('span')
            .invoke('text') 
            .should('include', 'completed');
        });

    });
  });
  