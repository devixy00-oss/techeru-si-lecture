export type TeacherState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'EXPLAINING'
  | 'WAITING_FOR_ANSWER'
  | 'HAPPY'
  | 'CONFUSED'
  | 'ENCOURAGING'
  | 'INTERRUPTED';

export type TeacherEvent =
  | 'STUDENT_START_SPEAKING'
  | 'STUDENT_STOP_SPEAKING'
  | 'AI_START_THINKING'
  | 'AI_START_SPEAKING'
  | 'AI_EXPLAIN'
  | 'AI_FINISH_SPEAKING'
  | 'INTERRUPT'
  | 'STUDENT_CORRECT'
  | 'STUDENT_INCORRECT'
  | 'RESET';

export type StateListener = (state: TeacherState, previousState: TeacherState) => void;

export class TeacherStateMachine {
  private currentState: TeacherState = 'IDLE';
  private listeners: Set<StateListener> = new Set();

  constructor(initialState: TeacherState = 'IDLE') {
    this.currentState = initialState;
  }

  public getState(): TeacherState {
    return this.currentState;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public transition(event: TeacherEvent): TeacherState {
    const prev = this.currentState;
    let next: TeacherState = prev;

    switch (event) {
      case 'STUDENT_START_SPEAKING':
        next = 'LISTENING';
        break;
      case 'STUDENT_STOP_SPEAKING':
      case 'AI_START_THINKING':
        next = 'THINKING';
        break;
      case 'AI_START_SPEAKING':
        next = 'SPEAKING';
        break;
      case 'AI_EXPLAIN':
        next = 'EXPLAINING';
        break;
      case 'AI_FINISH_SPEAKING':
      case 'RESET':
        next = 'IDLE';
        break;
      case 'INTERRUPT':
        next = 'INTERRUPTED';
        break;
      case 'STUDENT_CORRECT':
        next = 'HAPPY';
        break;
      case 'STUDENT_INCORRECT':
        next = 'ENCOURAGING';
        break;
    }

    if (next !== prev) {
      this.currentState = next;
      this.listeners.forEach(fn => fn(next, prev));
    }

    return this.currentState;
  }

  public forceState(state: TeacherState): void {
    const prev = this.currentState;
    if (state !== prev) {
      this.currentState = state;
      this.listeners.forEach(fn => fn(state, prev));
    }
  }
}

export const teacherSM = new TeacherStateMachine('IDLE');
