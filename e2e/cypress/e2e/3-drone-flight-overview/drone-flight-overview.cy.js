describe('Drone Flight Overview', () => {

  let authCookies = {};

  before(() => {
    cy.fixture('user').then(user => {
      cy.login(user.email, user.password);

      cy.getCookie('access-token').then(cookie => {
        if (cookie) authCookies['access-token'] = cookie.value;
      });
      cy.getCookie('is-logged').then(cookie => {
        if (cookie) authCookies['is-logged'] = cookie.value;
      });
    });
  });
   
  it('should display added flight', () => {

    const cookieString = Object.entries(authCookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    
    cy.log('Cookie string to be used:', cookieString);

    cy.intercept('GET', `${Cypress.env('API_BASE_URL')}/api/drone`, (req) => {
      req.headers['Cookie'] = cookieString;
      req.headers['Content-Type'] = 'application/json';
      return req;
    }).as('drone-overview');

    cy.visit('/data-overview');

    cy.wait('@drone-overview')
      .its('response.statusCode')
      .should('eq',200);
       
    cy.fixture('flight').then(flight => {
      cy.contains(flight.title).should('be.visible');
    });
  });
});