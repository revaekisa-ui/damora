import { LinearProgress } from '@mui/material';
import { useNavigation } from 'react-router';

export default function LoadingBar() {
  const navigation = useNavigation();

  return navigation.state === 'idle' ? null : (
    <LinearProgress
      aria-label="Loading"
      sx={{ left: 0, position: 'fixed', right: 0, top: 0, zIndex: 1600 }}
    />
  );
}
