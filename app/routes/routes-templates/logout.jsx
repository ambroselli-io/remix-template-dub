import { redirect } from "remix";
import { destroySession, getSession } from "../services/auth.server";

export const action = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};

export default () => null;