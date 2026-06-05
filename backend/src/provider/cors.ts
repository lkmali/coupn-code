import cors from 'cors'
import { Application, Request, Response } from 'express'
import { envConfig } from '../config'
import { isNil } from '../utils'
export class CorsProvider {
  options: cors.CorsOptions = {
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
    // Let clients send the URC header on preflight and read it back on responses —
    // without this the browser hides custom headers from JS.
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Timezone', 'X-URC'],
    exposedHeaders: ['X-URC'],
    origin: (origin: any, callback: Function) => {
      if (this.isDomainAllowed(origin, envConfig.ALLOWED_ORIGINS)) callback(null, true)
      else callback(null, false)
    },
    preflightContinue: false,
  }

  isDomainAllowed(originRequest: string, allowedDomains: string[]): boolean {
    let index
    let domain
    if (allowedDomains.indexOf('*') !== -1) return true

    for (index = 0; index !== allowedDomains.length; index++) {
      domain = allowedDomains[index]
      if (!isNil(originRequest) && originRequest.indexOf(domain) !== -1) return true
    }
    return false
  }

  corsRequest = (app: Application) => {
    app.use(cors<Request>(this.options))
    app.use((request: Request, response: Response, next: Function) => {
      let allowedDomainName
      if (request.method === 'OPTIONS') {
        response.status(405).end()
        return
      }
      allowedDomainName = this.isDomainAllowed(request.headers.origin as string, envConfig.ALLOWED_ORIGINS)
        ? request.headers.origin
        : undefined
      if (!isNil(allowedDomainName)) {
        response.header('Access-Control-Allow-Origin', allowedDomainName)
      }
      response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Timezone, X-URC')
      response.header('Access-Control-Expose-Headers', 'X-URC')
      response.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,PATCH')
      response.header('X-Frame-Options', 'DENY')
      next()
    })
  }
}
