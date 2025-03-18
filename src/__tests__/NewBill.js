/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I navigate to NewBill Page", () => {
    beforeEach(() => {
      localStorage.setItem("user", JSON.stringify({ email: "test@test.com", type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.innerHTML = "";
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
    });

    test("Then the form should be displayed", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("Then uploading a valid file should update fileUrl and fileName", async () => {
      const newBill = new NewBill({ document, store: mockStore, localStorage: window.localStorage });
      const file = new File(["dummy data"], "test.png", { type: "image/png" });
      const fileInput = screen.getByTestId("file");

      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => expect(newBill.fileUrl).not.toBeNull());
      expect(newBill.fileName).toBe("test.png");
    });
  });
  
  describe("When I submit a new bill", () => {
    describe("When I submit a new bill", () => {
      test("Then it should send the bill to the mock API and navigate to Bills page", async () => {
        localStorage.setItem("user", JSON.stringify({ email: "test@test.com", type: "Employee" }));
        document.body.innerHTML = `<div id="root"></div>`;
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        window.onNavigate = (pathname) => {
          document.body.innerHTML = `<div id="root"></div>`;
          router();
        };
    
        new NewBill({
          document,
          onNavigate: window.onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        jest.spyOn(mockStore, "bills");
        jest.spyOn(mockStore.bills(), "update");

        screen.getByTestId("expense-type").value = "Transports";
        screen.getByTestId("expense-name").value = "Taxi";
        screen.getByTestId("amount").value = "50";
        screen.getByTestId("datepicker").value = "2024-03-10";
        screen.getByTestId("vat").value = "10";
        screen.getByTestId("pct").value = "20";
        screen.getByTestId("commentary").value = "Déplacement professionnel";
    
        const file = new File(["dummy data"], "receipt.jpg", { type: "image/jpeg" });
        const fileInput = screen.getByTestId("file");
        Object.defineProperty(fileInput, "files", { value: [file] });
        fireEvent.change(fileInput);
        fireEvent.submit(screen.getByTestId("form-new-bill"));
    
        await waitFor(() => expect(mockStore.bills().update).toHaveBeenCalled());
        await waitFor(() => expect(screen.getByTestId("icon-window")).toBeTruthy());
      });
    });
  });
});