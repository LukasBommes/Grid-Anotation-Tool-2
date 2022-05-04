import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link as RouterLink
} from 'react-router-dom';
import './App.css';
import ButtonAppBar from './components/AppBar.js';
import Projects from './components/Projects.js';
import Editor from './components/Editor.js';


class App extends React.Component {

  render() {
    return (
      <div className="App">
        <Router>
          <ButtonAppBar />

          <Routes>
            <Route element={<Projects />} path="/projects" />
            <Route element={<Editor />} path="/editor" />
          </Routes>
        </Router>
      </div>
    );
  }

}

export default App;
