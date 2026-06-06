// decorators/Authentication.ts
import { AuthenticationStrategyType } from '../typings/interface'

export function Authentication(
  type: AuthenticationStrategyType = AuthenticationStrategyType.JWT_AUTH,
): ClassDecorator & MethodDecorator {
  return function (object: Object, methodName?: string | symbol) {
    Reflect.defineMetadata('auth:type', type, methodName ? (object as any)[methodName] : object)
  }
}
