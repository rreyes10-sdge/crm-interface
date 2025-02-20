'use client';

import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
  selectedUser?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, selectedUser }) => {
  useEffect(() => {
    document.title = selectedUser 
      ? `${title} - ${selectedUser}` 
      : `${title}`;
  }, [title, selectedUser]);

  return null;
};

export default PageTitle; 