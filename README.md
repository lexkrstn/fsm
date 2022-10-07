[![npm version](https://badge.fury.io/js/@lexkrstn%2Ffsm.svg)](https://badge.fury.io/js/@lexkrstn%2Ffsm)

# Finite State Machine

Finite state machines are useful for modeling complicated flows and keeping
track of state. FSM is a strongly typed finite state machine for TypeScript that
is using promises for async operations.

## Features:

- Type-safe
- TypeScript-first + JavaScript
- Only 1 KB (minified)
- Zero dependencies
- Synchronous / Asynchronous transitions
- Simple defnition
- Hooks after state change and on error

## Installation:

```bash
npm i -S type-safe-fsm
```
## Basic Example:

I'm modeling a "door" here. One can open the door, close it or break it.
Each action is done asynchronously: when opened it goes into opening state and
then resolved to open state, etc. Once broken, it reaches a final state.
Note that the same code can be run in Javascript, just remove the generics.

```typescript

// The states and events for the door.
type DoorStates = 'closing' | 'closed' | 'opening' | 'open' | 'breaking' | 'broken';
type DoorEvents = Event<'open'> | Event<'opened'> | Event<'close'>
  | Event<'closed'> | Event<'break'> | Event<'broken'>;


// Initialize the state machine
const door = new FSM<DoorStates, DoorEvents>(
  // Initial state
  'closed',
  // Transitions
  [
    // from       event      to           callback
    ['closed',    'open',    'opening',   onOpen],
    ['opening',   'opened',  'open',      justLog],
    ['open',      'close',   'closing',   onClose],
    ['closing',   'closed',  'closed',    justLog],
    ['open',      'break',   'breaking',  onBreak],
    ['breaking',  'broken',  'broken'],
    ['closed',    'break',   'breaking',  onBreak],
    ['breaking',  'broken',  'broken'],
  ],
);

// Just a helper function.
function timeout(ms: number = 10) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// The actions are async and return a promise:
function onOpen(): Promise<void> {
  console.log('onOpen...');
  await timeout(); // Emulating some asynchronous action
  return door.dispatch('opened');
}

function onClose(): Promise<void> {
  console.log('onClose...');
  await timeout(); // Emulating some asynchronous action
  return door.dispatch('closed');
}

function onBreak(): Promise<void> {
  console.log("onBreak...");
  await timeout(); // Emulating some asynchronous action
  return door.dispatch('broken');
}

// Synchronous callback is also ok
function justLog() {
  console.log(door.getState());
}

(async () => {
  // Open the door and wait for it to be open
  await door.dispatch('open');
  door.getState(); // => 'open'

  // Check if the door can be closed
  door.can('close'); // => true

  // Break the door, but don't wait.
  door.dispatch('break').then(() => {
    // did we get to a finite state?
    door.isFinal(); // => true
  });

  // The door is now in the 'breaking' state. It cannot be closed.
  try {
    await door.dispatch('close');
    assert('should not get here!');
  } catch (e) {
    // we're good
  }
})();
```
