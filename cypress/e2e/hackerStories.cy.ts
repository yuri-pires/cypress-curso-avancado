import { faker } from "@faker-js/faker";
import { any } from "cypress/types/bluebird";

describe("Hacker Stories", () => {
  const stories = require("../fixtures/stories.json");
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
      // Com a API mockada, conseguimos testar que o dado em tal linha corresponde
      // ao dado enviado no mock
      it("shows the right data for all rendered stories", () => {
        // Neste teste, após mockar a API, nós criamos um objeto com o json da fixture
        // Esse JSON será nosso objeto para comparar com as linhas da tabela
        cy.get(".item")
          .first()
          .should("contain", stories.hits[0].title)
          .and("contain", stories.hits[0].author)
          .and("contain", stories.hits[0].num_comments)
          .and("contain", stories.hits[0].points);

        // Podemos capturar um elemento utilizando esse seletor jQuery
        // Após, verificamos que o elemento a dentro de um objeto com a classe .item
        // Tem o atributo href
        cy.get(`.item a:contains(${stories.hits[0].title})`).should(
          "have.attr",
          "href",
          `${stories.hits[0].url}`
        );

        cy.get(".item")
          .last()
          .should("contain", stories.hits[1].title)
          .and("contain", stories.hits[1].author)
          .and("contain", stories.hits[1].num_comments)
          .and("contain", stories.hits[1].points);
      });

      it("shows one less story after dimissing the first story", () => {
        cy.get(".button-small").first().should("be.visible").click();

        cy.get(".item").should("have.length", 1);
      });

      // Since the API is external,
      // I can't control what it will provide to the frontend,
      // and so, how can I test ordering?
      // This is why these tests are being skipped.
      // TODO: Find a way to test them out.
      context("Order by", () => {
        it("orders by title", () => {
          cy.get(".list-header-button:contains(Title)")
            .as("titleHeader")
            .should("be.visible")
            .click();

          cy.get(".item")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[0].title);

          cy.get("@titleHeader").click();

          cy.get(".item")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[1].title);
        });

        it("orders by author", () => {
          cy.get(".list-header-button:contains(Author)")
            .as("authorHeader")
            .should("be.visible")
            .click();

          cy.get(".item")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[0].author);

          cy.get("@authorHeader").click();

          cy.get(".item")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[1].author);
        });

        it("orders by comments", () => {
          cy.get(".list-header-button:contains(Comments)")
            .as("commentsHeader")
            .should("be.visible")
            .click();

          cy.get(".item")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[1].num_comments);

          cy.get("@commentsHeader").click();

          cy.get(".item")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[0].num_comments);
        });

        it("orders by points", () => {
          cy.get(".list-header-button:contains(Points)")
            .as("pointsHeader")
            .should("be.visible")
            .click();

          cy.get(".item")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[1].points);

          cy.get("@pointsHeader").click();

          cy.get(".item")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[0].points);
        });
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
        cy.get("#search").should("be.visible").clear();
      });

      it("shows no story when none is returned", () => {
        cy.get(".item").should("not.exist");
      });

      it("types and hits ENTER", () => {
        cy.get("#search").should("be.visible").type(`${newTerm}{enter}`);

        cy.wait("@getStories");
        cy.get(".item").should("have.length", 2);
        cy.get(`button:contains(${initialTerm})`).should("be.visible");
      });

      it("types and clicks the submit button", () => {
        cy.get("#search").should("be.visible").type(newTerm);
        cy.contains("Submit").click();

        cy.wait("@getStories");

        cy.get(".item").should("have.length", 2);
      });

      // Não é uma boa prática enviar diretamente, pois
      // não reproduz o comportamento real do usário
      it.skip("types and submits the form directly", () => {
        cy.get("#search").should("be.visible").type(newTerm);
        cy.get("form").submit();

        cy.wait("@getCypressSearch");
        cy.get(".item").should("have.length", 20);
      });

      context("Last searches", () => {
        it("shows a max of 5 buttons for the last searched terms", () => {
          cy.intercept("GET", "**/search**", { fixture: "empty" }).as(
            "getRandomWord"
          );

          Cypress._.times(6, () => {
            const randomWord = faker.random.word();
            cy.get("#search").clear().type(`${randomWord}{enter}`);
            cy.wait("@getRandomWord");

            cy.getLocalStorage("search").should("equal", randomWord);
          });

          //cy.get(".last-searches button").should("have.length", 5);

          cy.get(".last-searches").within(() => {
            cy.get("button").should("have.length", 5);
          });
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
