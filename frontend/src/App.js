import React from 'react';
import { makeStyles, Theme } from "@mui/styles";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link as RouterLink
} from 'react-router-dom';
import './App.css';
//import ButtonAppBar from './components/AppBar.js';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AppsIcon from '@mui/icons-material/Apps';

import Projects from './components/Projects.js';
import Editor from './components/Editor.js';


const useStyles = makeStyles((theme: Theme) => ({
  // root: {
  //   flexGrow: 1,
  //   height: "100%",
  //   paddingTop: "64px",
  // },
  appBar: {
    zIndex: 200000,
    background: '#f00',
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));


export default function App() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Router>
        {/*<ButtonAppBar />*/}
        <AppBar position="absolute" className={classes.appBar}>
          <Toolbar>
            <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              aria-label="menu"
              component={RouterLink}
              to="/projects"
            >
              <AppsIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              PV Module Extractor
            </Typography>
            {/*<Button color="inherit">Login</Button>*/}
          </Toolbar>
        </AppBar>

        <Routes>
          <Route element={<Projects />} path="/projects" />
          <Route element={<Editor />} path="/editor" />
        </Routes>
      </Router>
    </div>
  );
}
