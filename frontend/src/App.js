import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToolsProvider } from './ToolsContext';
import Home from './Home';
import Tools from './Tools';

const App = () => {
  return (
    <ToolsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tool/:id" element={<Tools />} />
        </Routes>
      </Router>
    </ToolsProvider>
  );
};

export default App;
