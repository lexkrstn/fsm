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

export interface Transition<States, Events extends Event<any, any>> {
  from: States;
  event: EventType<Events>;
  to: States;
  cb?: (...args: unknown[]) => Promise<void>;
}

export type TransitionTuple<States, Events extends Event<any, any>> = [
  States,
  EventType<Events>,
  States,
  ((...args: unknown[]) => Promise<void>)?,
];

export class FSM<States, Events extends Event<any, any>> implements Dispatcher<Events> {
  private currentState: States;
  private transitions: Transition<States, Events>[] = [];

  /**
   * Initalizes the state-machine.
   */
  public constructor(
    initialState: States,
    transitions: Transition<States, Events>[] = [],
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
        };
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
    return this.transitions.some(
      (trans) => trans.from === this.currentState && trans.event === eventType,
    );
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
        if (tran.from !== this.currentState || tran.event !== eventType) {
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
