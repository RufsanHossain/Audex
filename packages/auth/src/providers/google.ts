import Google from "next-auth/providers/google";

import type { Provider } from "next-auth/providers";

export const googleProvider: Provider = Google({
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code",
    },
  },
});
