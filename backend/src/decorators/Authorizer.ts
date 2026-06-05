import { Role } from '../typings'

export function Authorize(roles: Role[]): ClassDecorator & MethodDecorator {
  return function (object: Object, methodName?: string | symbol) {
    Reflect.defineMetadata('loginUser:roles', roles, methodName ? (object as any)[methodName] : object)
  }
}
