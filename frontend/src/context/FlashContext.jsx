import { createContext, useCallback, useContext, useState } from "react";

const FlashContext = createContext(null);

export function FlashProvider({ children }) {
  const [flash, setFlash] = useState(null);

  const showFlash = useCallback((type, message) => {
    setFlash({ id: Date.now(), type, message });
  }, []);

  const showSuccess = useCallback(
    (message) => showFlash("success", message),
    [showFlash]
  );

  const showError = useCallback(
    (message) => showFlash("danger", message),
    [showFlash]
  );

  const clearFlash = useCallback(() => setFlash(null), []);

  return (
    <FlashContext.Provider
      value={{ flash, showFlash, showSuccess, showError, clearFlash }}
    >
      {children}
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const ctx = useContext(FlashContext);
  if (!ctx) {
    throw new Error("useFlash must be used inside FlashProvider");
  }
  return ctx;
}
