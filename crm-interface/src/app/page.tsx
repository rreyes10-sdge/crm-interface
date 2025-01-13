'use client';

import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import client from '../apollo-client';
import styles from "./page.module.css";
import MainGrid from "./components/MainGrid";
import ProjectTracker from "./components/ProjectTracker";
import Timeline from "./components/Timeline"
import Head from 'next/head';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (location.pathname === '/project-tracker') {
      setSelectedTab(1);
    } else if (location.pathname === '/project-timeline') {
      setSelectedTab(2);
    } else {
      setSelectedTab(0);
    }
  }, [location.pathname]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    if (newValue === 1) {
      navigate('/project-tracker');
    } else if (newValue === 2) {
      navigate('/project-timeline');
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <Head>
        <title>My Awesome Project</title>
        <meta name="description" content="This is an awesome project built with Next.js" />
      </Head>

      <div className={styles.page}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleChange} aria-label="navigation tabs">
            <Tab label="Project Status" />
            <Tab label="Project Tracker" />
            <Tab label="Project Timeline" />
          </Tabs>
        </Box>
        <Box sx={{ p: 0, marginLeft: 0, marginRight: 0 }}>
          {selectedTab === 0 && <MainGrid />}
          {selectedTab === 1 && <ProjectTracker />}
          {selectedTab === 2 && <Timeline projectId={'30'} />}
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
        <Route path="/project-timeline" element={<Home />} />
        <Route path="*" element={<Home />} /> {/* Catch-all route */}
      </Routes>
    </Router>
  </ApolloProvider>
);

export default App;