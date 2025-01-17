import { generateTestFlight } from '../../support/drone-flight-data';

describe('Drone Flight Management', () => {
  
  let testFlight;
  let authCookies = {};

  before(() => {
    cy.fixture('user').then(user => {
      testFlight = generateTestFlight(user.name);
      cy.writeFile('cypress/fixtures/flight.json', testFlight);
      cy.login(user.email, user.password);

      cy.getCookie('access-token').then(cookie => {
        if (cookie) authCookies['access-token'] = cookie.value;
      });
      cy.getCookie('is-logged').then(cookie => {
        if (cookie) authCookies['is-logged'] = cookie.value;
      });
    });
  });

  it('should successfully add a new drone flight', () => {

    const cookieString = Object.entries(authCookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    
    cy.log('Cookie string to be used:', cookieString);

    cy.intercept('POST', `${Cypress.env('API_BASE_URL')}/api/drone`, (req) => {
      req.headers['Cookie'] = cookieString;
      req.headers['Content-Type'] = 'application/json';
      return req;
    }).as('drone-flight');

    cy.visit('/drone-input');

    cy.get('input[name="title"]').type(testFlight.title);
    cy.get('textarea[name="description"]').type(testFlight.description);

    testFlight.measurements.forEach((measurement, index) => {
      cy.get('input[name="name"]').type(measurement.name);
      cy.get('input[name="latitude"]').type(measurement.latitude);
      cy.get('input[name="longitude"]').type(measurement.longitude);
      cy.get('input[name="temperature"]').type(measurement.temperature);
      cy.get('input[name="pressure"]').type(measurement.pressure);
      cy.get('input[name="windSpeed"]').type(measurement.windSpeed);
      cy.get('input[name="windDirection"]').type(measurement.windDirection);

      cy.get('input[name="CO"]').type(measurement.pollutants.CO);
      cy.get('input[name="O3"]').type(measurement.pollutants.O3);
      cy.get('input[name="SO2"]').type(measurement.pollutants.SO2);
      cy.get('input[name="NO2"]').type(measurement.pollutants.NO2);

      cy.get('button').contains('Add measurement').click();
    });
    
    cy.get('button').contains('Save').click();

    cy.wait('@drone-flight')
      .its('response.statusCode')
      .should('eq', 201);

      cy.contains('Data saved successfully!').should('be.visible');
    });
  });