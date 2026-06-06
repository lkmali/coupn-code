import { isNil } from '../utils'
import axios, { AxiosRequestConfig } from 'axios'
import qs from 'qs'
import { LoggerProvider } from '../provider'
const loggerProvider = LoggerProvider.Instance
export class AxiosService {
  private static instance: AxiosService
  public async encodePost(url: string, data: any, headers = {}): Promise<any> {
    try {
      const response = await axios.post(url, qs.stringify(data), {
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      if ([200, 201, 202].includes(response.status)) {
        return response.data
      } else {
        loggerProvider.logger.error('encodePost_Error', { error: 'Failed to send request', status: response.status, data: response.data, url })
        throw 'Failed to send request'
      }
    } catch (error: any) {
      loggerProvider.logger.error('encodePost_Error', { error: error.message, stack: error.stack, url, data })
      throw error
    }
  }

  public async post(url: string, data: any, config: AxiosRequestConfig = {}): Promise<any> {
    try {
      const response = await axios.post(url, data, {
        ...config,
        headers: {
          ...(config.headers ?? {}),
          'Content-Type': 'application/json',
        },
      })
      if ([200, 201, 202].includes(response.status)) {
        return response.data
      } else {
        loggerProvider.logger.error('post_Error', { error: 'Failed to send request', status: response.status, data: response.data, url })
        throw 'Failed to send SMS'
      }
    } catch (error: any) {
      loggerProvider.logger.error('post_Error', { error: error.message, stack: error.stack, url, data })
      throw error
    }
  }

  public async get(url: string, config: AxiosRequestConfig = {}): Promise<any> {
    try {
      const response = await axios.get(url, {
        ...config,
        headers: {
          ...(config.headers ?? {}),
          'Content-Type': 'application/json',
        },
      })
      if (response.status >= 200 && response.status < 300) {
        return response.data
      } else {
        loggerProvider.logger.error('get_Error', { error: 'Failed to send request', status: response.status, data: response.data, url })
        throw 'Failed to send SMS'
      }
    } catch (error: any) {
      loggerProvider.logger.error('get_Error', { error: error.message, stack: error.stack, url })
      throw error
    }
  }

  public static get Instance() {
    try {
      if (isNil(this.instance)) this.instance = new this()

      return this.instance
    } catch (error: any) {
      loggerProvider.logger.error('Instance_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
