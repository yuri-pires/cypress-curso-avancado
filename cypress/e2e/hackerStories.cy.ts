import { faker } from "@faker-js/faker";

describe("Hacker Stories", () => {
  const initialTerm = "React";
  const newTerm = "Cypress";

  context("Mockando a API", () => {
    context("Footer and List of stories", () => {
      beforeEach(() => {
        cy.intercept(
          {
            method: "GET",
            pathname: "**/search",
            query: {
              query: initialTerm,
              page: "0",
            },
          },
          { fixture: "stories" }
        ).as("getStories");

        cy.visit("/");
        cy.wait("@getStories");
      });

      it("shows the footer", () => {
        cy.get("footer")
          .should("be.visible")
          .and("contain", "Icons made by Freepik from www.flaticon.com");
      });

      // Since the API is external,
      // I can't control what it will provide to the frontend,
      // and so, how can I assert on the data?
      // This is why this test is being skipped.
      // TODO: Find a way to test it out.
      it.skip("shows the right data for all rendered stories", () => {});
      it("shows one less story after dimissing the first story", () => {
        cy.get(".button-small").first().click();

        cy.get(".item").should("have.length", 1);
      });

      // Since the API is external,
      // I can't control what it will provide to the frontend,
      // and so, how can I test ordering?
      // This is why these tests are being skipped.
      // TODO: Find a way to test them out.
      context.skip("Order by", () => {
        it("orders by title", () => {});

        it("orders by author", () => {});

        it("orders by comments", () => {});

        it("orders by points", () => {});
      });
    });

    context("Search", () => {
      // Podemos ter vários intercepts acontecendo ao mesmo tempo
      // É indicado iniciar eles em um beforeEach para desde o ínicio do teste
      // ele ficar buscando essa requisição e manipular ela quando ela acontecer
      // Neste cenário temos dois intercepts, onde cada um ocorrerá dependendo
      // do termo de busca inerido do menu.
      beforeEach(() => {
        cy.intercept(
          {
            method: "GET",
            pathname: "**/search",
            query: {
              query: initialTerm,
              page: "0",
            },
          },
          {
            fixture: "empty",
          }
        ).as("getEmptySearch");

        cy.intercept(
          {
            method: "GET",
            pathname: "**/search",
            query: {
              query: newTerm,
              page: "0",
            },
          },
          {
            fixture: "stories",
          }
        ).as("getStories");

        cy.visit("/");
        cy.get("#search").clear();
      });

      it.only("types and hits ENTER", () => {
        cy.get("#search").type(`${newTerm}{enter}`);

        cy.wait("@getStories");
        cy.get(".item").should("have.length", 2);
        cy.get(`button:contains(${initialTerm})`).should("be.visible");
      });

      it("types and clicks the submit button", () => {
        cy.get("#search").type(newTerm);
        cy.contains("Submit").click();

        cy.wait("@getCypressSearch");

        cy.get(".item").should("have.length", 20);
        cy.get(".item").first().should("contain", newTerm);
        cy.get(`button:contains(${initialTerm})`).should("be.visible");
      });

      it("types and submits the form directly", () => {
        cy.get("#search").type(newTerm);
        cy.get("form").submit();

        cy.wait("@getCypressSearch");
        cy.get(".item").should("have.length", 20);
      });

      context("Last searches", () => {
        it("shows a max of 5 buttons for the last searched terms", () => {
          cy.intercept("GET", "**/search**").as("getRandomWord");

          Cypress._.times(6, () => {
            cy.get("#search").clear().type(`${faker.random.word()}{enter}`);
            cy.wait("@getRandomWord");
          });

          cy.get(".last-searches button").should("have.length", 5);
        });
      });
    });
  });
});

context("Errors", () => {
  it('shows "Something went wrong ..." in case of a server error', () => {
    cy.intercept(
      {
        method: "GET",
        pathname: "**/search",
      },
      {
        statusCode: 500,
      }
    ).as("internalServerError");

    cy.visit("/");

    cy.wait("@internalServerError");
    cy.contains("Something went wrong ...").should("be.visible");
  });

  it('shows "Something went wrong ..." in case of a network error', () => {
    cy.intercept(
      {
        method: "GET",
        pathname: "**/search",
      },
      {
        forceNetworkError: true,
      }
    ).as("networkError");

    cy.visit("/");

    cy.wait("@networkError");
    cy.get("p:contains(Something went wrong)").should("be.visible");
  });
});
