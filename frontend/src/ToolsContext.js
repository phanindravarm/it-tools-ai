import { createContext, useContext, useState, useEffect } from 'react';
import { neon } from '@neondatabase/serverless';
const ToolsContext = createContext();

export const useTools = () => useContext(ToolsContext);

export const ToolsProvider = ({ children }) => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const res = await fetch('https://it-backend-xi.vercel.app/tools');
        const data = await res.json();
        setTools(data);
      } catch (err) {
        setError('Failed to fetch tools');
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  return (
    <ToolsContext.Provider value={{ tools, setTools, loading, error, setError }}>
      {children}
    </ToolsContext.Provider>
  );
};
