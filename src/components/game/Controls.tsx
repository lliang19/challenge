import React from 'react';
import Button from '@material-ui/core/Button';
import { Typography } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import store from '../../redux/store';
import { initGame, resetScore } from '../../redux/actions';
import { GameMode } from '../../lib/Map';

interface ControlProps {
  score?: number;
  iteration?: number;
  runningScore?: number;
  mode?: number;
}

const useStyles = makeStyles((theme: Theme) => ({
  score: {
    color: '#dd0',
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  button: {
    marginBottom: theme.spacing(1)
  }
}));

const Controls: React.FC<ControlProps> = ({score, iteration, runningScore, mode}): JSX.Element => {
  
  const styles = useStyles({});

  /**
   * Get the string representation of the game mode to display in the UI
   */
  const getGameMode = (): string => {
    switch (mode) {
      case GameMode.WAITING:
        return 'Waiting...';
      case GameMode.PLAYING:
        return 'Playing';
      case GameMode.FINISHED:
        return 'Finished!';
      default:
        return 'Unknown';
    }
  };

  const handleNewGame = (): void => {
    store.dispatch(initGame());
  };

  /**
   * Fire an initGame() redux action with 100 iterations
   */
  const handleHundredGames = (): void => {
    store.dispatch(initGame(100));
  };

  const handleResetScore = (): void => {
    store.dispatch(resetScore());
  };

  return (
    <>
      <div className={styles.score}>
        <Typography variant="body1">
          <b>Score:</b> 
          {' '}
          {score || 0}
        </Typography>
        <Typography variant="body1">
          <b>Total Score:</b> 
          {' '}
          {runningScore || 0}
        </Typography>
        <Typography variant="body1">
          <b>Iteration:</b> 
          {' '}
          {iteration || 1 }
        </Typography>
        <Typography variant="body1">
          <b>Game Mode:</b> 
          {' '}
          {getGameMode()}
        </Typography>
      </div>

      <Button onClick={handleNewGame} className={styles.button} fullWidth color="primary" variant="contained">New Game</Button>
      <Button onClick={handleHundredGames} className={styles.button} fullWidth color="secondary" variant="contained">Run 100 Games</Button>
      <Button onClick={handleResetScore} className={styles.button} fullWidth variant="contained">Reset Score</Button>
    </>
  );
};

export default Controls;