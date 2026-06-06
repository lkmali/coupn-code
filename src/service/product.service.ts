import { isNil } from 'lodash'
import { MongoProductRepository, toObjectId } from '../database'
import { LoggerProvider } from '../provider/logger.provider'
import { badRequest, notFoundData } from '../utils'
import { IMongoProduct, UserProfile, AuditAction } from '../typings'
import { AuditLogService } from './auditLog.service'

const loggerProvider = LoggerProvider.Instance

/** Escape user input before using it inside a RegExp (for case-insensitive name lookups). */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Server-side price source. Order amounts are derived from a Product here so the
 * client never dictates the charge amount.
 */
export class ProductService {
  private static instance: ProductService
  private readonly repo = new MongoProductRepository()
  private readonly auditLogService = AuditLogService.Instance

  /** Load an active product scoped to the org, or throw 404. */
  async getActiveProductOrThrow(orgId: string, productId: string): Promise<IMongoProduct> {
    const product = await this.repo.findOne({
      _id: toObjectId(productId),
      orgId: toObjectId(orgId),
      isActive: true,
      isDelete: false,
    })
    if (!product) {
      throw notFoundData('Product not found')
    }
    return product
  }

  async listProducts(orgId: string): Promise<IMongoProduct[]> {
    return this.repo.find(
      { orgId: toObjectId(orgId), isDelete: false },
      { sort: { createdAt: -1 } },
    )
  }

  /**
   * Throw if another (non-deleted) product in the org already uses this name.
   * Matching is case-insensitive and trimmed so "Basic" and " basic " collide.
   * Pass `excludeId` when editing so a product doesn't conflict with itself.
   */
  private async assertNameAvailable(orgId: string, name: string, excludeId?: string): Promise<void> {
    const trimmed = name.trim()
    const query: Record<string, unknown> = {
      orgId: toObjectId(orgId),
      isDelete: false,
      name: { $regex: `^${escapeRegExp(trimmed)}$`, $options: 'i' },
    }
    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) }
    }
    const existing = await this.repo.findOne(query)
    if (existing) {
      throw badRequest(`A product named "${trimmed}" already exists`)
    }
  }

  async createProduct(
    orgId: string,
    data: { name: string; description?: string; amount: number; currency?: string },
    userProfile: UserProfile,
  ): Promise<IMongoProduct> {
    try {
      if (!Number.isInteger(data.amount) || data.amount < 0) {
        throw badRequest('amount must be a non-negative integer (smallest currency unit)')
      }
      const name = data.name.trim()
      if (!name) {
        throw badRequest('name is required')
      }
      await this.assertNameAvailable(orgId, name)

      const product = await this.repo.save({
        orgId: toObjectId(orgId),
        name,
        description: data.description,
        amount: data.amount,
        currency: (data.currency ?? 'usd').toLowerCase(),
        isActive: true,
        isDelete: false,
        createdBy: toObjectId(userProfile.userId),
        updatedBy: toObjectId(userProfile.userId),
      })

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.PRODUCT_CREATED,
        resourceType: 'Product',
        resourceId: String(product._id),
        payload: { name: product.name, amount: product.amount, currency: product.currency },
      })

      return product
    } catch (error: any) {
      loggerProvider.logger.error('createProduct_Error', { error: error.message, stack: error.stack, orgId })
      throw error
    }
  }

  /**
   * Edit an existing org-scoped product. Only the supplied fields change; the
   * name stays unique within the org (case-insensitive).
   */
  async updateProduct(
    orgId: string,
    productId: string,
    data: { name?: string; description?: string; amount?: number; currency?: string; isActive?: boolean },
    userProfile: UserProfile,
  ): Promise<IMongoProduct> {
    try {
      const existing = await this.repo.findOne({
        _id: toObjectId(productId),
        orgId: toObjectId(orgId),
        isDelete: false,
      })
      if (!existing) {
        throw notFoundData('Product not found')
      }

      const update: Partial<IMongoProduct> = {
        updatedBy: toObjectId(userProfile.userId),
      }

      if (data.name !== undefined) {
        const name = data.name.trim()
        if (!name) {
          throw badRequest('name cannot be empty')
        }
        // Only re-check uniqueness when the name actually changes.
        if (name.toLowerCase() !== existing.name.trim().toLowerCase()) {
          await this.assertNameAvailable(orgId, name, productId)
        }
        update.name = name
      }

      if (data.amount !== undefined) {
        if (!Number.isInteger(data.amount) || data.amount < 0) {
          throw badRequest('amount must be a non-negative integer (smallest currency unit)')
        }
        update.amount = data.amount
      }

      if (data.description !== undefined) update.description = data.description
      if (data.currency !== undefined) update.currency = data.currency.toLowerCase()
      if (data.isActive !== undefined) update.isActive = data.isActive

      const product = await this.repo.updateOne(
        { _id: toObjectId(productId), orgId: toObjectId(orgId), isDelete: false },
        update,
      )
      if (!product) {
        throw notFoundData('Product not found')
      }

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.PRODUCT_UPDATED,
        resourceType: 'Product',
        resourceId: productId,
        payload: {
          nameChanged: data.name !== undefined,
          amountChanged: data.amount !== undefined,
          isActive: product.isActive,
        },
      })

      return product
    } catch (error: any) {
      loggerProvider.logger.error('updateProduct_Error', { error: error.message, stack: error.stack, orgId, productId })
      throw error
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
