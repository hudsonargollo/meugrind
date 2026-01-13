import { db } from './database';
import { BrandDeal, ContentAsset, Brand, Script, Deliverable } from '../types/influencer';
import { Event } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class InfluencerService {
  // Brand Deal CRUD Operations
  async createBrandDeal(brandDeal: Omit<BrandDeal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<BrandDeal> {
    const newBrandDeal: BrandDeal = {
      ...brandDeal,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      version: 1,
    };

    await db.brandDeals.add(newBrandDeal);

    // Auto-generate deliverable tasks
    await this.generateDeliverableTasks(newBrandDeal);

    return newBrandDeal;
  }

  async getBrandDeal(id: string): Promise<BrandDeal | undefined> {
    return await db.brandDeals.get(id);
  }

  async getAllBrandDeals(): Promise<BrandDeal[]> {
    return await db.brandDeals.orderBy('createdAt').reverse().toArray();
  }

  async getBrandDealsByStatus(status: BrandDeal['status']): Promise<BrandDeal[]> {
    return await db.brandDeals.where('status').equals(status).toArray();
  }

  async updateBrandDeal(id: string, updates: Partial<BrandDeal>): Promise<void> {
    await db.brandDeals.update(id, {
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'pending',
    });
  }

  async deleteBrandDeal(id: string): Promise<void> {
    await db.brandDeals.delete(id);
    // Also delete related content assets
    await db.contentAssets.where('brandDealId').equals(id).delete();
  }

  // Content Pipeline Management
  async getContentPipeline(): Promise<{ [key: string]: ContentAsset[] }> {
    const assets = await db.contentAssets.toArray();
    
    const pipeline = {
      ideation: assets.filter(asset => asset.status === 'draft' && !asset.publishedAt),
      scripting: assets.filter(asset => asset.status === 'draft' && asset.description?.includes('script')),
      filming: assets.filter(asset => asset.status === 'review'),
      approval: assets.filter(asset => asset.status === 'approved' && !asset.publishedAt),
      posted: assets.filter(asset => asset.status === 'published' && asset.publishedAt),
      invoice_sent: assets.filter(asset => {
        // Check if related brand deal has been invoiced
        return asset.brandDealId && asset.status === 'published';
      }),
    };

    return pipeline;
  }

  async moveContentToStage(contentId: string, stage: string): Promise<void> {
    const statusMap: { [key: string]: ContentAsset['status'] } = {
      ideation: 'draft',
      scripting: 'draft',
      filming: 'review',
      approval: 'approved',
      posted: 'published',
      invoice_sent: 'published',
    };

    const updates: Partial<ContentAsset> = {
      status: statusMap[stage] || 'draft',
    };

    if (stage === 'posted') {
      updates.publishedAt = new Date();
    }

    await db.contentAssets.update(contentId, updates);
  }

  // Auto-generate deliverable tasks for brand deals
  private async generateDeliverableTasks(brandDeal: BrandDeal): Promise<void> {
    const tasks = brandDeal.deliverables.map(deliverable => ({
      id: uuidv4(),
      title: `${deliverable.type.toUpperCase()} for ${brandDeal.campaignName}`,
      description: `Create ${deliverable.description} for ${brandDeal.brandName}`,
      completed: false,
      priority: 'medium' as const,
      dueDate: deliverable.deadline,
      projectId: brandDeal.id,
      category: 'influencer',
      estimatedMinutes: this.getEstimatedMinutes(deliverable.type),
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending' as const,
      version: 1,
    }));

    await db.tasks.bulkAdd(tasks);
  }

  private getEstimatedMinutes(deliverableType: string): number {
    const estimates: { [key: string]: number } = {
      story: 30,
      post: 60,
      reel: 120,
      video: 240,
      blog: 180,
    };
    return estimates[deliverableType] || 60;
  }

  // Content Asset Management
  async createContentAsset(asset: Omit<ContentAsset, 'id'>): Promise<ContentAsset> {
    const newAsset: ContentAsset = {
      ...asset,
      id: uuidv4(),
    };

    await db.contentAssets.add(newAsset);
    return newAsset;
  }

  async getContentAsset(id: string): Promise<ContentAsset | undefined> {
    return await db.contentAssets.get(id);
  }

  async getContentAssetsByBrandDeal(brandDealId: string): Promise<ContentAsset[]> {
    return await db.contentAssets.where('brandDealId').equals(brandDealId).toArray();
  }

  async updateContentAsset(id: string, updates: Partial<ContentAsset>): Promise<void> {
    await db.contentAssets.update(id, updates);
  }

  async deleteContentAsset(id: string): Promise<void> {
    await db.contentAssets.delete(id);
  }

  async getAllContentAssets(): Promise<ContentAsset[]> {
    return await db.contentAssets.orderBy('id').toArray();
  }

  // Brand Management
  async createBrand(brand: Omit<Brand, 'id'>): Promise<Brand> {
    const newBrand: Brand = {
      ...brand,
      id: uuidv4(),
    };

    await db.brands.add(newBrand);
    return newBrand;
  }

  async getBrand(id: string): Promise<Brand | undefined> {
    return await db.brands.get(id);
  }

  async getBrandByName(name: string): Promise<Brand | undefined> {
    return await db.brands.where('name').equalsIgnoreCase(name).first();
  }

  async getAllBrands(): Promise<Brand[]> {
    return await db.brands.toArray();
  }

  async updateBrand(id: string, updates: Partial<Brand>): Promise<void> {
    await db.brands.update(id, updates);
  }

  async deleteBrand(id: string): Promise<void> {
    await db.brands.delete(id);
  }

  // Brand Conflict Detection
  async checkBrandConflicts(brandName: string, exclusivityClauses: string[]): Promise<{
    hasConflicts: boolean;
    conflicts: string[];
    isBlacklisted: boolean;
  }> {
    const brand = await this.getBrandByName(brandName);
    const conflicts: string[] = [];
    let isBlacklisted = false;

    if (brand) {
      isBlacklisted = brand.blacklisted;
      if (isBlacklisted && brand.blacklistReason) {
        conflicts.push(`Brand is blacklisted: ${brand.blacklistReason}`);
      }

      // Check for exclusivity conflicts with existing deals
      const activeBrandDeals = await db.brandDeals
        .where('status')
        .anyOf(['contract', 'content', 'posted'])
        .toArray();

      for (const deal of activeBrandDeals) {
        for (const clause of deal.exclusivityClauses) {
          for (const newClause of exclusivityClauses) {
            if (this.clausesConflict(clause, newClause)) {
              conflicts.push(`Exclusivity conflict with ${deal.brandName}: ${clause} conflicts with ${newClause}`);
            }
          }
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      isBlacklisted,
    };
  }

  private clausesConflict(existingClause: string, newClause: string): boolean {
    // Simple conflict detection - can be enhanced with more sophisticated logic
    const existingKeywords = existingClause.toLowerCase().split(' ');
    const newKeywords = newClause.toLowerCase().split(' ');
    
    // Check for overlapping keywords that might indicate conflicts
    const overlap = existingKeywords.filter(keyword => 
      newKeywords.includes(keyword) && keyword.length > 3
    );
    
    return overlap.length > 0;
  }

  // Script Management
  async createScript(script: Omit<Script, 'id'>): Promise<Script> {
    const newScript: Script = {
      ...script,
      id: uuidv4(),
    };

    await db.scripts.add(newScript);
    return newScript;
  }

  async getScript(id: string): Promise<Script | undefined> {
    return await db.scripts.get(id);
  }

  async getScriptsByBrandDeal(brandDealId: string): Promise<Script[]> {
    return await db.scripts.where('brandDealId').equals(brandDealId).toArray();
  }

  async updateScript(id: string, updates: Partial<Script>): Promise<void> {
    await db.scripts.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteScript(id: string): Promise<void> {
    await db.scripts.delete(id);
  }

  async getAllScripts(): Promise<Script[]> {
    return await db.scripts.orderBy('updatedAt').reverse().toArray();
  }
}

export const influencerService = new InfluencerService();