Cypress.Commands.add('login', (email, password) => {
  cy.intercept('POST', `${Cypress.env('API_BASE_URL')}/api/auth/login`).as('login');

  cy.visit('/login');
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('button').contains('Sign in').click();

  cy.wait('@login').then(interception => {
    cy.log('Login response:', interception.response);
    expect(interception.response.statusCode).to.eq(200);
    
    const setCookieHeader = interception.response.headers['set-cookie'];
    cy.log('Set-Cookie header:', setCookieHeader);

    if (setCookieHeader) {
      setCookieHeader.forEach(cookieString => {
        const [name, value] = cookieString.split('=');
        cy.setCookie(name.trim(), value.split(';')[0].trim());
      });
    }
  });

  cy.getAllCookies().then(cookies => {
    cy.log('Cookies after login:', cookies);
  });

  cy.url().should('eq', `${Cypress.config().baseUrl}/`);

  cy.reload();

  cy.contains('Profile', { timeout: 10000 }).should('be.visible');
});

  

Cypress.Commands.add('registerAndLogin', (user) => {
  cy.intercept('POST', `${Cypress.env('API_BASE_URL')}/api/user`).as('register');
  cy.intercept('POST', `${Cypress.env('API_BASE_URL')}/api/auth/login`).as('login');

  cy.getAllCookies().then(cookies => {
    cy.log('Initial cookies:', cookies);
  });

  cy.visit('/login');
  cy.get('button').contains('Register account').click();
  cy.get('input[name="email"]').type(user.email);
  cy.get('input[name="name"]').type(user.name);
  cy.get('input[name="password"]').type(user.password);
  cy.get('button').contains('Sign up').click();

  cy.wait('@register').then(interception => {
    cy.log('Register response:', interception.response);
    expect(interception.response.statusCode).to.eq(201);
  });

  cy.contains('Registration successful!', { timeout: 10000 }).should('be.visible');

  cy.get('input[name="email"]').clear().type(user.email);
  cy.get('input[name="password"]').clear().type(user.password);
  cy.get('button').contains('Sign in').click();

  cy.wait('@login').then((interception) => {
    cy.log('Login response:', interception.response);
    cy.log('Login response headers:', interception.response.headers);
    const setCookieHeader = interception.response.headers['set-cookie'];
    cy.log('Set-Cookie header:', setCookieHeader);

    if (setCookieHeader) {
      setCookieHeader.forEach(cookieString => {
        const [name, value] = cookieString.split('=');
        cy.setCookie(name.trim(), value.split(';')[0].trim());
      });
    }
    expect(interception.response.statusCode).to.eq(200);
    expect(interception.response.headers).to.have.property('set-cookie');
  });

  cy.getAllCookies().then(cookies => {
    cy.log('Cookies after login:', cookies);
  });

  cy.url().should('eq', `${Cypress.config().baseUrl}/`);

  cy.getCookie('access-token').should('exist');
  cy.getCookie('is-logged').should('have.property', 'value', 'true');

  cy.reload();
  
  cy.contains('Profile', { timeout: 10000 }).should('be.visible');
});



Cypress.Commands.add('logout', () => {
  cy.intercept('POST', `${Cypress.env('API_BASE_URL')}/api/auth/logout`).as('logout');

  cy.visit('/');
  cy.contains('Profile', { timeout: 10000 }).should('be.visible');

  cy.get('button').contains('Profile').click();
  cy.contains('Log out').click();

  cy.wait('@logout').then(interception => {
    cy.log('Logout response:', interception.response);
    expect(interception.response.statusCode).to.eq(201);
  });

  cy.clearCookies();
  cy.clearLocalStorage();
  
  cy.getAllCookies().then(cookies => {
    cy.log('Cookies after logout:', cookies);
    expect(cookies.length).to.eq(0); 
  });

  cy.url().should('eq', `${Cypress.config().baseUrl}/`);

  cy.reload();
  
  cy.contains('Log in', { timeout: 10000 }).should('be.visible');
});

  