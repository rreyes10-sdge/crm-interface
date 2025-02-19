import React, { useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Accordion, AccordionSummary, AccordionDetails, TableSortLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface User {
  UserId: string;
  ProperName: string;
  activity_count: number;
  uploaded_files_count: number;
  attributes_filled_count: number;
  project_table_values_count: number;
  user_mention_count: number;
}

interface UserStatsOverviewProps {
  users: User[];
}

type Order = 'asc' | 'desc';

const UserStatsOverview: React.FC<UserStatsOverviewProps> = ({ users }) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof User>('ProperName');

  const handleRequestSort = (property: keyof User) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (orderBy === 'ProperName') {
      return order === 'asc' ? a.ProperName.localeCompare(b.ProperName) : b.ProperName.localeCompare(a.ProperName);
    } else {
      return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
    }
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography component="h2">
            Global Overview
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'ProperName'}
                      direction={orderBy === 'ProperName' ? order : 'asc'}
                      onClick={() => handleRequestSort('ProperName')}
                    >
                      User
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'activity_count'}
                      direction={orderBy === 'activity_count' ? order : 'asc'}
                      onClick={() => handleRequestSort('activity_count')}
                    >
                      Activity Count
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'uploaded_files_count'}
                      direction={orderBy === 'uploaded_files_count' ? order : 'asc'}
                      onClick={() => handleRequestSort('uploaded_files_count')}
                    >
                      Uploaded Files
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'attributes_filled_count'}
                      direction={orderBy === 'attributes_filled_count' ? order : 'asc'}
                      onClick={() => handleRequestSort('attributes_filled_count')}
                    >
                      Attributes Filled
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'project_table_values_count'}
                      direction={orderBy === 'project_table_values_count' ? order : 'asc'}
                      onClick={() => handleRequestSort('project_table_values_count')}
                    >
                      Project Table Values
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'user_mention_count'}
                      direction={orderBy === 'user_mention_count' ? order : 'asc'}
                      onClick={() => handleRequestSort('user_mention_count')}
                    >
                      User Mentions
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.UserId}>
                    <TableCell component="th" scope="row">
                      {user.ProperName}
                    </TableCell>
                    <TableCell align="right">{user.activity_count}</TableCell>
                    <TableCell align="right">{user.uploaded_files_count}</TableCell>
                    <TableCell align="right">{user.attributes_filled_count}</TableCell>
                    <TableCell align="right">{user.project_table_values_count}</TableCell>
                    <TableCell align="right">{user.user_mention_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default UserStatsOverview;