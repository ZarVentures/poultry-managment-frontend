"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/redux/store";
import { setTheme } from "@/app/redux/slices/themeSlice";

const STORAGE_KEY = "poultry-sathi-theme";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.theme.mode);

  // On mount: restore theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      if (saved !== mode) {
        dispatch(setTheme(saved));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On mode change: toggle class + persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return <>{children}</>;
}
