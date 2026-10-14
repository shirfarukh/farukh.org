import React, { createContext, useContext, useState } from 'react';

interface ScrollHeaderContextType {
  scrollY: number;
  setScrollY: (y: number) => void;
}

const ScrollHeaderContext = createContext<ScrollHeaderContextType>({
  scrollY: 0,
  setScrollY: () => {},
});

export const ScrollHeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scrollY, setScrollY] = useState(0);

  return (
    <ScrollHeaderContext.Provider value={{ scrollY, setScrollY }}>
      {children}
    </ScrollHeaderContext.Provider>
  );
};

export const useScrollHeader = () => useContext(ScrollHeaderContext);
