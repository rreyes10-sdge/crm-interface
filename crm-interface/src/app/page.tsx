'use client';

import React, { useState, useEffect } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, Typography } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import client from '../apollo-client';
import styles from "./page.module.css";
import MainGrid from "./components/MainGrid";
import ProjectTracker from "./components/ProjectTracker";
import Timeline from "./components/TimelineOld"
import Head from 'next/head';
import UserStats from './components/UserStats';
import EvPage from './components/EvPage';
import ProjectSummary from './components/ProjectSummary';
import UserDashboard from './components/UserDashboard';
import PageTitle from './components/PageTitle';
import ProgramSummary from './components/ProgramSummary';
import {
    Home as HomeIcon,
    Description as DescriptionIcon,
    Person as PersonIcon,
    EvStation as EvStationIcon,
    Assessment as AssessmentIcon,
    ExpandLess,
    ExpandMore,
    Timeline as TimelineIcon,
    TableChart as TableChartIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const Home = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [homeMenuOpen, setHomeMenuOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/project-tracker') {
      setSelectedTab(1);
    } else if (location.pathname === '/project-summary') {
      setSelectedTab(2);
    } else if (location.pathname === '/user-overview') {
      setSelectedTab(3);
    } else if (location.pathname === '/ev-calculator') {
      setSelectedTab(4);
    } else if (location.pathname === '/program-summary') {
      setSelectedTab(5);
    } else {
      setSelectedTab(0);
    }
  }, [location.pathname]);

  const handleHomeClick = () => {
    setHomeMenuOpen(!homeMenuOpen);
  };

  const getPageTitle = () => {
    switch (selectedTab) {
      case 0:
        return 'Project Status';
      case 1:
        return 'Project Tracker';
      case 2:
        return 'Project Summary';
      case 3:
        return 'User Overview';
      case 4:
        return 'EV Fuel Calculator';
      case 5:
        return 'Program Summary';
      default:
        return 'Project Status';
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: '#2c323f',
            color: 'white'
          },
        }}
      >
        <List component="nav" sx={{ pt: 2 }}>
          {/* Home with sub-menu */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleHomeClick}>
              <ListItemIcon>
                <HomeIcon sx={{ color: 'white' }} />
              </ListItemIcon>
              <ListItemText primary="Home" />
              {homeMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={homeMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton 
                sx={{ pl: 4 }}
                selected={selectedTab === 0}
                onClick={() => navigate('/')}
              >
                <ListItemIcon>
                  <TimelineIcon sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText primary="Project Status" />
              </ListItemButton>
              <ListItemButton 
                sx={{ pl: 4 }}
                selected={selectedTab === 1}
                onClick={() => navigate('/project-tracker')}
              >
                <ListItemIcon>
                  <TableChartIcon sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText primary="Project Tracker" />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Other main menu items */}
          <ListItemButton 
            selected={selectedTab === 2}
            onClick={() => navigate('/project-summary')}
          >
            <ListItemIcon>
              <DescriptionIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Project Summary" />
          </ListItemButton>

          <ListItemButton 
            selected={selectedTab === 3}
            onClick={() => navigate('/user-overview')}
          >
            <ListItemIcon>
              <PersonIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="User Overview" />
          </ListItemButton>

          <ListItemButton 
            selected={selectedTab === 4}
            onClick={() => navigate('/ev-calculator')}
          >
            <ListItemIcon>
              <EvStationIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="EV Fuel Calculator" />
          </ListItemButton>

          <ListItemButton 
            selected={selectedTab === 5}
            onClick={() => navigate('/program-summary')}
          >
            <ListItemIcon>
              <AssessmentIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Program Summary" />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <PageTitle title={getPageTitle()} />
        <Box sx={{ p: 0, marginLeft: 0, marginRight: 0, width: '100%' }}>
          {selectedTab === 0 && <MainGrid />}
          {selectedTab === 1 && <ProjectTracker />}
          {selectedTab === 2 && <ProjectSummary />}
          {selectedTab === 3 && <UserStats />}
          {selectedTab === 4 && <EvPage />}
          {selectedTab === 5 && <ProgramSummary />}
        </Box>
      </Box>
    </Box>
  );
};

const App = () => (
  <ApolloProvider client={client}>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project-tracker" element={<Home />} />
        <Route path="/project-summary" element={<Home />} />
        <Route path="/user-overview" element={<Home />} />
        <Route path="/ev-calculator" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  </ApolloProvider>
);

export default App;