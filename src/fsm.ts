/*
 * StateMachine.ts
 * TypeScript finite state machine class with async transformations using promises.
 */

export interface Event<Type, Payload extends any[] = []> {
  type: Type;
  payload: Payload;
}

export type EventType<E extends Event<any, any>> = E extends Event<infer T, any> ? T : never;

type EventPayloadMap<Events extends Event<any, any>> = {
  [Type in EventType<Events>]: Extract<Events, { type: Type }>['payload']
};

export interface Dispatcher<E extends Event<any, any>> {
  dispatch<T extends EventType<E>>(
    type: T,
    ...payload: EventPayloadMap<E>[T]
  ): Promise<void>;
}

export type Transition<States, E extends Event<any, any>> = E extends E ? {
  from: States | '*';
  event: E['type'];
  to: States;
  cb?: ((...args: E['payload']) => Promise<void>) | ((...args: E['payload']) => void);
} : never;

export type TransitionTuple<States, E extends Event<any, any>> = E extends E ? [
  States | '*',
  E['type'],
  States,
  (((...args: E['payload']) => Promise<void>) | ((...args: E['payload']) => void))?,
] : never;

export class FSM<States, Events extends Event<any, any>> implements Dispatcher<Events> {
  private currentState: States;

  private transitions: Transition<States, Events>[] = [];

  /**
   * Initalizes the state-machine.
   */
  public constructor(
    initialState: States,
    transitions: (Transition<States, Events> | TransitionTuple<States, Events>)[] = [],
  ) {
    this.currentState = initialState;
    this.add(transitions);
  }

  /**
   * Adds new transitions.
   */
  public add(transitions: (Transition<States, Events> | TransitionTuple<States, Events>)[]) {
    this.transitions = this.transitions.concat(transitions.map((t) => {
      if (t instanceof Array) {
        return {
          from: t[0],
          event: t[1],
          to: t[2],
          cb: t.length > 3 ? t[3] : undefined,
        } as Transition<States, Events>;
      }
      return t;
    }));
  }

  /**
   * Returns current state.
   */
  public getState() { return this.currentState; }

  /**
   * Returns true if there is a transition from the current state,
   * that is triggered by the specified event type.
   */
  public can(eventType: EventType<Events>) {
    return this.transitions.some((tran) => {
      if (tran.event !== eventType) {
        return false;
      }
      if (tran.from !== this.currentState && tran.from !== '*') {
        return false;
      }
      if (tran.to === this.currentState) {
        return false;
      }
      return true;
    });
  }

  /**
   * Returns true if there is no transition from the current state.
   */
  public isFinal() {
    // search for a transition that starts from current state.
    // if none is found it's a terminal state.
    return this.transitions.every((trans) => trans.from !== this.currentState);
  }

  /**
   * Dispatches a transition event.
   *
   * @param eventType The value of the 'type' property of the event.
   * @param args Optional event payload (arguments).
   * @returns A Promise that is resolved when transition is complete.
   */
  public dispatch<T extends EventType<Events>>(
    eventType: T,
    ...args: EventPayloadMap<Events>[T]
  ) {
    return new Promise<void>((resolve, reject) => {
      // find transition
      const found = this.transitions.some((tran) => {
        if (tran.event !== eventType) {
          return false;
        }
        if (tran.from !== this.currentState && tran.from !== '*') {
          return false;
        }
        if (tran.to === this.currentState) {
          return false;
        }
        this.currentState = tran.to;
        if (tran.cb) {
          try {
            const result = tran.cb(args);
            if (result instanceof Promise) {
              result
                .then(resolve)
                .catch(reject);
            } else {
              resolve();
            }
          } catch (e) {
            reject(e);
          }
        } else {
          resolve();
        }
        return true;
      });

      // no such transition
      if (!found) {
        reject(new Error(`No transition from ${this.currentState} on ${eventType}`));
      }
    });
  }
}
