import { Box, Button } from '@mui/material';
import ExpandableCard from './ExpandableCard';

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
      <ExpandableCard 
        title="Favorite Projects" 
        count={favoriteProjects.length}
        emptyMessage="No projects have been favorited."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
      </ExpandableCard>
    );
};

export default FavoriteProjects;