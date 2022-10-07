import { Event, FSM } from './fsm';

type DoorStates = 'closing' | 'closed' | 'opening' | 'open' | 'breaking' | 'broken';

type DoorEvents = Event<'open'> | Event<'opened'> | Event<'close'>
  | Event<'closed'> | Event<'break'> | Event<'broken'>;

function timeout(ms: number = 10) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Door extends FSM<DoorStates, DoorEvents> {
  public constructor(init: DoorStates = 'closed') {
    super(init);

    /* eslint-disable no-multi-spaces */
    this.add([
      // from       event      to           callback
      ['closed',    'open',    'opening',   this.onOpen.bind(this)],
      ['opening',   'opened',  'open',      this.justLog.bind(this)],
      ['open',      'close',   'closing',   this.onClose.bind(this)],
      ['closing',   'closed',  'closed',    this.justLog.bind(this)],
      ['open',      'break',   'breaking',  this.onBreak.bind(this)],
      ['breaking',  'broken',  'broken'],
      ['closed',    'break',   'breaking',  this.onBreak.bind(this)],
      ['breaking',  'broken',  'broken'],
    ]);
    /* eslint-enable no-multi-spaces */
  }

  public open() { return this.dispatch('open'); }

  public close() { return this.dispatch('close'); }

  public break() { return this.dispatch('break'); }

  public isBroken(): boolean { return this.getState() === 'broken'; }

  public isOpen(): boolean { return this.getState() === 'open'; }

  private async onOpen() {
    await timeout();
    return this.dispatch('opened');
  }

  private async onClose() {
    await timeout();
    return this.dispatch('closed');
  }

  private async onBreak() {
    await timeout();
    return this.dispatch('broken');
  }

  private justLog() {
    console.log(`${this.getState()}`);
  }
}

describe('FSM tests', () => {
  test('test Opening a Closed door', async () => {
    const door = new Door();

    expect(door.isOpen()).toBeFalsy();
    expect(door.isBroken()).toBeFalsy();
    expect(door.can('open')).toBeTruthy();

    await door.open();
    expect(door.isOpen()).toBeTruthy();
  });

  test('test a failed event', (done) => {
    const door = new Door('open');
    expect(door.can('open')).toBeFalsy();

    door.open().then(() => {
      expect('should never get here 1').toBeFalsy();
    }).catch(() => {
      // we are good.
      done();
    });
  });

  test('test Closing an Open door', async () => {
    const door = new Door('open');
    expect(door.isOpen()).toBeTruthy();

    await door.close();
    expect(door.isOpen()).toBeFalsy();
  });

  test('test Breaking a door', async () => {
    const door = new Door();
    expect(door.isBroken()).toBeFalsy();

    await door.break();
    expect(door.isBroken()).toBeTruthy();
    expect(door.isOpen()).toBeFalsy();
  });

  test('Broken door cannot be Opened or Closed', async () => {
    const door = new Door('broken');
    expect(door.isBroken()).toBeTruthy();

    await expect(door.open()).rejects.toBeInstanceOf(Error);
  });

  test('should throw on intermediate state', async () => {
    const door = new Door('open');
    expect(door.isOpen()).toBeTruthy();

    const promise = door.close();
    expect(door.getState() === 'closing').toBeTruthy();
    expect(door.break()).rejects.toBeInstanceOf(Error);
    await promise;
  });
});
