/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  console.log('🌱 Starting database seeding...');

  console.log('📝 Seeding permissions...');
  await prisma.permissions.createMany({
    data: [
      { id: 1, name: 'Settings', description: 'Manage the settings' },
      { id: 2, name: 'Users', description: 'Manage the users' },
      { id: 3, name: 'Roles', description: 'Manage the roles' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Permissions seeded successfully');

  console.log('📝 Seeding roles...');
  await prisma.roles.createMany({
    data: [
      {
        id: 1,
        name: 'Admin',
        description: 'The role that can change everything.',
      },
      { id: 2, name: 'Guest', description: 'Just a simple user' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Roles seeded successfully');

  console.log('📝 Seeding role permissions...');
  await prisma.permissionRole.createMany({
    data: [
      // Admin (roleId = 1) has full CRUD on permissions 1,2,3
      {
        roleId: 1,
        permissionId: 1,
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      {
        roleId: 1,
        permissionId: 2,
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      {
        roleId: 1,
        permissionId: 3,
        create: true,
        read: true,
        update: true,
        delete: true,
      },

      // Guest (roleId = 2)
      {
        roleId: 2,
        permissionId: 1,
        create: false,
        read: true,
        update: false,
        delete: false,
      },
      {
        roleId: 2,
        permissionId: 2,
        create: false,
        read: true,
        update: false,
        delete: false,
      },
      {
        roleId: 2,
        permissionId: 3,
        create: false,
        read: true,
        update: true,
        delete: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Role permissions seeded successfully');

  // Only create admin user in development environment
  if (!isProduction) {
    console.log('📝 Creating admin user (development only)...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.users.upsert({
      where: { id: '9caa1a04-4c32-4de3-b8ac-20b590809606' },
      update: {},
      create: {
        id: '9caa1a04-4c32-4de3-b8ac-20b590809606',
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        roleId: 1, // Admin role
      },
    });
    console.log('✅ Admin user created successfully');
  } else {
    console.log('ℹ️ Skipping admin user creation in production environment');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
