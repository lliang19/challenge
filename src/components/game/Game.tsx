import React, { ChangeEvent, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Grid, Slider, Typography } from '@material-ui/core';
import { tic } from '../../redux/actions';
import GameBoard from './Board';
import { GameMode } from '../../lib/Map';
import Controls from './Controls';

interface GameProps {
  dispatch: Function;
  layout?: GameBoardPiece[][];
  score?: number,
  mode?: GameMode,
  runningScore?: number,
  iteration?: number,
};

const useStyles = makeStyles((theme: Theme) => ({
  base: {
    marginBottom: theme.spacing(2),
  },
}));

const Game: React.FC<GameProps> = ({ dispatch, layout, score, mode,  runningScore, iteration }): JSX.Element => {
  
  const styles = useStyles({});
  const [stepInterval, setStepInterval] = useState<number>(250);

  useEffect(() => {
    setInterval(() => {dispatch(tic());}, stepInterval);
  }, [dispatch, stepInterval]);

  // Handle the ChangeEvent when the Slider component is being interacted with, update the step
  // interval to speed up / slow down the rate of the tic() redux action calls.
  const handleStepChange = (evt: ChangeEvent<{}>, newValue: number | number[]) => {
    setStepInterval(newValue as number);
  };
  
  return (
    <Grid container alignContent="center" justify="center" className={styles.base} spacing={3}>
      <Grid item>
        <GameBoard boardState={layout} />
      </Grid>
      <Grid item>
        <Controls score={score} runningScore={runningScore} iteration={iteration} mode={mode} />
        <Typography variant="body1">
          Step Interval:
          {' '}
          {stepInterval}
          ms
        </Typography>
        <Slider value={stepInterval} step={1} onChange={handleStepChange} max={1000} min={1} />
      </Grid>
    </Grid>
  );
};

const mapStateToProps = (state: ReduxState): object => {
 
  const { layout, PacmanStore, runningScore, iteration, mode } = state.game;

  const score = typeof PacmanStore !== 'undefined' ? PacmanStore.score : 0;

  return { layout, score, runningScore, iteration, mode };
};

export default connect(mapStateToProps)(Game);