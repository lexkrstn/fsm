/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Event, EventType, FSM } from './fsm';

// A helper function.
function timeout(ms: number = 10) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Declare states and events.
type PlayerStates = 'staying' | 'running' | 'dead';
type PlayerEvents = Event<'stop'> | Event<'run', [number, number]> | Event<'die'>;

// Define player strategies
interface PlayerStrategy {
  onUpdate(dt: number): void;
}

class RunStrategy implements PlayerStrategy {
  public onUpdate(dt: number) {
    console.log('running');
  }
}

class StayStrategy implements PlayerStrategy {
  public onUpdate(dt: number) {
    console.log('staying');
  }
}

class DeadStrategy implements PlayerStrategy {
  public onUpdate(dt: number) {
    console.log('dead');
  }
}

function playerStrategyFactory(state: PlayerStates): PlayerStrategy {
  switch (state) {
    case 'staying': return new StayStrategy();
    case 'running': return new RunStrategy();
    case 'dead': return new DeadStrategy();
    default:
      throw new Error(`Unknown state: ${state}`);
  }
}

class Player implements PlayerStrategy {
  private fsm: FSM<PlayerStates, PlayerEvents>;

  private strategy: PlayerStrategy = new StayStrategy();

  public constructor(initialState: PlayerStates = 'staying') {
    this.strategy = playerStrategyFactory(initialState);
    this.fsm = new FSM<PlayerStates, PlayerEvents>(
      initialState,
      [
        ['running', 'stop', 'staying', this.transitionToStaying],
        ['staying', 'run', 'running', this.transitionToRunning],
        ['*', 'die', 'dead', this.transitionToDead],
      ],
    );
  }

  public stop() { return this.fsm.dispatch('stop'); }

  public die() { return this.fsm.dispatch('die'); }

  public run(x: number, y: number) { return this.fsm.dispatch('run', x, y); }

  public isRunning() { return this.fsm.getState() === 'running'; }

  public isStaying() { return this.fsm.getState() === 'staying'; }

  public isDead() { return this.fsm.getState() === 'dead'; }

  public isControllable() { return !this.fsm.isFinal(); }

  public can(action: EventType<PlayerEvents>) { return this.fsm.can(action); }

  public onUpdate(dt: number) {
    this.strategy.onUpdate(dt);
  }

  private transitionToStaying = async () => {
    this.strategy = new StayStrategy();
    await timeout(); // Emulate some async work
  };

  private transitionToRunning = async (x: number, y: number) => {
    this.strategy = new RunStrategy();
    await timeout(); // Emulate some async work
  };

  private transitionToDead = () => {
    this.strategy = new DeadStrategy();
  };
}

describe('FSM', () => {
  describe('constructor()', () => {
    it('should initialize a player', async () => {
      const player = new Player();

      expect(player.isStaying()).toBeTruthy();
      expect(player.isRunning()).toBeFalsy();
      expect(player.isDead()).toBeFalsy();
    });
  });

  describe('getState()', () => {
    it('should return corrent results for staying state', async () => {
      const player = new Player();

      expect(player.isStaying()).toBeTruthy();
    });

    it('should return corrent results for running state', async () => {
      const player = new Player('running');

      expect(player.isRunning()).toBeTruthy();
    });
  });

  describe('can()', () => {
    it('should return corrent results for staying state', async () => {
      const player = new Player();

      expect(player.can('run')).toBeTruthy();
      expect(player.can('die')).toBeTruthy();
      expect(player.can('stop')).toBeFalsy();
    });

    it('should return corrent results for running state', async () => {
      const player = new Player('running');

      expect(player.can('run')).toBeFalsy();
      expect(player.can('die')).toBeTruthy();
      expect(player.can('stop')).toBeTruthy();
    });

    it('should return corrent results for dead state', async () => {
      const player = new Player('dead');

      expect(player.can('run')).toBeFalsy();
      expect(player.can('die')).toBeFalsy();
      expect(player.can('stop')).toBeFalsy();
    });
  });

  describe('isFinal()', () => {
    it('should return corrent results for staying state', async () => {
      const player = new Player();

      expect(player.isControllable()).toBeTruthy();
    });

    it('should return corrent results for running state', async () => {
      const player = new Player('dead');

      expect(player.isControllable()).toBeFalsy();
    });
  });

  describe('dispatch()', () => {
    it('should throw an error if the target state is unreachable', () => {
      const player = new Player('dead');

      expect(player.can('run')).toBeFalsy();
      expect(player.run(0, 0)).rejects.toBeInstanceOf(Error);
    });

    it('should throw an error if transitioning to current state', () => {
      const player = new Player('running');

      expect(player.can('run')).toBeFalsy();
      expect(player.run(0, 0)).rejects.toBeInstanceOf(Error);
    });

    it('should change the state after resolving', async () => {
      const player = new Player('running');
      expect(player.isRunning()).toBeTruthy();

      await player.die();
      expect(player.isDead()).toBeTruthy();
    });
  });
});
