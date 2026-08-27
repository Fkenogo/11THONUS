import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import i18n from "../i18n/config";
import { en } from "../i18n/locales/en";
import { fr } from "../i18n/locales/fr";
import { DisplayNameProfile } from "./DisplayNameProfile";
import * as displayNameApi from "./api/displayName";
import { IdentityApiError } from "./api/identityCallableClient";

const fakeAuth = {
  onAuthStateChanged: (callback: (user: unknown) => void) => {
    callback({ providerData: [{ providerId: "google.com" }], getIdToken: async () => "tok" });
    return () => {};
  },
} as unknown as Auth;

const fakeFunctions = {} as Functions;

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DisplayNameProfile auth={fakeAuth} functions={fakeFunctions} />
    </QueryClientProvider>,
  );
}

afterEach(async () => {
  vi.restoreAllMocks();
  await i18n.changeLanguage("en");
});

describe("DisplayNameProfile — incomplete state", () => {
  it("renders the completion prompt when the caller has no Display Name", async () => {
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    renderProfile();
    expect(await screen.findByText(en.identity.profile.missing)).toBeInTheDocument();
    expect(screen.getByLabelText(en.identity.profile.displayNameLabel)).toHaveValue("");
  });
});

describe("DisplayNameProfile — complete state", () => {
  it("renders the existing Display Name and an edit action", async () => {
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: "Fred Kenogo",
    }));
    renderProfile();
    expect(await screen.findByText("Fred Kenogo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en.identity.profile.editAction }),
    ).toBeInTheDocument();
  });

  it("enters edit mode with the current value prefilled, and can be cancelled without saving", async () => {
    const setDisplayName = vi.fn();
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: "Fred Kenogo",
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(setDisplayName);
    renderProfile();
    await screen.findByText("Fred Kenogo");

    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.editAction }));
    const input = screen.getByLabelText(en.identity.profile.displayNameLabel);
    expect(input).toHaveValue("Fred Kenogo");

    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.cancel }));
    expect(setDisplayName).not.toHaveBeenCalled();
    expect(screen.getByText("Fred Kenogo")).toBeInTheDocument();
  });
});

describe("DisplayNameProfile — save flow", () => {
  it("saves a valid Display Name and rehydrates from the backend-authoritative response", async () => {
    const setDisplayName = vi.fn(async () => ({ displayName: "New Name" }));
    let stored = "";
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: stored || undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(async () => {
      stored = "New Name";
      return setDisplayName();
    });
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(screen.getByLabelText(en.identity.profile.displayNameLabel), "New Name");
    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.save }));

    await waitFor(() => expect(setDisplayName).toHaveBeenCalled());
    expect(await screen.findByText("New Name")).toBeInTheDocument();
  });

  it("trims whitespace before enabling save and sends the trimmed value", async () => {
    const setDisplayName = vi.fn(async () => ({ displayName: "Padded" }));
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(setDisplayName);
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(screen.getByLabelText(en.identity.profile.displayNameLabel), "  Padded  ");
    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.save }));

    await waitFor(() =>
      expect(setDisplayName).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ displayName: "Padded" }),
      ),
    );
  });

  it("rejects an empty value client-side and never calls the backend", async () => {
    const setDisplayName = vi.fn();
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(setDisplayName);
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    const saveButton = screen.getByRole("button", { name: en.identity.profile.save });
    expect(saveButton).toBeDisabled();
    await userEvent.click(saveButton);
    expect(setDisplayName).not.toHaveBeenCalled();
  });

  it("rejects a value over 50 characters client-side and never calls the backend", async () => {
    const setDisplayName = vi.fn();
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(setDisplayName);
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(
      screen.getByLabelText(en.identity.profile.displayNameLabel),
      "a".repeat(51),
    );
    expect(screen.getByRole("button", { name: en.identity.profile.save })).toBeDisabled();
    expect(screen.getByText(en.identity.validation.tooLong)).toBeInTheDocument();
  });

  it("accepts Unicode content (does not frontend-block emoji/CJK/accented input)", async () => {
    const setDisplayName = vi.fn(async () => ({ displayName: "김민준 😀" }));
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(setDisplayName);
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(screen.getByLabelText(en.identity.profile.displayNameLabel), "김민준 😀");
    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.save }));

    await waitFor(() => expect(setDisplayName).toHaveBeenCalled());
  });

  it("does not block duplicate Display Names client-side (no uniqueness check)", async () => {
    const setDisplayName = vi.fn(async () => ({ displayName: "Same As Someone Else" }));
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(setDisplayName);
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(
      screen.getByLabelText(en.identity.profile.displayNameLabel),
      "Same As Someone Else",
    );
    expect(screen.getByRole("button", { name: en.identity.profile.save })).not.toBeDisabled();
  });
});

describe("DisplayNameProfile — error states", () => {
  it("shows a mapped error and does not show success when the save fails", async () => {
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(async () => {
      throw new IdentityApiError("unavailable");
    });
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(screen.getByLabelText(en.identity.profile.displayNameLabel), "Name");
    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.save }));

    expect(await screen.findByRole("alert")).toHaveTextContent(en.identity.errors.unavailable);
    expect(screen.queryByText(en.identity.profile.saved)).not.toBeInTheDocument();
    // Still shows the incomplete prompt, not a fabricated success.
    expect(screen.getByText(en.identity.profile.missing)).toBeInTheDocument();
  });

  it("never leaks a raw error message", async () => {
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(async () => {
      throw new IdentityApiError("failed");
    });
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(screen.getByLabelText(en.identity.profile.displayNameLabel), "Name");
    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.save }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toMatch(/firebase|internal|stack|exception/i);
  });

  it("allows retry after a failed save, and the retry can succeed", async () => {
    let attempt = 0;
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: attempt > 0 ? "Recovered" : undefined,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(async () => {
      attempt += 1;
      if (attempt === 1) throw new IdentityApiError("unavailable");
      return { displayName: "Recovered" };
    });
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(screen.getByLabelText(en.identity.profile.displayNameLabel), "Recovered");
    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.save }));
    await screen.findByRole("alert");

    await userEvent.click(screen.getByRole("button", { name: en.identity.profile.save }));
    expect(await screen.findByText("Recovered")).toBeInTheDocument();
  });

  it("disables the save button while a save is in flight, preventing a double submit", async () => {
    let resolveSave: (value: { displayName: string }) => void = () => {};
    let stored: string | undefined;
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: stored,
    }));
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(
      () =>
        new Promise((resolve) => {
          resolveSave = (value) => {
            stored = value.displayName;
            resolve(value);
          };
        }),
    );
    renderProfile();
    await screen.findByText(en.identity.profile.missing);

    await userEvent.type(screen.getByLabelText(en.identity.profile.displayNameLabel), "Name");
    const saveButton = screen.getByRole("button", { name: en.identity.profile.save });
    await userEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    resolveSave({ displayName: "Name" });
    await screen.findByText("Name");
  });
});

describe("DisplayNameProfile — localization", () => {
  it("renders French copy when French is active, with no English leakage", async () => {
    await i18n.changeLanguage("fr");
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(async () => ({
      displayName: undefined,
    }));
    const { container } = renderProfile();
    expect(await screen.findByText(fr.identity.profile.missing)).toBeInTheDocument();
    expect(screen.getByLabelText(fr.identity.profile.displayNameLabel)).toBeInTheDocument();
    expect(container.textContent).not.toContain(en.identity.profile.missing);
  });
});

describe("DisplayNameProfile — no direct Firestore / no arbitrary target", () => {
  it("calls only the governed callables, never a Firestore SDK, and passes no target id", async () => {
    const getMy = vi.fn(async () => ({ displayName: undefined }));
    const setDisplay = vi.fn(async () => ({ displayName: "X" }));
    vi.spyOn(displayNameApi, "makeCallGetMyDisplayName").mockReturnValue(getMy);
    vi.spyOn(displayNameApi, "makeCallSetDisplayName").mockReturnValue(setDisplay);
    renderProfile();
    await screen.findByText(en.identity.profile.missing);
    expect(getMy).toHaveBeenCalledWith(
      expect.objectContaining({ referenceType: "google_sign_in" }),
    );
  });
});
