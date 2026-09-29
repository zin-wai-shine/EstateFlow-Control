// EstateFlow Control - Multi-Channel Publishing Service
import { db } from './storage';
import { PublishingRecord, PublishingChannel, Property, GeneratedContent } from '../types';

class PublishingService {
  public async approvePublishing(recordId: string): Promise<PublishingRecord> {
    const records = db.getPublishingRecords();
    const record = records.find(r => r.id === recordId);
    if (!record) throw new Error('Publishing record not found');

    record.isApproved = true;
    record.status = 'ready';
    db.savePublishingRecord(record);

    const property = db.getProperty(record.propertyId);
    db.addActivity({
      propertyId: record.propertyId,
      propertyName: property?.projectName,
      eventType: 'publishing',
      title: 'Listing Approved for Publishing',
      description: `Manual approval granted for channel: ${record.channel.replace('_', ' ').toUpperCase()}`,
      severity: 'info'
    });

    return record;
  }

  public async executePublish(recordId: string): Promise<PublishingRecord> {
    const records = db.getPublishingRecords();
    const record = records.find(r => r.id === recordId);
    if (!record) throw new Error('Publishing record not found');

    const property = db.getProperty(record.propertyId);
    if (!property) throw new Error('Associated property not found');

    const content = db.getContent(record.propertyId);
    if (!content && record.channel !== 'tiktok') {
      throw new Error('Listing content is missing in Content Studio. Please generate content before publishing.');
    }

    record.status = 'publishing';
    db.savePublishingRecord(record);

    db.addActivity({
      propertyId: property.id,
      propertyName: property.projectName,
      eventType: 'publishing',
      title: `Publishing to ${record.channel.replace('_', ' ').toUpperCase()}`,
      description: `Initiating browser automated publishing flow with active credentials.`,
      severity: 'info'
    });

    // Simulate realistic multi-step publishing automation
    await new Promise(r => setTimeout(r, 2200));

    record.status = 'published';
    record.publishedAt = new Date().toISOString();
    
    if (record.channel === 'facebook_marketplace') {
      record.publishedUrl = `https://www.facebook.com/marketplace/item/${Math.floor(100000000000000 + Math.random() * 900000000000000)}/`;
    } else if (record.channel === 'facebook_page') {
      record.publishedUrl = `https://facebook.com/estateflow/posts/${Date.now()}`;
    } else {
      record.publishedUrl = `https://www.tiktok.com/@estateflow/video/${Date.now()}`;
    }

    db.savePublishingRecord(record);

    db.addActivity({
      propertyId: property.id,
      propertyName: property.projectName,
      eventType: 'publishing',
      title: `Listing Successfully Published`,
      description: `Published to ${record.channel.replace('_', ' ')}. Live URL generated.`,
      severity: 'success'
    });

    return record;
  }

  public async createChannelRecord(propertyId: string, channel: PublishingChannel): Promise<PublishingRecord> {
    const settings = db.getSettings();
    const newRecord: PublishingRecord = {
      id: 'pub-' + Date.now() + '-' + channel,
      propertyId,
      channel,
      status: settings.automation.requireManualPublishApproval ? 'pending_approval' : 'ready',
      requiresManualApproval: settings.automation.requireManualPublishApproval,
      isApproved: !settings.automation.requireManualPublishApproval,
      createdAt: new Date().toISOString()
    };
    db.savePublishingRecord(newRecord);
    return newRecord;
  }
}

export const publishingService = new PublishingService();
