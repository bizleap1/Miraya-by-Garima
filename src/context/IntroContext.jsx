import { createContext, useContext, useState } from 'react';

const IntroContext = createContext({ introComplete: false });

export const useIntro = () => useContext(IntroContext);

export const IntroProvider = ({ children }) => {
  // Always false on fresh load — set to true when preloader finishes
  const [introComplete, setIntroComplete] = useState(false);
  return (
    <IntroContext.Provider value={{ introComplete, setIntroComplete }}>
      {children}
    </IntroContext.Provider>
  );
};
