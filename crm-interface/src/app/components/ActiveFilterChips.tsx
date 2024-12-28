import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { Box, Chip as MuiChip, Tooltip } from '@mui/material';

interface ActiveFilterChipProps<T> {
  name: string;
  options: T[];
  setSelectedOptions: (options: T[]) => void;
  getOptionKey: (option: T) => React.Key;
  getOptionLabel: (option: T) => string;
  getTooltip?: (option: T) => string;
}

const Chip = styled(MuiChip)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#bdc8f020' : 'white',
  borderRadius: 0,
}));

const OptionChip = styled(Chip)(({ theme }) => ({
  borderRight: '1px solid',
  borderColor: theme.palette.background.paper,
  '&:last-child': {
    borderTopRightRadius: theme.spacing(0.5),
    borderBottomRightRadius: theme.spacing(0.5),
    borderRight: 0,
  },
}));

export const ActiveFilterChip = <T,>({
  name,
  options,
  getOptionKey,
  getOptionLabel,
  setSelectedOptions,
  getTooltip,
}: ActiveFilterChipProps<T>) => {
  const theme = useTheme();
  const condition = options.length === 1 ? 'is' : 'is any of';

  const onDelete = (option: T) => {
    const val = options.filter((p) => getOptionKey(p) !== getOptionKey(option));
    setSelectedOptions(val);
  };

  if (!options.length) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        listStyle: 'none',
        p: 0.5,
        m: 0,
      }}
      component="ul"
    >
      <Chip
        size="small"
        label={name}
        sx={{
          borderTopLeftRadius: theme.spacing(0.5),
          borderBottomLeftRadius: theme.spacing(0.5),
        }}
      />
      <Chip
        size="small"
        label={condition}
        sx={{
          borderRadius: 0,
          borderRight: 1,
          borderLeft: 1,
          borderColor: theme.palette.background.paper,
          color: theme.palette.text.secondary,
        }}
      />
      {options.map((o) => (
        <Tooltip
          key={getOptionKey(o)}
          title={getTooltip ? getTooltip(o) : ''}
          arrow
        >
          <OptionChip
            key={getOptionKey(o)}
            size="small"
            label={getOptionLabel(o)}
            onDelete={() => onDelete(o)}
          />
        </Tooltip>
      ))}
    </Box>
  );
};
