[![npm version](https://badge.fury.io/js/@lexkrstn%2Ffsm.svg)](https://badge.fury.io/js/@lexkrstn%2Ffsm)

# Finite State Machine

Finite state machines are useful for modeling complicated flows and keeping
track of state. The package provides a strongly typed FSM implementation for
TypeScript and JavaScript.

## Motivation

Theoretically, the FSM must comprise only 2 key elements:
- states
- transitions between them

In practice, though, implementations typically have at least one of the
following flaws:
1. **Mixing up multiple patterns**, such as inheriting States from Strategies.
   There is nothing wrong with this approach if you're not planning to reuse
   FSM anywhere else. But it's a bad idea for a library, because not every
   problem requires this mix. In the example below I'm demonstrating how to
   make use of the both patterns together separating the concerns.
2. **States with onEnter/onExit handlers only**. This approach assumes that
   these two handlers can independently compose a transition function, which
   is not the case if the transition depends on both the previous and the
   next state.
3. **Making the client to extend a state class**. First, it doesn't make sense
   to incapsulate each state in a separate class, unless you're mixing it
   with the Strategy pattern. Secondly, it's not unusual to find youself
   having to repeat the same blocks of code again and again, especially if the
   State implementation has the onEnter/onExit handlers for transitions.

All these reasons prompted me to write this library.

## Features:

- SRP-compliant
- Type-safe
- Only 1 KB (minified)
- Zero dependencies
- Asynchronous transitions
- Simple state and transition definition

## Installation:

```bash
npm i -S @lexkrstn/fsm
```
## Example:

In the following example, I'm modeling a Player class for a game.
Notice how multiple patterns can be used together without mixing conserns.

```typescript
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

(async () => {
  const player = new Player();
  // Dispatch the 'run' event with 2 parameters (position x, y) and wait
  // for the transition to complete.
  await player.run(0, 0);
  player.isRunning(); // => true

  // Check if the player can stop (i.e. the FSM can dispatch this event)
  player.can('stop'); // => true

  // Kill the player, but don't wait.
  await player.die();

  // Did we reach the final state?
  player.isControllable(); // => false
})();
```
