import { faker } from "@faker-js/faker";

describe("Hacker Stories", () => {
  const initialTerm = "React";
  const newTerm = "Cypress";

  beforeEach(() => {
    cy.intercept({
      method: "GET",
      pathname: "**/search",
      query: {
        query: initialTerm,
        page: "0",
      },
    }).as("getStories");

    cy.visit("/");
    cy.wait("@getStories");
  });

  context("Chamadas diretamente na API do HackerNews", () => {
    it('shows 20 stories, then the next 20 after clicking "More"', () => {
      cy.intercept({
        method: "GET",
        pathname: "**/search",
        query: {
          query: initialTerm,
          page: "1",
        },
      }).as("getNextStories");

      cy.get(".item").should("have.length", 20);

      cy.contains("More").click();

      cy.wait("@getNextStories");
      cy.get(".item").should("have.length", 40);
    });

    it("searches via the last searched term", () => {
      cy.intercept({
        method: "GET",
        pathname: "**/search",
        query: {
          query: newTerm,
          page: "0",
        },
      }).as("getCypressSearch");

      cy.get("#search").clear().type(`${newTerm}{enter}`);

      cy.wait("@getCypressSearch");

      cy.getLocalStorage("search").should("equal", newTerm);

      cy.get(`button:contains(${initialTerm})`).should("be.visible").click();

      cy.wait("@getStories");

      cy.getLocalStorage("search").should("equal", initialTerm);

      cy.get(".item").should("have.length", 20);
      cy.get(".item").first().should("contain", initialTerm);
      cy.get(`button:contains(${newTerm})`).should("be.visible");
    });
  });
});
