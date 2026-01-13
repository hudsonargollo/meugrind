import { unifiedDataService } from './unified-data-service';
import { Database } from './database';

export interface ConsistencyRule {
  id: string;
  name: string;
  description: string;
  sourceType: string;
  targetType: string;
  validate: (sourceEntity: any, targetEntities: any[]) => boolean;
  repair?: (sourceEntity: any, targetEntities: any[]) => Promise<void>;
}

class DataConsistencyService {
  private db: Database;
  private rules: ConsistencyRule[] = [];

  constructor() {
    this.db = new Database();
    this.initializeRules();
  }

  private initializeRules() {
    // Rule: Setlists should have valid songs
    this.rules.push({
      id: 'setlist-songs-exist',
      name: 'Setlist Songs Exist',
      description: 'All songs in a setlist must exist in the song database',
      sourceType: 'setlist',
      targetType: 'song',
      validate: (setlist, songs) => {
        if (!setlist.songs || !Array.isArray(setlist.songs)) return true;
        const songIds = songs.map(s => s.id);
        return setlist.songs.every((songId: string) => songIds.includes(songId));
      },
      repair: async (setlist, songs) => {
        const validSongIds = songs.map(s => s.id);
        const validSongs = setlist.songs.filter((songId: string) => validSongIds.includes(songId));
        await unifiedDataService.update('setlist', setlist.id, { songs: validSongs } as any);
      },
    });

    // Rule: Brand deals should not conflict with blacklisted brands
    this.rules.push({
      id: 'brand-deal-blacklist',
      name: 'Brand Deal Blacklist Check',
      description: 'Brand deals should not be created with blacklisted brands',
      sourceType: 'brand_deal',
      targetType: 'brand',
      validate: (brandDeal, brands) => {
        const blacklistedBrands = brands.filter(b => b.blacklisted).map(b => b.name);
        return !blacklistedBrands.includes(brandDeal.brandName);
      },
    });

    // Rule: Solar projects should have valid leads
    this.rules.push({
      id: 'solar-project-lead-exists',
      name: 'Solar Project Lead Exists',
      description: 'Solar projects must reference existing leads',
      sourceType: 'solar_project',
      targetType: 'solar_lead',
      validate: (project, leads) => {
        const leadIds = leads.map(l => l.id);
        return leadIds.includes(project.leadId);
      },
    });

    // Rule: Tasks should have valid due dates
    this.rules.push({
      id: 'task-valid-due-date',
      name: 'Task Valid Due Date',
      description: 'Task due dates should not be in the past when created',
      sourceType: 'task',
      targetType: 'task',
      validate: (task) => {
        if (!task.dueDate) return true;
        const dueDate = new Date(task.dueDate);
        const createdDate = new Date(task.createdAt);
        return dueDate >= createdDate;
      },
    });

    // Rule: Events should not overlap for the same user
    this.rules.push({
      id: 'event-no-overlap',
      name: 'Event No Overlap',
      description: 'Events for the same user should not overlap in time',
      sourceType: 'event',
      targetType: 'event',
      validate: (event, allEvents) => {
        const userEvents = allEvents.filter(e => e.userId === event.userId && e.id !== event.id);
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate || event.startDate);
        
        return !userEvents.some(otherEvent => {
          const otherStart = new Date(otherEvent.startDate);
          const otherEnd = new Date(otherEvent.endDate || otherEvent.startDate);
          
          return (eventStart < otherEnd && eventEnd > otherStart);
        });
      },
    });
  }

  async validateEntity(entityType: string, entity: any): Promise<{
    isValid: boolean;
    violations: Array<{ rule: ConsistencyRule; message: string }>;
  }> {
    const violations: Array<{ rule: ConsistencyRule; message: string }> = [];
    
    // Find applicable rules
    const applicableRules = this.rules.filter(rule => rule.sourceType === entityType);
    
    for (const rule of applicableRules) {
      try {
        let targetEntities: any[] = [];
        
        if (rule.targetType !== rule.sourceType) {
          targetEntities = await this.db.findAll(rule.targetType);
        } else {
          targetEntities = await this.db.findAll(rule.targetType);
        }
        
        const isValid = rule.validate(entity, targetEntities);
        
        if (!isValid) {
          violations.push({
            rule,
            message: `Consistency violation: ${rule.description}`,
          });
        }
      } catch (error) {
        console.error(`Error validating rule ${rule.id}:`, error);
        violations.push({
          rule,
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }
    
    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  async validateAllEntities(entityType: string): Promise<{
    totalEntities: number;
    validEntities: number;
    violations: Array<{ entityId: string; rule: ConsistencyRule; message: string }>;
  }> {
    const entities = await this.db.findAll(entityType);
    const violations: Array<{ entityId: string; rule: ConsistencyRule; message: string }> = [];
    let validEntities = 0;
    
    for (const entity of entities) {
      const validation = await this.validateEntity(entityType, entity);
      
      if (validation.isValid) {
        validEntities++;
      } else {
        validation.violations.forEach(violation => {
          violations.push({
            entityId: entity.id,
            rule: violation.rule,
            message: violation.message,
          });
        });
      }
    }
    
    return {
      totalEntities: entities.length,
      validEntities,
      violations,
    };
  }

  async repairViolations(entityType: string): Promise<{
    repaired: number;
    failed: Array<{ entityId: string; error: string }>;
  }> {
    const validation = await this.validateAllEntities(entityType);
    let repaired = 0;
    const failed: Array<{ entityId: string; error: string }> = [];
    
    // Group violations by entity and rule
    const violationsByEntity = new Map<string, Array<{ rule: ConsistencyRule; message: string }>>();
    
    validation.violations.forEach(violation => {
      if (!violationsByEntity.has(violation.entityId)) {
        violationsByEntity.set(violation.entityId, []);
      }
      violationsByEntity.get(violation.entityId)!.push({
        rule: violation.rule,
        message: violation.message,
      });
    });
    
    // Attempt to repair each entity
    for (const [entityId, entityViolations] of Array.from(violationsByEntity.entries())) {
      try {
        const entity = await this.db.findById(entityType, entityId);
        if (!entity) continue;
        
        for (const violation of entityViolations) {
          if (violation.rule.repair) {
            const targetEntities = await this.db.findAll(violation.rule.targetType);
            await violation.rule.repair(entity, targetEntities);
            repaired++;
          }
        }
      } catch (error) {
        failed.push({
          entityId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return { repaired, failed };
  }

  async getConsistencyReport(): Promise<{
    entityTypes: Array<{
      type: string;
      totalEntities: number;
      validEntities: number;
      violationCount: number;
      violations: Array<{ entityId: string; rule: string; message: string }>;
    }>;
    overallHealth: number;
  }> {
    const entityTypes = ['task', 'event', 'setlist', 'brand_deal', 'solar_project', 'solar_lead'];
    const report: any[] = [];
    let totalEntities = 0;
    let totalValidEntities = 0;
    
    for (const entityType of entityTypes) {
      const validation = await this.validateAllEntities(entityType);
      
      report.push({
        type: entityType,
        totalEntities: validation.totalEntities,
        validEntities: validation.validEntities,
        violationCount: validation.violations.length,
        violations: validation.violations.map(v => ({
          entityId: v.entityId,
          rule: v.rule.name,
          message: v.message,
        })),
      });
      
      totalEntities += validation.totalEntities;
      totalValidEntities += validation.validEntities;
    }
    
    const overallHealth = totalEntities > 0 ? (totalValidEntities / totalEntities) * 100 : 100;
    
    return {
      entityTypes: report,
      overallHealth,
    };
  }

  getRules(): ConsistencyRule[] {
    return [...this.rules];
  }

  addRule(rule: ConsistencyRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }
}

export const dataConsistencyService = new DataConsistencyService();
export default dataConsistencyService;