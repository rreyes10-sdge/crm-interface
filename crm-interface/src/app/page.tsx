'use client';

import React, { useState, useEffect } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import client from '../apollo-client';
import MainGrid from "./components/MainGrid";
import ProjectTracker from "./components/ProjectTracker";
import ProjectSummary from './components/ProjectSummary';
import UserStats from './components/UserStats';
import EvPage from './components/EvPage';
import CrmProto from './components/CrmProto';
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
    Inbox as InboxIcon,
    Work as WorkIcon
} from '@mui/icons-material';
import BasicListMenu from './components/BasicListMenu';
import PopupState from 'material-ui-popup-state';
import { bindTrigger, bindMenu } from 'material-ui-popup-state/hooks';

const DRAWER_WIDTH = 60;

const SELECTED_BG_COLOR = '#f3f3f3';
const SELECTED_ICON_COLOR = '#088856';
const HOVER_BG_COLOR = '#58B947';
const BG_COLOR = '#001689'
const ICON_COLOR = '#009BDA'
const TEXT_COLOR = '#FFFFFF'

const Home = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
    } else if (location.pathname === '/crm-proto') {
      setSelectedTab(9);
      setShowSubMenu(false);
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
      case 9:
        return 'CTS Core Prototype';
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

  const Navbar = () => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: BG_COLOR, padding: 1 }}>
        <img src="/images/logo.png" alt="Logo" style={{ height: '40px', margin: '10px 0px 10px 40px' }} />
        <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}>
          <List sx={{ display: 'flex', flexDirection: 'row', margin: 0 }}>
            <PopupState variant="popover" popupId="home-menu">
              {(popupState) => (
                <React.Fragment>
                  <ListItemButton {...bindTrigger(popupState)} selected={selectedTab === 0 || selectedTab === 1}>
                    <ListItemIcon sx={{ color: TEXT_COLOR, minWidth: '30px' }}>
                      <HomeIcon />
                    </ListItemIcon>
                    <span style={{ color: TEXT_COLOR }}>Home</span>
                  </ListItemButton>
                  <Menu {...bindMenu(popupState)}>
                    {homeSubMenuItems.map((item) => (
                      <MenuItem key={item.text} onClick={() => { navigate(item.href); popupState.close(); }}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        {item.text}
                      </MenuItem>
                    ))}
                  </Menu>
                </React.Fragment>
              )}
            </PopupState>
            <ListItemButton selected={selectedTab === 9} onClick={() => navigate('/crm-proto')}>
              <ListItemIcon sx={{ color: TEXT_COLOR, minWidth: '30px' }}>
                <WorkIcon />
              </ListItemIcon>
              <span style={{ color: TEXT_COLOR }}>CTS Core Prototype</span>
            </ListItemButton>
            <ListItemButton selected={selectedTab === 2} onClick={() => navigate('/project-summary')}>
              <ListItemIcon sx={{ color: TEXT_COLOR, minWidth: '30px' }}>
                <DescriptionIcon />
              </ListItemIcon>
              <span style={{ color: TEXT_COLOR }}>Project Summary</span>
            </ListItemButton>
            <ListItemButton selected={selectedTab === 3} onClick={() => navigate('/user-overview')}>
              <ListItemIcon sx={{ color: TEXT_COLOR, minWidth: '30px' }}>
                <PersonIcon />
              </ListItemIcon>
              <span style={{ color: TEXT_COLOR }}>User Overview</span>
            </ListItemButton>
            <ListItemButton selected={selectedTab === 4} onClick={() => navigate('/ev-calculator')}>
              <ListItemIcon sx={{ color: TEXT_COLOR, minWidth: '30px' }}>
                <EvStationIcon />
              </ListItemIcon>
              <span style={{ color: TEXT_COLOR }}>EV Calculator</span>
            </ListItemButton>
            <ListItemButton selected={selectedTab === 5} onClick={() => navigate('/program-summary')}>
              <ListItemIcon sx={{ color: TEXT_COLOR, minWidth: '30px' }}>
                <AssessmentIcon />
              </ListItemIcon>
              <span style={{ color: TEXT_COLOR }}>Program Summary</span>
            </ListItemButton>
            <ListItemButton onClick={handleTasksClick} selected={selectedTab >= 6 && selectedTab <= 8}>
              <ListItemIcon sx={{ color: TEXT_COLOR, minWidth: '30px' }}>
                <InboxIcon />
              </ListItemIcon>
              <span style={{ color: TEXT_COLOR }}>Tasks</span>
            </ListItemButton>
          </List>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
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
          {selectedTab === 9 && <CrmProto />}
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
        <Route path="/crm-proto" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  </ApolloProvider>
);

export default App;