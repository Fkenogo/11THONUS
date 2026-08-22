import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Auth, User, Unsubscribe } from "firebase/auth";
import { RequireAuthenticatedUser } from "./RequireAuthenticatedUser";

function fakeAuth(sequence: (User | null)[]): Auth {
  return {
    onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
      sequence.forEach((user) => callback(user));
      return () => {};
    },
  } as unknown as Auth;
}

describe("RequireAuthenticatedUser", () => {
  it("renders a loading state before the first onAuthStateChanged callback fires", () => {
    const auth = { onAuthStateChanged: () => () => {} } as unknown as Auth;

    render(
      <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <div>sign in</div>}>
        <div>protected content</div>
      </RequireAuthenticatedUser>,
    );

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.queryByText("sign in")).not.toBeInTheDocument();
  });

  it("renders children once a signed-in user is observed", () => {
    const user = { uid: "u-1" } as User;
    const auth = fakeAuth([user]);

    render(
      <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <div>sign in</div>}>
        <div>protected content</div>
      </RequireAuthenticatedUser>,
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  it("renders the unauthenticated fallback when no user is observed", () => {
    const auth = fakeAuth([null]);

    render(
      <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <div>sign in</div>}>
        <div>protected content</div>
      </RequireAuthenticatedUser>,
    );

    expect(screen.getByText("sign in")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("unsubscribes from onAuthStateChanged on unmount", () => {
    const unsubscribe = vi.fn();
    const auth = { onAuthStateChanged: () => unsubscribe } as unknown as Auth;

    const { unmount } = render(
      <RequireAuthenticatedUser auth={auth} renderUnauthenticated={() => <div>sign in</div>}>
        <div>protected content</div>
      </RequireAuthenticatedUser>,
    );
    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
