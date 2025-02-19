import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel } from '@mui/material';

interface User {
  UserId: string;
  ProperName: string;
  RoleName: string;
  LastLoginAt: string;
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
type SortableKey = keyof Omit<User, 'LastLoginAt'>;

const UserStatsOverview: React.FC<UserStatsOverviewProps> = ({ users }) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<SortableKey>('ProperName');

  const handleRequestSort = (property: SortableKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (orderBy === 'ProperName' || orderBy === 'RoleName') {
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      return order === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (bValue > aValue ? 1 : -1);
    }
  });

  const handleRowClick = (userId: string) => {
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/user-dashboard/${userId}`, '_blank');
  };

  return (
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
            <TableCell>
              <TableSortLabel
                active={orderBy === 'RoleName'}
                direction={orderBy === 'RoleName' ? order : 'asc'}
                onClick={() => handleRequestSort('RoleName')}
              >
                Role
              </TableSortLabel>
            </TableCell>
            <TableCell>Last Login</TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'activity_count'}
                direction={orderBy === 'activity_count' ? order : 'asc'}
                onClick={() => handleRequestSort('activity_count')}
              >
                Activities
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'uploaded_files_count'}
                direction={orderBy === 'uploaded_files_count' ? order : 'asc'}
                onClick={() => handleRequestSort('uploaded_files_count')}
              >
                Uploads
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'attributes_filled_count'}
                direction={orderBy === 'attributes_filled_count' ? order : 'asc'}
                onClick={() => handleRequestSort('attributes_filled_count')}
              >
                Attributes
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'project_table_values_count'}
                direction={orderBy === 'project_table_values_count' ? order : 'asc'}
                onClick={() => handleRequestSort('project_table_values_count')}
              >
                Table Values
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'user_mention_count'}
                direction={orderBy === 'user_mention_count' ? order : 'asc'}
                onClick={() => handleRequestSort('user_mention_count')}
              >
                Mentions
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow 
              key={user.UserId}
              onClick={() => handleRowClick(user.UserId)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              <TableCell>{user.ProperName}</TableCell>
              <TableCell>{user.RoleName || 'N/A'}</TableCell>
              <TableCell>
                {user.LastLoginAt !== 'Never logged in' 
                  ? new Date(user.LastLoginAt).toLocaleDateString()
                  : 'Never'}
              </TableCell>
              <TableCell>{user.activity_count}</TableCell>
              <TableCell>{user.uploaded_files_count}</TableCell>
              <TableCell>{user.attributes_filled_count}</TableCell>
              <TableCell>{user.project_table_values_count}</TableCell>
              <TableCell>{user.user_mention_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserStatsOverview;