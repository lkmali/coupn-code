import { AsyncLocalStorage } from 'async_hooks'

interface Context {
  requestId: string
  userId: string
  sessionId: string
  ipAddress: string
  endpoint: string
  method: string
}

export const requestContext = new AsyncLocalStorage<Context>()

export const setRequestContext = (context: Context, callback: () => void) => {
  requestContext.run(context, callback)
}
export const getRequestContext = (): Context => {
  return (
    requestContext.getStore() || {
      requestId: '',
      userId: '',
      sessionId: '',
      ipAddress: '',
      endpoint: '',
      method: '',
    }
  )
}
