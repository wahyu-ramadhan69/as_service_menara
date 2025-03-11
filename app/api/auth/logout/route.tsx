import { respondWithError, respondWithSuccess } from "@/app/lib/Response";

// Handler untuk logout
export async function POST() {
  try {
    const response = respondWithSuccess("Logout successful", {}, 200);
    response.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error(error);
    return respondWithError("Error logging out", 500);
  }
}
