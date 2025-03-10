'use client';

import React, { useState, useEffect } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import client from '../apollo-client';
import MainGrid from "./components/MainGrid";
import ProjectTracker from "./components/ProjectTracker";
import ProjectSummary from './components/ProjectSummary';
import UserStats from './components/UserStats';
import EvPage from './components/EvPage';
import ProgramSummary from './components/ProgramSummary';
import PageTitle from './components/PageTitle';
import {
    Home as HomeIcon,
    Description as DescriptionIcon,
    Person as PersonIcon,
    EvStation as EvStationIcon,
    Assessment as AssessmentIcon,
    Timeline as TimelineIcon,
    TableChart as TableChartIcon,
    Today as TodayIcon,
    DateRange as DateRangeIcon,
    Inbox as InboxIcon
} from '@mui/icons-material';
import BasicListMenu from './components/BasicListMenu';

const DRAWER_WIDTH = 60;

const SELECTED_BG_COLOR = '#f3f3f3';
const SELECTED_ICON_COLOR = '#088856';
const HOVER_BG_COLOR = '#58B947';
const BG_COLOR = '#f3f3f3'
const ICON_COLOR = '#009BDA'

const Home = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/project-tracker') {
      setSelectedTab(1);
      setShowSubMenu(true);
    } else if (location.pathname === '/project-summary') {
      setSelectedTab(2);
      setShowSubMenu(false);
    } else if (location.pathname === '/user-overview') {
      setSelectedTab(3);
      setShowSubMenu(false);
    } else if (location.pathname === '/ev-calculator') {
      setSelectedTab(4);
      setShowSubMenu(false);
    } else if (location.pathname === '/program-summary') {
      setSelectedTab(5);
      setShowSubMenu(false);
    } else if (location.pathname === '/tasks-today') {
      setSelectedTab(6);
      setShowSubMenu(true);
    } else if (location.pathname === '/tasks-next-7-days') {
      setSelectedTab(7);
      setShowSubMenu(true);
    } else if (location.pathname === '/tasks-inbox') {
      setSelectedTab(8);
      setShowSubMenu(true);
    } else {
      setSelectedTab(0);
      setShowSubMenu(true);
    }
  }, [location.pathname]);

  const handleHomeClick = () => {
    setShowSubMenu(true);
    setSelectedTab(0);
  };

  const handleTasksClick = () => {
    setShowSubMenu(true);
    setSelectedTab(6);
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
      case 6:
        return 'Tasks - Today';
      case 7:
        return 'Tasks - Next 7 Days';
      case 8:
        return 'Tasks - Inbox';
      default:
        return 'Project Status';
    }
  };

  const homeSubMenuItems = [
    { text: 'Project Status', icon: <TimelineIcon />, href: '/' },
    { text: 'Project Tracker', icon: <TableChartIcon />, href: '/project-tracker' },
  ];

  const tasksSubMenuItems = [
    { text: 'Today', icon: <TodayIcon />, href: '/tasks-today' },
    { text: 'Next 7 Days', icon: <DateRangeIcon />, href: '/tasks-next-7-days' },
    { text: 'Inbox', icon: <InboxIcon />, href: '/tasks-inbox' },
  ];

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
            backgroundColor: BG_COLOR,
            color: ICON_COLOR,
            // display: 'flex',
            // alignItems: 'center', // Center align icons vertically
            paddingTop: 6, // Increase padding between icons
            paddingBottom: 6, // Increase padding between icons
            // paddingLeft: 4,
          },
        }}
      >
        <List component="nav" sx={{ pt: 2 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleHomeClick} selected={selectedTab === 0 || selectedTab === 1}
            sx={{
              '&.Mui-selected': {
                backgroundColor: SELECTED_BG_COLOR,
                '&:hover': {
                  backgroundColor: HOVER_BG_COLOR,
                },
              },
            }}
            >
              <ListItemIcon sx={{ minWidth: 'auto', color: selectedTab === 0 || selectedTab === 1 ? SELECTED_ICON_COLOR : ICON_COLOR }}>
                <HomeIcon />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>

          <ListItemButton 
            selected={selectedTab === 2}
            onClick={() => {
              navigate('/project-summary');
              setShowSubMenu(false);
            }}
            sx={{
              '&.Mui-selected': {
                backgroundColor: SELECTED_BG_COLOR,
                '&:hover': {
                  backgroundColor: HOVER_BG_COLOR,
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', color: selectedTab === 2 ? SELECTED_ICON_COLOR : ICON_COLOR }}>
              <DescriptionIcon />
            </ListItemIcon>
          </ListItemButton>

          <ListItemButton 
            selected={selectedTab === 3}
            onClick={() => {
              navigate('/user-overview');
              setShowSubMenu(false);
            }}
            sx={{
              '&.Mui-selected': {
                backgroundColor: SELECTED_BG_COLOR,
                '&:hover': {
                  backgroundColor: HOVER_BG_COLOR,
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', color: selectedTab === 3 ? SELECTED_ICON_COLOR : ICON_COLOR }}>
              <PersonIcon />
            </ListItemIcon>
          </ListItemButton>

          <ListItemButton 
            selected={selectedTab === 4}
            onClick={() => {
              navigate('/ev-calculator');
              setShowSubMenu(false);
            }}
            sx={{
              '&.Mui-selected': {
                backgroundColor: SELECTED_BG_COLOR,
                '&:hover': {
                  backgroundColor: HOVER_BG_COLOR,
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', color: selectedTab === 4 ? SELECTED_ICON_COLOR : ICON_COLOR }}>
              <EvStationIcon />
            </ListItemIcon>
          </ListItemButton>

          <ListItemButton 
            selected={selectedTab === 5}
            onClick={() => {
              navigate('/program-summary');
              setShowSubMenu(false);
            }}
            sx={{
              '&.Mui-selected': {
                backgroundColor: SELECTED_BG_COLOR,
                '&:hover': {
                  backgroundColor: HOVER_BG_COLOR,
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', color: selectedTab === 5 ? SELECTED_ICON_COLOR : ICON_COLOR }}>
              <AssessmentIcon />
            </ListItemIcon>
          </ListItemButton>

          <ListItem disablePadding>
            <ListItemButton onClick={handleTasksClick} selected={selectedTab >= 6 && selectedTab <= 8}
            sx={{
              '&.Mui-selected': {
                backgroundColor: SELECTED_BG_COLOR,
                '&:hover': {
                  backgroundColor: HOVER_BG_COLOR,
                },
              },
            }}>
              <ListItemIcon sx={{ minWidth: 'auto', color: selectedTab >= 6 && selectedTab <= 8 ? SELECTED_ICON_COLOR : ICON_COLOR }}>
                <InboxIcon />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {showSubMenu && selectedTab <= 1 && (
        <BasicListMenu items={homeSubMenuItems} activeItem={location.pathname} />
      )}

      {showSubMenu && selectedTab >= 6 && selectedTab <= 8 && (
        <BasicListMenu items={tasksSubMenuItems} activeItem={location.pathname} />
      )}

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
          {selectedTab === 6 && <div>Tasks - Today</div>}
          {selectedTab === 7 && <div>Tasks - Next 7 Days</div>}
          {selectedTab === 8 && <div>Tasks - Inbox</div>}
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
        <Route path="/program-summary" element={<Home />} />
        <Route path="/tasks-today" element={<Home />} />
        <Route path="/tasks-next-7-days" element={<Home />} />
        <Route path="/tasks-inbox" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  </ApolloProvider>
);

export default App;