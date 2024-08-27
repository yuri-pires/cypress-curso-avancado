declare namespace Cypress {
  interface Chainable<Subject = any> {
    assertLoadingIsShownAndHidden(): void
  }
}