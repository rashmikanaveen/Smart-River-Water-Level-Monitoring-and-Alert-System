type MessageHandler = (data: any) => void

class WSManager {
  private ws: WebSocket | null = null
  private url: string | null = null
  private handlers = new Set<MessageHandler>()
  private statusHandlers = new Set<(connected: boolean) => void>()
  private errorHandlers = new Set<(err: string | null) => void>()
  private reconnectAttempt = 0
  private maxAttempts = 10
  private manuallyClosed = false

  connect(url: string) {
    this.url = url
    this.manuallyClosed = false

    // If already open or connecting, don't create a new socket
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // notify status handlers
      this.statusHandlers.forEach(h => h(true))
      return
    }

    try {
      this.ws?.close()
    } catch (e) {
      // ignore
    }

    try {
      this.ws = new WebSocket(url)
    } catch (e) {
      this.notifyError(`Failed to create WebSocket: ${e instanceof Error ? e.message : String(e)}`)
      return
    }

    const wsRef = this.ws

    wsRef.onopen = () => {
      this.reconnectAttempt = 0
      this.notifyStatus(true)
      this.notifyError(null)
    }

    wsRef.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        this.handlers.forEach(h => h(data))
      } catch (err) {
        // ignore parse errors
      }
    }

    wsRef.onerror = () => {
      this.notifyError('WebSocket error')
      this.notifyStatus(false)
    }

    wsRef.onclose = (ev) => {
      this.notifyStatus(false)
      if (!this.manuallyClosed && this.reconnectAttempt < this.maxAttempts) {
        const delay = Math.min(1000 * (2 ** this.reconnectAttempt), 30000)
        this.reconnectAttempt += 1
        setTimeout(() => {
          if (!this.manuallyClosed && this.url) this.connect(this.url)
        }, delay)
      }
    }
  }

  addListener(handler: MessageHandler) {
    this.handlers.add(handler)
  }

  removeListener(handler: MessageHandler) {
    this.handlers.delete(handler)
  }

  addStatusListener(handler: (connected: boolean) => void) {
    this.statusHandlers.add(handler)
  }

  removeStatusListener(handler: (connected: boolean) => void) {
    this.statusHandlers.delete(handler)
  }

  addErrorListener(handler: (err: string | null) => void) {
    this.errorHandlers.add(handler)
  }

  removeErrorListener(handler: (err: string | null) => void) {
    this.errorHandlers.delete(handler)
  }

  notifyStatus(connected: boolean) {
    this.statusHandlers.forEach(h => h(connected))
  }

  notifyError(err: string | null) {
    this.errorHandlers.forEach(h => h(err))
  }

  close(manual = true) {
    this.manuallyClosed = manual
    try {
      this.ws?.close()
    } catch (e) {
      // ignore
    }
    this.ws = null
    this.notifyStatus(false)
  }

  isConnected() {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

const singleton = new WSManager()
export default singleton
