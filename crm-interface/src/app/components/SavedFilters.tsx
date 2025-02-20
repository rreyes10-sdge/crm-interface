import { Box, Button } from '@mui/material';
import ExpandableCard from './ExpandableCard';

interface SavedFilter {
  CreatedAt: string;
  Name: string;
  SavedFilterId: number;
  Url: string;
  UserId: string;
}

interface SavedFiltersProps {
  savedFilters: SavedFilter[];
}

const SavedFilters: React.FC<SavedFiltersProps> = ({ savedFilters }) => {
  const rootUrl = 'https://ctsolutions.sempra.com/projects?';

  return (
    <ExpandableCard 
      title="Saved Filters" 
      count={savedFilters.length}
      emptyMessage="No filters have been saved."
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {savedFilters.map((filter) => (
          <Button
            key={filter.SavedFilterId}
            variant="contained"
            sx={{
              borderRadius: '50px',
              textTransform: 'none',
              padding: '8px 16px',
            }}
            onClick={() => window.open(`${rootUrl}${filter.Url}`, '_blank')}
          >
            {filter.Name}
          </Button>
        ))}
      </Box>
    </ExpandableCard>
  );
};

export default SavedFilters;