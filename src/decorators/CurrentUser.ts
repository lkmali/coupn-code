import { createParamDecorator } from 'routing-controllers'

export function CurrentUser() {
  return createParamDecorator({
    required: false,
    value: action => {
      return (action.request as any).user // user injected by AuthMiddleware
    },
  })
}
