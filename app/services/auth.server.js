import { createCookieSessionStorage, redirect } from "remix";
import { APP_NAME, SECRET } from "../config";
import UserModel from "../db/models/user.server";
import { isUserOnboarded } from "./onboarding";

const sessionExpirationTime = 1000 * 60 * 60 * 24 * 365;

export const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: `${APP_NAME}_session`,
    secrets: [SECRET],
    sameSite: "lax",
    path: "/",
    maxAge: sessionExpirationTime / 1000,
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
  },
});

export const getUserFromCookie = async (
  request,
  { redirectTo = "/", noRedirect = false } = {}
) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session) {
    if (!noRedirect) {
      throw redirect(redirectTo);
    }
  }
  const userId = session.get("userId");
  const user = await UserModel.findById(userId);
  if (!user && !noRedirect) throw redirect(redirectTo);
  if (!isUserOnboarded(user) && !noRedirect) return redirect("/welcome/login-profile");
  return user;
};

export const getUnauthentifiedUserFromCookie = (request) =>
  getUserFromCookie(request, { noRedirect: true });

export const createUserSession = async (request, user, redirectTo = "/") => {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", user._id);
  user.set({ lastLoginAt: Date.now() });
  await user.save();
  if (!isUserOnboarded(user)) redirectTo = "/welcome/login-profile";
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};
