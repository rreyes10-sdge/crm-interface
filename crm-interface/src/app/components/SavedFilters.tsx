import { Box, Button, Typography } from '@mui/material';

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
    <Box>
      <Typography component="h2" variant="h6" sx={{ mt: 4 }}>
        Saved Filters
      </Typography>
      {savedFilters.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No filters have been saved.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
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
      )}
    </Box>
  );
};

export default SavedFilters;