// Simple fetch-based XMLHttpRequest polyfill that avoids event-target-shim
type XMLHttpRequestResponseType = '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';

class CustomEvent implements Event {
  readonly NONE: 0 = 0;
  readonly CAPTURING_PHASE: 1 = 1;
  readonly AT_TARGET: 2 = 2;
  readonly BUBBLING_PHASE: 3 = 3;
  
  readonly bubbles: boolean = false;
  readonly cancelable: boolean = false;
  readonly composed: boolean = false;
  readonly currentTarget: EventTarget | null = null;
  readonly defaultPrevented: boolean = false;
  readonly eventPhase: number = 0;
  readonly isTrusted: boolean = true;
  readonly target: EventTarget | null = null;
  readonly timeStamp: number = Date.now();
  readonly type: string;

  // Legacy properties required by Event interface
  cancelBubble: boolean = false;
  returnValue: boolean = true;
  readonly srcElement: EventTarget | null = null;
  
  constructor(type: string, target?: EventTarget) {
    this.type = type;
    this.target = target || null;
    this.currentTarget = target || null;
  }

  stopPropagation(): void { this.cancelBubble = true; }
  stopImmediatePropagation(): void { this.cancelBubble = true; }
  preventDefault(): void { this.returnValue = false; }
  composedPath(): EventTarget[] { return []; }
  initEvent(_type: string, _bubbles?: boolean, _cancelable?: boolean): void {}
}

export class XMLHttpRequestPolyfill implements XMLHttpRequest {
  // State
  private _readyState: number = 0;
  private _response: any = '';
  private _responseText: string = '';
  private _status: number = 0;
  private _statusText: string = '';
  private _responseURL: string = '';
  private _method: string = 'GET';
  private _url: string = '';
  private _async: boolean = true;
  private _headers: { [key: string]: string } = {};
  private _responseHeaders: { [key: string]: string } = {};

  // Constants
  readonly DONE: 4 = 4;
  readonly HEADERS_RECEIVED: 2 = 2;
  readonly LOADING: 3 = 3;
  readonly OPENED: 1 = 1;
  readonly UNSENT: 0 = 0;

  // Required properties
  readonly upload: XMLHttpRequestUpload = {} as XMLHttpRequestUpload;
  readonly responseXML: Document | null = null;

  // Event handlers
  private _onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
  private _onabort: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
  private _onerror: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
  private _onload: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
  private _onloadend: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
  private _onloadstart: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
  private _onprogress: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
  private _ontimeout: ((this: XMLHttpRequest, ev: Event) => any) | null = null;

  // Properties
  get readyState(): number {
    return this._readyState;
  }

  get response(): any {
    return this._response;
  }

  get responseText(): string {
    return this._responseText;
  }

  private _responseType: XMLHttpRequestResponseType = '';
  get responseType(): XMLHttpRequestResponseType {
    return this._responseType;
  }
  set responseType(value: XMLHttpRequestResponseType) {
    this._responseType = value;
  }

  get status(): number {
    return this._status;
  }

  get statusText(): string {
    return this._statusText;
  }

  private _timeout: number = 0;
  get timeout(): number {
    return this._timeout;
  }
  set timeout(value: number) {
    this._timeout = value;
  }

  private _withCredentials: boolean = false;
  get withCredentials(): boolean {
    return this._withCredentials;
  }
  set withCredentials(value: boolean) {
    this._withCredentials = value;
  }

  // Event handlers
  get onreadystatechange(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this._onreadystatechange;
  }
  set onreadystatechange(value: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this._onreadystatechange = value;
  }

  get onabort(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this._onabort;
  }
  set onabort(value: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this._onabort = value;
  }

  get onerror(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this._onerror;
  }
  set onerror(value: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this._onerror = value;
  }

  get onload(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this._onload;
  }
  set onload(value: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this._onload = value;
  }

  get onloadend(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this._onloadend;
  }
  set onloadend(value: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this._onloadend = value;
  }

  get onloadstart(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this._onloadstart;
  }
  set onloadstart(value: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this._onloadstart = value;
  }

  get onprogress(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this._onprogress;
  }
  set onprogress(value: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this._onprogress = value;
  }

  get ontimeout(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this._ontimeout;
  }
  set ontimeout(value: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this._ontimeout = value;
  }

  // Methods
  abort(): void {
    this._readyState = this.DONE;
    this._dispatchEvent('abort');
    this._dispatchEvent('loadend');
  }

  getAllResponseHeaders(): string {
    if (this._readyState < this.HEADERS_RECEIVED) {
      return '';
    }
    return Object.entries(this._responseHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n');
  }

  getResponseHeader(name: string): string | null {
    if (this._readyState < this.HEADERS_RECEIVED) {
      return null;
    }
    return this._responseHeaders[name.toLowerCase()] || null;
  }

  open(method: string, url: string, async: boolean = true): void {
    this._method = method;
    this._url = url;
    this._async = async;
    this._readyState = this.OPENED;
    this._dispatchEvent('readystatechange');
  }

  setRequestHeader(name: string, value: string): void {
    if (this._readyState !== this.OPENED) {
      throw new Error('INVALID_STATE_ERR');
    }
    this._headers[name.toLowerCase()] = value;
  }

  send(body?: Document | XMLHttpRequestBodyInit | null): void {
    if (this._readyState !== this.OPENED) {
      throw new Error('INVALID_STATE_ERR');
    }

    const init: RequestInit = {
      method: this._method,
      headers: this._headers,
      body: body as any,
      credentials: this.withCredentials ? 'include' : 'same-origin'
    };

    if (this._timeout > 0) {
      init.signal = AbortSignal.timeout(this._timeout);
    }

    this._dispatchEvent('loadstart');

    fetch(this._url, init)
      .then(async response => {
        this._responseURL = response.url;
        this._status = response.status;
        this._statusText = response.statusText;

        // Store response headers
        response.headers.forEach((value, key) => {
          this._responseHeaders[key.toLowerCase()] = value;
        });

        this._readyState = this.HEADERS_RECEIVED;
        this._dispatchEvent('readystatechange');

        this._readyState = this.LOADING;
        this._dispatchEvent('readystatechange');

        // Handle different response types
        if (this.responseType === 'json') {
          this._response = await response.json();
          this._responseText = JSON.stringify(this._response);
        } else if (this.responseType === 'text' || this.responseType === '') {
          this._response = this._responseText = await response.text();
        } else if (this.responseType === 'arraybuffer') {
          this._response = await response.arrayBuffer();
          this._responseText = '';
        } else if (this.responseType === 'blob') {
          this._response = await response.blob();
          this._responseText = '';
        }

        this._readyState = this.DONE;
        this._dispatchEvent('readystatechange');
        this._dispatchEvent('load');
        this._dispatchEvent('loadend');
      })
      .catch(error => {
        this._readyState = this.DONE;
        if (error.name === 'AbortError' && this._timeout > 0) {
          this._dispatchEvent('timeout');
        } else {
          this._dispatchEvent('error');
        }
        this._dispatchEvent('loadend');
      });
  }

  // EventTarget interface
  addEventListener(type: string, listener: (event: Event) => void): void {
    const key = `_on${type}` as keyof this;
    if (typeof this[key] === 'object') {
      this[key] = listener as any;
    }
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    const key = `_on${type}` as keyof this;
    if (this[key] === listener) {
      this[key] = null as any;
    }
  }

  dispatchEvent(event: Event): boolean {
    const handler = this[`_on${event.type}`] as ((this: XMLHttpRequest, ev: Event) => any) | null;
    if (handler) {
      handler.call(this as XMLHttpRequest, event);
    }
    return true;
  }

  private _dispatchEvent(type: string): void {
    const event = new CustomEvent(type, this as unknown as EventTarget);
    this.dispatchEvent(event);
  }
  // Properties
  private _readyState: number = 0;
  private _response: any = '';
  private _responseText: string = '';
  private _responseType: XMLHttpRequestResponseType = '';
  private _status: number = 0;
  private _statusText: string = '';
  private _timeout: number = 0;
  private _responseURL: string = '';
  private _withCredentials: boolean = false;
  private _abort: boolean = false;
  private _headers: { [key: string]: string } = {};
  private _responseHeaders: { [key: string]: string } = {};
  
  // Event handlers
  private _onreadystatechange: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  private _onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  private _onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  private _onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  private _onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  private _onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  private _onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  private _ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;

  // Constructor
  constructor() {
    this.DONE = 4;
    this.HEADERS_RECEIVED = 2;
    this.LOADING = 3;
    this.OPENED = 1;
    this.UNSENT = 0;
  }

  // Constants
  readonly DONE: number;
  readonly HEADERS_RECEIVED: number;
  readonly LOADING: number;
  readonly OPENED: number;
  readonly UNSENT: number;

  // Properties
  get readyState(): number {
    return this._readyState;
  }

  get response(): any {
    return this._response;
  }

  get responseText(): string {
    return this._responseText;
  }

  get responseType(): XMLHttpRequestResponseType {
    return this._responseType;
  }

  set responseType(value: XMLHttpRequestResponseType) {
    this._responseType = value;
  }

  get responseURL(): string {
    return this._responseURL;
  }

  get status(): number {
    return this._status;
  }

  get statusText(): string {
    return this._statusText;
  }

  get timeout(): number {
    return this._timeout;
  }

  set timeout(value: number) {
    this._timeout = value;
  }

  get upload(): XMLHttpRequestUpload {
    throw new Error('XMLHttpRequestUpload not implemented');
  }

  get withCredentials(): boolean {
    return this._withCredentials;
  }

  set withCredentials(value: boolean) {
    this._withCredentials = value;
  }

  // Event handlers
  get onreadystatechange(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    return this._onreadystatechange;
  }

  set onreadystatechange(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this._onreadystatechange = value;
  }

  get onabort(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    return this._onabort;
  }

  set onabort(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this._onabort = value;
  }

  get onerror(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    return this._onerror;
  }

  set onerror(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this._onerror = value;
  }

  get onload(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    return this._onload;
  }

  set onload(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this._onload = value;
  }

  get onloadend(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    return this._onloadend;
  }

  set onloadend(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this._onloadend = value;
  }

  get onloadstart(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    return this._onloadstart;
  }

  set onloadstart(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this._onloadstart = value;
  }

  get onprogress(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    return this._onprogress;
  }

  set onprogress(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this._onprogress = value;
  }

  get ontimeout(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    return this._ontimeout;
  }

  set ontimeout(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this._ontimeout = value;
  }

  // Methods
  abort(): void {
    this._abort = true;
    this._readyState = this.DONE;
    this._dispatchEvent('abort');
    this._dispatchEvent('loadend');
  }

  getAllResponseHeaders(): string {
    return Object.entries(this._responseHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n');
  }

  getResponseHeader(name: string): string | null {
    return this._responseHeaders[name.toLowerCase()] || null;
  }

  open(method: string, url: string, async: boolean = true, username?: string | null, password?: string | null): void {
    this._readyState = this.OPENED;
    this._responseURL = url;
    this._dispatchEvent('readystatechange');
  }

  overrideMimeType(mime: string): void {
    // Not implemented
  }

  setRequestHeader(name: string, value: string): void {
    this._headers[name.toLowerCase()] = value;
  }

  send(body?: Document | XMLHttpRequestBodyInit | null): void {
    const init: RequestInit = {
      method: 'GET',
      headers: this._headers,
      body: body as any,
      credentials: this.withCredentials ? 'include' : 'same-origin',
    };

    if (this._timeout > 0) {
      init.signal = AbortSignal.timeout(this._timeout);
    }

    this._dispatchEvent('loadstart');

    fetch(this._responseURL, init)
      .then(async response => {
        this._status = response.status;
        this._statusText = response.statusText;

        // Store response headers
        response.headers.forEach((value, key) => {
          this._responseHeaders[key.toLowerCase()] = value;
        });

        this._readyState = this.HEADERS_RECEIVED;
        this._dispatchEvent('readystatechange');

        this._readyState = this.LOADING;
        this._dispatchEvent('readystatechange');

        // Handle different response types
        if (this.responseType === 'json') {
          this._response = await response.json();
          this._responseText = JSON.stringify(this._response);
        } else if (this.responseType === 'text' || this.responseType === '') {
          this._response = this._responseText = await response.text();
        } else if (this.responseType === 'arraybuffer') {
          this._response = await response.arrayBuffer();
          this._responseText = '';
        } else if (this.responseType === 'blob') {
          this._response = await response.blob();
          this._responseText = '';
        }

        if (!this._abort) {
          this._readyState = this.DONE;
          this._dispatchEvent('readystatechange');
          this._dispatchEvent('load');
          this._dispatchEvent('loadend');
        }
      })
      .catch(error => {
        if (error.name === 'AbortError' && this._timeout > 0) {
          this._dispatchEvent('timeout');
        } else {
          this._dispatchEvent('error');
        }
        this._dispatchEvent('loadend');
      });
  }

  private _dispatchEvent(type: keyof XMLHttpRequestEventMap): void {
    const event = new ProgressEvent(type, { target: this });
    const handler = this[`on${type}`] as ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    
    if (handler) {
      handler.call(this, event);
    }
  }
}
