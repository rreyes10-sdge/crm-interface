import { Box, Button, Typography } from '@mui/material';

interface FavoriteProject {
    ProjectId: number;
    UserId: string;
    ProjectNumber: string;
    OrgName: string;
}

interface FavoriteProjectsProps {
    favoriteProjects: FavoriteProject[];
}

const FavoriteProjects: React.FC<FavoriteProjectsProps> = ({ favoriteProjects }) => {
    const rootUrl = 'https://ctsolutions.sempra.com/projects/';
  
    return (
      <Box>
        <Typography component="h2" variant="h6" sx={{ mt: 4 }}>
          Favorite Projects
        </Typography>
        {favoriteProjects.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No projects have been favorited.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {favoriteProjects.map((project) => (
              <Button
                key={project.ProjectId}
                variant="contained"
                sx={{
                  borderRadius: '50px',
                  textTransform: 'none',
                  padding: '8px 16px',
                }}
                onClick={() => window.open(`${rootUrl}${project.ProjectId}`, '_blank')}
              >
                {project.ProjectNumber} - {project.OrgName}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    );
  };
  
  export default FavoriteProjects;