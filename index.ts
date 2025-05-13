enum HttpMethod {
  GET = "GET",
  POST = "POST",
}

enum HttpStatus {
  OK = 200,
  INTERNAL_SERVER_ERROR = 500,
}

type RequestMock = {
  method: HttpMethod;
  host: string;
  path: string;
  params: {
    id?: string;
  };
  body?: User;
};

type User = {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleted: boolean;
};

type HandlerReturnType = {
  status: HttpStatus;
};

type Handlers = {
  next: (value: RequestMock) => HandlerReturnType;
  error: (error: Error) => HandlerReturnType;
  complete: () => void;
};

class Observer {
  isUnsubscribed: boolean;
  handlers: Handlers;
  _unsubscribe?: () => void;

  constructor(handlers: Handlers) {
    this.handlers = {
      next: handlers.next || (() => {}),
      error: handlers.error || (() => {}),
      complete: handlers.complete || (() => {}),
    };
    this.isUnsubscribed = false;
  }

  next(value: RequestMock) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: Error) {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

type Subscribe = (observer: Observer) => () => void;

class Observable {
  _subscribe: Subscribe;

  constructor(subscribe: Subscribe) {
    this._subscribe = subscribe;
  }

  static from(values: RequestMock[]) {
    return new Observable((observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(obs: Handlers) {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const userMock: User = {
  name: "User Name",
  age: 26,
  roles: ["user", "admin"],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: RequestMock[] = [
  {
    method: HttpMethod.POST,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: HttpMethod.GET,
    host: "service.example",
    path: "user",
    params: {
      id: "3f5h67s4s",
    },
  },
];

const handleRequest = (request: RequestMock): HandlerReturnType => {
  // handling of request
  return { status: HttpStatus.OK };
};
const handleError = (error: Error): HandlerReturnType => {
  // handling of error
  return { status: HttpStatus.INTERNAL_SERVER_ERROR };
};

const handleComplete = () => console.log("complete");

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
