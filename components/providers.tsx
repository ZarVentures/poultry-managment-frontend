"use client";

import { Provider } from "react-redux";
import { store } from "@/app/redux/store";
import ThemeProvider from "./theme-provider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );
}