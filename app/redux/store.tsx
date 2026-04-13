import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import billingReducer from "./slices/billingSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    billing: billingReducer,
  },
});

// ✅ ADD THIS
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;