
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import Game from './components/Game'
import Menu from './components/Menu'
function App() {
  

  return (

    
    <>
     <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
      
      
    </>
  )
}

export default App
