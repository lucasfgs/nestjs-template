const { PrismaClient } = require('@prisma/client');

const { Logger } = require('./logger');

/**
 * Simple Prisma service wrapper for serverless functions
 */
class PrismaService {
  constructor() {
    this.logger = new Logger('PrismaService');
    this.client = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Bind event handlers for logging
    this.client.$on('query', (e) => {
      this.logger.debug(
        `Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`,
      );
    });

    this.client.$on('error', (e) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });

    this.client.$on('info', (e) => {
      this.logger.log(`Prisma Info: ${e.message}`);
    });

    this.client.$on('warn', (e) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });
  }

  async connect() {
    try {
      await this.client.$connect();
      this.logger.log('Connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Failed to disconnect from database:', error);
    }
  }

  // Expose the client for direct usage
  get media() {
    return this.client.media;
  }

  get user() {
    return this.client.user;
  }

  get listing() {
    return this.client.listing;
  }

  get company() {
    return this.client.company;
  }

  // Add other models as needed
  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }
}

module.exports = { PrismaService };
