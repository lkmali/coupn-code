import { createParamDecorator } from 'routing-controllers'

export function CurrentHeader() {
  return createParamDecorator({
    required: false,
    value: action => {
      return action.request.headers // user injected by AuthMiddleware
    },
  })
}
