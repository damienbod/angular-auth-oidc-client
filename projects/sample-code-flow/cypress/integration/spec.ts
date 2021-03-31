it('loads examples', () => {
  cy.visit('/');
});

it('loggs in correctly', () => {
  cy.visit('/');
  cy.get('button', { timeout: 20000 }).click();

  cy.location('href', { timeout: 20000 }).should('include', 'https://offeringsolutions-sts.azurewebsites.net');

  cy.get('#Email').type('dont@ask.me');
  cy.get('#Password').type('SuperSecretPassword');

  cy.get('.col-md-offset-4 > .btn').click();

  cy.location('href', { timeout: 20000 }).should('include', 'https://localhost:4200');
});
