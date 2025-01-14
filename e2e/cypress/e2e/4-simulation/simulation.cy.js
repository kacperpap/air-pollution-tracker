import { generateSimulationData } from '../../support/simulation-data';

describe('Simulation Management', () => {
  
  let testSimulation;
  let authCookies = {};

  before(() => {
    cy.fixture('user').then(user => {
      
      testSimulation = generateSimulationData();
      
      cy.login(user.email, user.password);

      cy.getCookie('access-token').then(cookie => {
        if (cookie) authCookies['access-token'] = cookie.value;
      });
      cy.getCookie('is-logged').then(cookie => {
        if (cookie) authCookies['is-logged'] = cookie.value;
      });
    });
  });

  it('should successfully run simulation with test flight parameters', () => {

    const cookieString = Object.entries(authCookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    
    cy.log('Cookie string to be used:', cookieString);

    cy.intercept('GET', `${Cypress.env('API_BASE_URL')}/api/drone`, (req) => {
        req.headers['Cookie'] = cookieString;
        req.headers['Content-Type'] = 'application/json';
        return req;
    }).as('drone-flights');

    cy.intercept('POST', `${Cypress.env('API_BASE_URL')}/api/simulation-pollution-spread/droneFlight`, (req) => {
        req.headers['Cookie'] = cookieString;
        req.headers['Content-Type'] = 'application/json';
        return req;
    }).as('simulate');

    cy.get('button').contains('Features').click();
    cy.contains('Simulate data pollution spread', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    cy.url().should('include', '/simulation-input');
    cy.contains('Simulation Setup', { timeout: 10000 }).should('be.visible');

    cy.wait('@drone-flights')
      .its('response.statusCode')
      .should('eq', 200);

    cy.get('select[name="droneFlight"]')
      .should('be.visible')
      .find('option')
      .should('have.length.greaterThan', 1);

    cy.get('select[name="droneFlight"]')
      .find('option:not([value=""])') 
      .first() 
      .then((option) => {
        const optionValue = option.val();
        cy.get('select[name="droneFlight"]').select(optionValue, { force: true });
    });

    cy.wait(2000);
    
    testSimulation.pollutants.forEach(pollutant => {
      cy.contains('label', pollutant)
        .find('input[type="checkbox"]')
        .check({ force: true, timeout: 10000 })
        .should('be.checked');
    });
    
    cy.get('button').contains('Start Simulation').click();

    cy.wait('@simulate').then(interception => {
        expect(interception.response.statusCode).to.eq(201);
  
        const simulationId = interception.response.body.simulationId;
        cy.log(`Simulation created with ID: ${simulationId}`);
  
        cy.writeFile('cypress/fixtures/simulation.json', {
          id: simulationId,
          ...testSimulation
        });
  
        cy.url().should('include', `/simulation-overview/${simulationId}`);
      });
    });
  });