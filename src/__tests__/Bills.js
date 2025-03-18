/**
 * @jest-environment jsdom
 */
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { modal } from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore); 

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.innerHTML = "";
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');

      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from latest to earliest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
    
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);
    
      const antiChrono = (a, b) => (new Date(b) - new Date(a));
      const datesSorted = [...dates].sort(antiChrono);
    
      expect(datesSorted).toEqual(dates);
    });

    test("Then clicking on an eye icon should open the modal", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      document.body.innerHTML += modal();

      await waitFor(() => screen.getAllByTestId("icon-eye").toBeInTheDocument);

      const eyeIcon = screen.getAllByTestId("icon-eye");
      const firstEyeIcon = eyeIcon[0];
      fireEvent.click(firstEyeIcon);

      expect(screen.getAllByText('Justificatif')).toBeInTheDocument;
    });

    test("Then it should display the correct number of bills", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      expect(screen.getByTestId("tbody").children.length).toBe(bills.length);
    });

    test("Then it should display an error message when UI receives an error", () => {
      const errorMessage = "Erreur 404";
      document.body.innerHTML = BillsUI({ error: errorMessage });

      expect(screen.getByText(errorMessage)).toBeInTheDocument;
    });

    test("Then it should display a loading message if loading", () => {
      document.body.innerHTML = BillsUI({ loading: true });

      expect(screen.getByText("Loading...")).toBeInTheDocument;
    });

    test("Then it should display the correct number of bills in the UI", async () => {
      await waitFor(() => screen.getByText("Mes notes de frais").toBeTruthy);
      expect(screen.getByTestId("tbody").children.length).toBe(bills.length);
    });

    test("Then clicking on 'Nouvelle note de frais' should navigate to NewBill", async () => {
      await waitFor(() => screen.getByTestId("btn-new-bill").toBeTruthy);

      const newBillButton = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillButton);

      await waitFor(() => expect(screen.getByText("Envoyer une note de frais")).toBeTruthy());
    });

    test("Then if formatDate fails, it should log an error and return unformatted date", async () => {

      jest.spyOn(mockStore.bills(), "list").mockImplementationOnce(() =>
        Promise.resolve([{ date: "invalid-date", status: "pending" }])
      );

      const billsContainer = new Bills({ document, store: mockStore, localStorage: window.localStorage });
      const bills = await billsContainer.getBills();

      expect(bills[0].date).toBe("invalid-date");
    });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    test("Then it should display an error message when API returns a 404 error", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error("Erreur 404")),
      }));
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);

      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("Then it should display a 500 error message when the API fails", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: () => Promise.reject(new Error("Erreur 500")),
      }));
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);

      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
});