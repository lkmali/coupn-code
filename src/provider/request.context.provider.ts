import { AsyncLocalStorage } from 'async_hooks'

interface Context {
  requestId: string
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
      ipAddress: '',
      endpoint: '',
      method: '',
    }
  )
}
