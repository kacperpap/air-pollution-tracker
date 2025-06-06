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
      cy.contains('Simulation overview')
        .should('be.visible')
        .click({ force: true });
  
      cy.url().should('include', '/simulation-overview');
  
      cy.wait('@simulations').then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 304]);
      });

    
      const checkSimulationStatus = (retries = 10) => {
        if (retries === 0) {
          throw new Error('Simulation did not complete in time or failed.');
        }
        cy.log(`Left retries of checkSimulationStatus: ${retries}`);
      
        cy.reload();
        cy.wait('@simulations').then((interception) => {
          expect(interception.response.statusCode).to.be.oneOf([200, 304]);
        });
      
        cy.contains('li', `Simulation #${testSimulation.id}`)
          .should('exist')
          .should('be.visible')
          .find('span')
          .should('exist')
          .should('be.visible')
          .invoke('text')
          .then((text) => {
            const status = text.trim();
            if (status.includes('completed')) {
              return;
            } else if (status.includes('failed') || status.includes('timeExceeded')) {
              throw new Error(`Simulation failed with status: ${status}`);
            } else {
              cy.wait(5000);
              checkSimulationStatus(retries - 1);
            }
          });
      };
  
      checkSimulationStatus(12);
    });
  });
  