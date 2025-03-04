import React from 'react';
import { Box, List, ListItemButton, ListItemText, ListItemIcon, Typography } from '@mui/material';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  href: string;
  count?: number; // Optional count property
}

interface BasicListMenuProps {
  items: MenuItem[];
  activeItem: string; // Active item href
}

const SELECTED_BG_COLOR = '#eff9fc';
const HOVER_BG_COLOR = '#e0e0e0';

const BasicListMenu: React.FC<BasicListMenuProps> = ({ items, activeItem }) => {
  return (
    <Box sx={{ width: '18%', minWidth: '280px', maxWidth: '330px', height: '100vh', borderRight: '1px solid #ddd' }}>
      <List component="nav" aria-label="main mailbox folders">
        {items.map((item, index) => (
          <ListItemButton
            key={index}
            component="a"
            href={item.href}
            selected={item.href === activeItem}
            sx={{
              '&.Mui-selected': {
                backgroundColor: SELECTED_BG_COLOR,
                '&:hover': {
                  backgroundColor: HOVER_BG_COLOR,
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
            {item.count !== undefined && (
              <Typography variant="body2" sx={{ marginLeft: 'auto', color: 'gray' }}>
                {item.count}
              </Typography>
            )}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default BasicListMenu;