it('loads examples', () => {
  cy.visit('/');
});

it('loggs in correctly', () => {
  cy.visit('/');
  cy.get('button', { timeout: 20000 }).click();

  cy.location('href', { timeout: 20000 }).should('include', 'https://offeringsolutions-sts.azurewebsites.net');

  cy.get('#Email').type('fabian.gosebrink@hotmail.com');
  cy.get('#Password').type('1234Lea0000!');

  cy.get('.col-md-offset-4 > .btn').click();

  cy.location('href', { timeout: 20000 }).should('include', 'https://localhost:4200');
});
