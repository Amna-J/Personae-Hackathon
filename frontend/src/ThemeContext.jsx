import { createContext, useContext } from "react";

/**
 * Provides the active design-system foundation for a page subtree.
 * 'earthen' — dark app pages (analysis, chat, results, lookbook, auth)
 * 'linen'   — light marketing pages (home, blogs, static)
 */
const ThemeContext = createContext("linen");

export const ThemeProvider = ({ foundation, children }) => (
  <ThemeContext.Provider value={foundation}>{children}</ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
