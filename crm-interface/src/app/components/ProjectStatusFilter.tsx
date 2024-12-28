import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { ProjectRow } from '../types';

interface ProjectStatusFilterProps {
  rows: ProjectRow[];
  statusFilter: string;
  onStatusChange: (event: SelectChangeEvent<string>) => void;
}

const ProjectStatusFilter = ({ rows, statusFilter, onStatusChange }: ProjectStatusFilterProps) => {
  // Extract unique statuses for the dropdown
  const statuses = Array.from(new Set(rows.map((row) => row.ProjectStatus))).sort();

  return (
    <FormControl sx={{ mb: 2, width: 200 }}>
      <InputLabel>Project Status</InputLabel>
      <Select value={statusFilter} onChange={onStatusChange} label="Project Status">
        <MenuItem value="All">All</MenuItem>
        {statuses.map((status) => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ProjectStatusFilter; 