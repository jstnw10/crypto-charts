"use client";

import { Provider } from "jotai";
import { ReactNode } from "react";

function JotaiProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>;
}

export { JotaiProvider };
