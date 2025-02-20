'use client';

import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import client from '../apollo-client';
import styles from "./page.module.css";
import MainGrid from "./components/MainGrid";
import ProjectTracker from "./components/ProjectTracker";
import Timeline from "./components/TimelineOld"
import Head from 'next/head';
import UserStats from './components/UserStats';
import EvCalculator from './components/EvCalculator';
import ProjectSummary from './components/ProjectSummary';
import UserDashboard from './components/UserDashboard';
import PageTitle from './components/PageTitle';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (location.pathname === '/project-tracker') {
      setSelectedTab(1);
    } else if (location.pathname === '/project-summary') {
      setSelectedTab(2);
    } else if (location.pathname === '/user-overview') {
      setSelectedTab(3);
    } else if (location.pathname === '/ev-calculator') {
      setSelectedTab(4);
    } else {
      setSelectedTab(0);
    }
  }, [location.pathname]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    if (newValue === 1) {
      navigate('/project-tracker');
    } else if (newValue === 2) {
      navigate('/project-summary');
    } else if (newValue === 3) {
      navigate('/user-overview');
    } else if (newValue === 4) {
      navigate('/ev-calculator');
    } else {
      navigate('/');
    }
  };

  const handleRowClick = (userId: string) => {
    window.open(`/user-dashboard/${userId}`, '_blank');
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
      default:
        return 'Project Status';
    }
  };

  return (
    <>
      <PageTitle title={getPageTitle()} />
      <div className={styles.page}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleChange} aria-label="navigation tabs">
            <Tab label="Project Status" />
            <Tab label="Project Tracker" />
            <Tab label="Project Summary" />
            <Tab label="User Overview" />
            <Tab label="EV Fuel Calculator" />
          </Tabs>
        </Box>
        <Box sx={{ p: 0, marginLeft: 0, marginRight: 0 }}>
          {selectedTab === 0 && <MainGrid />}
          {selectedTab === 1 && <ProjectTracker />}
          {selectedTab === 2 && <ProjectSummary />}
          {selectedTab === 3 && <UserStats />}
          {selectedTab === 4 && <EvCalculator />}
        </Box>
      </div>
    </>
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